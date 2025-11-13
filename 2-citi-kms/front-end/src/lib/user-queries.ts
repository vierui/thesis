"use server"
import { prisma } from "@/db"
import { PrismaClient } from "@prisma/client"

export async function getUserInfo(userId: string, ) {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                username: true,
                img_url: true,
                first_name: true,
                last_name: true,
                email: true
            }
        })
        return user
    } catch (error) {
        console.log(error);
        return null
    }
}

export async function checkIfUserExistInDb(userId: string): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        })
        if (user) {
            return true
        }
        return false
    } catch (error) {
        console.log(error);
    }
    return false
}

export async function registerUser(userId: string, email: string, username: string, firstName: string, lastName: string, img_url: string) {
    try {
        const user = await prisma.user.create({
            data: {
                id: userId,
                email: email,
                username: username,
                first_name: firstName,
                last_name: lastName,
                img_url: img_url

            }
        })

        return user

    } catch (error) {
        console.log(error);
        return null
    }
}

export async function updateUser(userId: string, email: string, username: string, firstName: string, lastName: string, img_url: string) {
    if (globalThis.prisma == null) {
        globalThis.prisma = new PrismaClient();
    }

    try {
        const user = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                email: email,
                username: username,
                first_name: firstName,
                last_name: lastName,
                img_url: img_url

            }
        })

        return user
    } catch (error) {
        console.log(error);
        return null
    }
}