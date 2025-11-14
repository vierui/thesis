import { db } from "@/utils/db";
import { notFound } from "next/navigation";
import { CustomResponse } from "@/utils/response";
import { createdReadStream, getNewConnection, bulkDeleteFromNas, bulkUploadToNas } from "@/utils/sftp";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOption";
import { NextResponse, type NextRequest } from "next/server";
import { streamFile } from "@/utils";

interface Props {
    params: { action: string }
}

// ALL POST REQUESTS
export async function POST (req: NextRequest, { params }:Props) {
    const { action } = params
    const response = new CustomResponse()
    
    if (action === 'bulk-delete') {
        try {
            const sftpConn = await getNewConnection()
            const session = await getServerSession(authOptions) as any
            const { ids } = await req.json()

            if (!session) return response.sendError("Admin must be logged in", 401)

            // get soon-deleted docs
            const exists = await db.document.findMany({
                where: {
                    id: { in: ids }
                }
            })

            // delete from nas first
            const dir = `${process.env.SFTP_PUBLIC_DIR}/${session.user.id}`
            const extensions = exists.map(item => item.original_name.slice(item.original_name.lastIndexOf('.') + 1))
            const docIds = exists.map(item => item.id)

            await bulkDeleteFromNas(sftpConn, dir, docIds, extensions)

            // delete from database
            await db.document.deleteMany({
                where: {
                    id: {
                        in: ids
                    }
                }
            })

            return response.sendSuccess("Success")
        } catch (error) {
            console.log(error);
            
            return response.sendError("Failed deleting the data")
        }
    } else if (action === 'bulk-upload') {
        try {
            const sftpConn = await getNewConnection()
            const session = await getServerSession(authOptions) as any

            if (!session) return response.sendError("Admin must be logged in", 401)

            const formData = await req.formData()
            const files = formData.getAll('file')
            const topic = formData.get('topic')

            if (!files || !topic) return response.sendError("Fill all the required fields", 400)

            // write to sql
            const insertData = files.map(item => {
                const file = item as File
                return {
                    title: file.name as string,
                    original_name: file.name as string,
                    topic: topic as string,
                    userId: session.user.id,
                    file_size: file.size
                }
            })

            const docs = await db.document.createManyAndReturn({
                data: insertData,
                include: {
                    User: {
                        select: {
                            username: true, 
                            img_url: true
                        }
                    }
                }
            })

            // write to nas
            const dir = `${process.env.SFTP_PUBLIC_DIR}/${session.user.id}`
            const extensions = docs.map(item => item.original_name.slice(item.original_name.lastIndexOf('.') + 1))
            const docIds = docs.map(item => item.id)
            const buffers = await Promise.all(files.map(async item => Buffer.from(await (item as File).arrayBuffer())))

            // Check if user already has a folder. If not, create a folder
            const exists = await sftpConn?.exists(dir)

            if (!exists) await sftpConn?.mkdir(dir, true)

            await bulkUploadToNas(sftpConn, dir, docIds, buffers, extensions)
            

            // Write to VDB
            await Promise.all(docIds.map(async (item, i) => {
                const res = await fetch(`${process.env.LLM_SERVER_URL}/document/insert`, {
                    method: 'POST',
                    headers: {
                        'Content-type':'application/json', 
                        'Accept':'application/json'
                    },
                    body: JSON.stringify({
                        "user_id": session.user.id,
                        "document_id": item.toString(),
                        "tag": extensions[i],
                        "collection_name": "public"
                    })
                })
                
                if (!res.ok) throw new Error("Error has occured while indexin the document")
            }))

            const data = docs.map(item => {
                return {
                    id: item.id,
                    title: item.title,
                    topic: item.topic,
                    tag: item.original_name.slice(item.original_name.lastIndexOf('.') + 1),
                    ownerId: item.userId,
                    ownerName: item.User?.username,
                    ownerImgUrl: item.User?.img_url,
                    size: (item.file_size / (1024 * 1024)).toPrecision(1),
                    createdAt: new Date(item.createdAt).toDateString()
                }
            })

            return response.sendSuccess("Sucess", data)
        } catch (error) {
            console.log(error);
            return response.sendError("Error Bosq")
        }
    }
    return notFound()
}

// ALL GET REQUESTS
export async function GET (req: NextRequest, { params }:Props) {
    const { action } = params
    const response = new CustomResponse()
    
    if (action === 'download') {
        try {
            const sftpConn = await getNewConnection()
            const session = await getServerSession(authOptions) as any
            
            const id = req.nextUrl.searchParams.get('id')

            if (!session) return response.sendError("Admin must be logged in", 401)

            if (!id) return response.sendError("No id provieded", 400)
            
            // Check if document exists
            const exists = await db.document.findUnique({
                where: { id: Number(id) }
            })

            if (!exists) return response.sendError("Document doesn't exists", 400)

            // Get the stream from nas
            const dir = `${process.env.SFTP_PUBLIC_DIR}/${session.user.id}`
            const extension = exists.original_name.slice(exists.original_name.lastIndexOf('.') + 1)
            const readStream = await createdReadStream(sftpConn, dir, exists.id, extension)
            
            const data: ReadableStream = streamFile(readStream) 

            const res = new NextResponse(data, {
                status: 200,
                headers: new Headers({
                    "Content-Disposition": `attachment; filename=${exists.id}.${extension}`,
                    "Content-Type": "application/octet-stream"
                })
            })

            readStream.on('close', () => {
                sftpConn.end()
            })

            readStream.on('error', (err:any) => {
                sftpConn.end()
                console.log(err);
                throw new Error("Error sending file stream")
            })
            
            return res

        } catch (error) {
            console.log(error);
            
            return response.sendError("Failed to download the file")
        }
    }
    return notFound()
}