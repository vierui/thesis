import { db } from "@/utils/db";
import { CustomResponse } from "@/utils/response";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
    const response = new CustomResponse()
    
    try {
        const url = new URL(req.url)
        const search = url.searchParams.get('search')
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
            ]
        }
        
        // Search by username or email
        if (search) objectFilter.where = {
            OR: [
                {
                    email: { startsWith: search, mode: 'insensitive' }
                },
                {
                    username: { startsWith: search, mode: 'insensitive' }
                }
            ]
        }

        const users = await db.user.findMany({...paginationFilter, ...objectFilter})
        const totalUsers = await db.user.count(objectFilter)
        const usersData = await Promise.all(users.map(async item => {
            return {
                id: item.id,
                username: item.username,
                imgUrl: item.img_url,
                email: item.email,
                joinDate: new Date(item.createdAt).toDateString(),
                likes: await db.message.count({
                    where: { 
                        userId: item.id,
                        liked: true
                    }
                }),
                dislikes: await db.message.count({
                    where: { 
                        userId: item.id,
                        disliked: true
                    }
                }),
                chatsCount: await db.chatBox.count({
                    where: { userId: item.id }
                }),
                docsCount: await db.document.count({
                    where: { userId: item.id }
                }),
                docsSize: await db.document.aggregate({
                    _sum: { 
                        file_size: true
                    },
                    where: {
                        userId: item.id
                    }
                }).then(res => (res._sum.file_size || 0) / (1024 * 1024 * 1024))
            }
        }))
        const data = {
            totalUsers,
            users: usersData
        }

        return response.sendSuccess("Success", data)
    } catch (error) {
        console.log(error)
        
        return response.sendError("Failed to fetch the data")
    }
}

export const DELETE = async (req: NextRequest) => {
    const response = new CustomResponse()

    try {
        const url = new URL(req.url)
        const id = url.searchParams.get('id')

        if (!id) return response.sendError("Invalid id", 400)
        
        // Check if the user exists
        const exists = await db.user.findUnique({
            where: { id }
        })

        if (!exists) return response.sendError("Invalid id", 400)
        
        // DELETE
        await db.user.delete({
            where: { id }
        })

        return response.sendSuccess("Success")
        
    } catch (error) {
        console.log(error)
        
        return response.sendError("Failed deleting the data")
    }
}