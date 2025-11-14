import { db } from "./db";

export const getAdminTopics = async () => {
    try {
        const topics = await db.document.findMany({
            distinct: ['topic'],
            select: {
                topic: true
            }
        })
        
        return topics.map(topic => topic.topic)
    } catch (error) {
        console.log(error);
        throw Error("Failed to fetch the data")
    }
}