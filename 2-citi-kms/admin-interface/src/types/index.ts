
export type User = {
    id: string,
    username: string,
    imgUrl: string,
    email: string,
    joinDate: string,
    likes: number,
    dislikes: number,
    chatsCount?: number,
    docsCount?: number,
    docsSize?: number
}

export type Doc = {
    id: number,
    title: string,
    originalName: string,
    topic: string,
    tag: string,
    ownerId: string,
    ownerName: string,
    ownerImgUrl: string,
    size: number,
    createdAt: string,
    updatedAt: string
}

export type PastInteractionData = {
    date: string,
    count: number
}