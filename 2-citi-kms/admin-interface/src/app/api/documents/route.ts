import { db } from "@/utils/db";
import { CustomResponse } from "@/utils/response";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/authOption";
import { NextRequest } from "next/server";
import { getNewConnection, writeToNas, deleteFromNas } from "@/utils/sftp";

// POST. Post a single document to the database
export const POST = async (req:NextRequest) => {
    const response = new CustomResponse()

    try {
        const sftpConn = await getNewConnection()
        const session = await getServerSession(authOptions) as any
    
        if (!session) return response.sendError("Admin must be logged in", 401)

        const formData = await req.formData()

        const file = formData.get('file') as File
        const title = formData.get('title') as string
        const topic = formData.get('topic') as string

        // validate the attributes
        if (!file || !title || !topic) return response.sendError("Please fill all the required fields!", 400)

        // write to DB
        const doc = await db.document.create({
            data: {
                title: title,
                topic: topic,
                original_name: file.name,
                file_size: file.size,
                createdAt: new Date(),
                userId: session.user.id
            },
            include: {
                User: {
                    select: {
                        username: true, 
                        img_url: true
                    }
                }
            }
        })

        // Write to NAS
        const dir = `${process.env.SFTP_PUBLIC_DIR}/${session.user.id}`

        // Check if user already has a folder. If not, create a folder
        const exists = await sftpConn?.exists(dir)

        if (!exists) await sftpConn?.mkdir(dir, true)
        
        // Write the file
        const buffer = Buffer.from(await file.arrayBuffer())
        const extension = doc.original_name.slice(doc.original_name.lastIndexOf('.') + 1)
        await writeToNas(sftpConn, buffer, dir, doc.id, extension)

        // Write to VDB
        const res = await fetch(`${process.env.LLM_SERVER_URL}/document/insert`, {
            method: 'POST',
            headers: {
                'Content-type':'application/json', 
                'Accept':'application/json'
            },
            body: JSON.stringify({
                "user_id": session.user.id,
                "document_id": doc.id.toString(),
                "tag": extension,
                "collection_name": "public"
            })
        })
        const resPayload = await res.json()

        if (!res.ok) throw new Error(resPayload.message)
        
        // format doc
        const data = {
            id: doc.id,
            title: doc.title,
            topic: doc.topic,
            tag: extension,
            ownerId: doc.userId,
            ownerName: doc.User?.username,
            ownerImgUrl: doc.User?.img_url,
            size: (doc.file_size / (1024 * 1024)).toPrecision(1),
            createdAt: new Date(doc.createdAt).toDateString()
        }
        
        return response.sendSuccess("The file has been uploaded successfully", data)
        
    } catch (error) {
        console.log(error);
        
        return response.sendError("Upload file error!")
    } 
}

// GET. Get all documents including all necessary informations
export const GET = async (req:NextRequest) => {
    const response = new CustomResponse()
    try {
        const url = new URL(req.url)
        const search = url.searchParams.get('search')
        const userId = url.searchParams.get('userId')
        const tags = url.searchParams.getAll('tag')
        const minDate = url.searchParams.get('minDate')
        const maxDate = url.searchParams.get('maxDate')
        const minSize = url.searchParams.get('minSize')
        const maxSize = url.searchParams.get('maxSize')
        const skip = Number(url.searchParams.get('page') || 1) - 1
        const take = Number(url.searchParams.get('n') || 10)
        
        if (skip < 0 || take > 50) return response.sendError("Invalid parameter", 400)

        const paginationFilter = {
            skip: skip * take,
            take: take
        }

        let objectFilter:any = {
            orderBy: [
                { createdAt: 'desc' }
            ],
            where: {
                AND:[
                    { deletedAt: null }
                ]
            }
        }
    
        // Search by title or topic
        if (search) {
            objectFilter.where.AND.push({
                OR: [
                    {
                        title: { startsWith: search, mode: 'insensitive' }
                    },
                    {
                        topic: { startsWith: search, mode: 'insensitive' }
                    }
                ]
            })
        }

        // Filter by userId
        if (userId) {
            objectFilter.where.AND.push({
                userId: userId
            })
        }

        // Filter by tags
        if (tags.length !== 0) {
            objectFilter.where.AND.push({
                OR: tags.map(tag => {
                    return {
                        original_name: { endsWith: tag }
                    }
                })
            })
        }

        // Filter by size
        if (minSize || maxSize) {
            objectFilter.where.AND.push(
                { file_size: { gte: Number(minSize || 0) * 1024 * 1024 }},
                { file_size: { lte: maxSize ? Number(maxSize) *1024*1024 : 500*1024*1024 }}
            )
        }

        // Filter by date
        if (minDate || maxDate) {
            const lastMinDate = minDate ? new Date(minDate) : new Date(0)
            const lastMaxDate = maxDate ? new Date(maxDate) : new Date()
            lastMinDate.setHours(0, 0, 0, 0)
            lastMaxDate.setHours(23, 59, 59, 999)

            objectFilter.where.AND.push(
                { createdAt: { gt: lastMinDate} },
                { createdAt: { lt: lastMaxDate} }
            )
        }
        // Get the user info if there's userId in searchParams
        var userInFilter = null
        if (userId) {
            userInFilter = await db.user.findUnique({ where: { id: userId } })
        }
        

        const docsCount = await db.document.count(objectFilter)

        // include Users info
        objectFilter.include = { 
            User: {
                select: {
                    username: true,
                    img_url: true
                }
            }
        }

        const docs:any[] = await db.document.findMany({...paginationFilter, ...objectFilter })
        const docsData = docs.map(item => {
            return {
                id: item.id,
                title: item.title,
                originalName: item.original_name,
                topic: item.topic,
                tag: item.original_name.slice(item.original_name.lastIndexOf('.') + 1),
                ownerId: item.userId,
                ownerName: item.User.username,
                ownerImgUrl: item.User.img_url,
                size: (Math.round((item.file_size / (1024 * 1024)) * 100) / 100).toFixed(2),
                createdAt: new Date(item.createdAt).toDateString(),
                updatedAt: new Date(item.updatedAt ? item.updatedAt : item.createdAt).toDateString()
            }
        })
        
        const data = {
            docs: docsData,
            docsCount,
            userInFilter: userInFilter ? {
                id: userInFilter.id,
                username: userInFilter.username,
                imgUrl: userInFilter.img_url,
                email: userInFilter.email,
                joinDate: userInFilter.createdAt,
            } : null
        }
        

        return response.sendSuccess("Success", data)
    } catch (error) {
        console.log(error)

        return response.sendError("Failed fetching the data")
    }
}

// PATCH. Update a particular document
export const PATCH = async (req: NextRequest) => {
    const response = new CustomResponse()

    try {
        const session = await getServerSession(authOptions) as any

        if (!session) return response.sendError("Admin must be logged in", 401)

        const { attribute, value, docId } = await req.json()
        
        if (!attribute || !value || !docId) return response.sendError("Please provide all the required attributes", 400)
        
        const updatedDoc = await db.document.update({
            where: { id: docId },
            data: { [attribute]: value } 
        })
        
        return response.sendSuccess("The document has been updated successfully", updatedDoc)
        
    } catch (error) {
        console.log(error);
        
        return response.sendError("Failed to update the document")
    }
}

// DELETE. Delete a document from the server
export const DELETE = async (req:NextRequest) => {
    const response = new CustomResponse()

    try {
        const sftpConn = await getNewConnection()
        const session = await getServerSession(authOptions) as any

        if (!session) return response.sendError("Admin must be logged in", 401)

        const url = new URL(req.url)
        const id = url.searchParams.get('id')

        if (!id) return response.sendError("Invalid id", 400)
        
        // Check if the document exists
        const exists = await db.document.findUnique({
            where: { id: Number(id) }
        })

        if (!exists) return response.sendError("Invalid id", 400)

        // Delete from NAS first
        const dir = `${process.env.SFTP_PUBLIC_DIR}/${session.user.id}`
        const extension = exists.original_name.slice(exists.original_name.lastIndexOf('.') + 1)
        await deleteFromNas(sftpConn, dir, exists.id, extension)

        // Delete from VDB
        const res = await fetch(`${process.env.LLM_SERVER_URL}/document/delete?document_id=${id}&collection_name=private`, {
            method: 'DELETE'
        })
        const resPayload = await res.json()

        if(!res.ok) throw new Error(resPayload.message)
        
        // Delete from sql
        await db.document.delete({
            where: { id: Number(id) }
        })

        return response.sendSuccess("Success")
        
    } catch (error) {
        console.log(error)
        
        return response.sendError("Failed deleting the data")
    }
}