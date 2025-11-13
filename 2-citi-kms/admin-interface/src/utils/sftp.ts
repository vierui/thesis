import SftpClient from "ssh2-sftp-client"
import { db } from "./db"

export const getNewConnection = async () => {
    const c = new SftpClient()
    try {
        await c.connect({
            host: process.env.SFTP_HOST,
            port: Number(process.env.SFTP_PORT),
            username: process.env.SFTP_USERNAME,
            password: process.env.SFTP_PASSWORD
        })
        return c    
    } catch (error) {
        console.log(error);
        throw error
    }
}

export const writeToNas = async (sftpConn: SftpClient, buffer: Buffer, dir: string, docId: number, extension: string) => {
    try {
        await sftpConn.put(buffer, `${dir}/${docId}.${extension}`)
    } catch (error) {
        console.log(error);
        
        // remove metadata from the database
        await db.document.delete({
            where: { id: docId }
        })

        throw error
    } finally {
        await sftpConn.end()
    }
}

export const deleteFromNas = async (sftpConn: SftpClient, dir: string, docId: number, extension: string) => {
    try {
        await sftpConn.delete(`${dir}/${docId}.${extension}`)
    } catch (error) {
        console.log(error);
        
        throw error
    } finally {
        await sftpConn.end()
    }
}

export const createdReadStream = async (sftpConn: SftpClient, dir: string, docId: number, extension: string) => {
    try {
        const readStream = sftpConn.createReadStream(`${dir}/${docId}.${extension}`)
        return readStream
    } catch (error) {
        console.log(error);
        
        throw error
    } 
}

export const bulkDeleteFromNas = async (sftpConn: SftpClient, dir: string, docIds: number[], extensions: string[]) => {
    try {
        await Promise.all(docIds.map(async (item, i) => {
            await sftpConn.delete(`${dir}/${item}.${extensions[i]}`)
        }))
    } catch (error) {
        console.log(error);
        
        throw error
    } finally {
        await sftpConn.end()
    }
}

export const bulkUploadToNas = async (sftpConn: SftpClient, dir: string, docIds: number[], buffers: Buffer[], extensions: string[]) => {
    try {
        await Promise.all(docIds.map(async (docId, i) => {
            await sftpConn.put(buffers[i], `${dir}/${docId}.${extensions[i]}`)
        }))
    } catch (error) {
        console.log(error);
        await db.document.deleteMany({
            where: {
                id: { in: docIds }
            }
        })
        throw error
    } finally {
        await sftpConn.end()
    }
}