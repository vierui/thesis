import { db } from "@/utils/db";
import { notFound } from "next/navigation";
import { CustomResponse } from "@/utils/response";
import type { NextRequest } from "next/server";

interface Props {
  params: { info: string }
}

// GET ALL STATISTICS
export async function GET(req: NextRequest, { params }:Props) {
    const { info } = params
    const url = new URL(req.url)
    const response = new CustomResponse()

    if (info === "public-documents-count") {
      try {
        const date = url.searchParams.get('date')
        const lastDateTime = date ? new Date(date) : new Date()
        lastDateTime.setHours(23, 59, 59, 999)
        const publicDocsCount = await db.document.count({
          where: {
            createdAt: {
              lt: lastDateTime
            }
          }
        })
        return response.sendSuccess("Success", publicDocsCount)
      } catch (error) {
        console.log(error);
        
        return response.sendError("Failed fetching the data")
      }
    } else if (info === "private-documents-count") {
      try {
        const date = url.searchParams.get('date')
        const lastDateTime = date ? new Date(date) : new Date()
        lastDateTime.setHours(23, 59, 59, 999)
        const privateDocsCount = await db.document.count({
          where: {
            createdAt: {
              lt: lastDateTime
            }
          }
        })
        return response.sendSuccess("Success", privateDocsCount)
      } catch (error) {
        console.log(error);
        return response.sendError("Failed fetching the data")
      }
    } else if (info === "total-likes") {
      try {
        const date = url.searchParams.get('date')
        const lastDateTime = date ? new Date(date) : new Date()
        lastDateTime.setHours(23, 59, 59, 999)
        const likes = await db.message.count({
          where: {
            liked: true,
            createdAt: {
              lt: lastDateTime
            }
          }
        })
        return response.sendSuccess("Success", likes)
      } catch (error) {
        console.log(error);
        return response.sendError("Failed fetching the data")
      }
    } else if (info === "total-dislikes") {
      try {
        const date = url.searchParams.get('date')
        const lastDateTime = date ? new Date(date) : new Date()
        lastDateTime.setHours(23, 59, 59, 999)
        const dislikes = await db.message.count({
          where: {
            disliked: true,
            createdAt: {
              lt: lastDateTime
            }
          }
        })
        
        return response.sendSuccess("Success", dislikes)
      } catch (error) {
        console.log(error);
        return response.sendError("Failed fetching the data")
      }
    } else if (info === "avg-rating") {
      try {
        const date = url.searchParams.get('date')
        const lastDateTime = date ? new Date(date) : new Date()
        lastDateTime.setHours(23, 59, 59, 999)
        const avgRating = await db.message.aggregate({
          where: {
            createdAt: {
              lt: lastDateTime
            }
          },
          _avg: {
            rating: true
          }
        })
        
        return response.sendSuccess("Success", (Math.round((avgRating._avg.rating || 0) * 100) / 100).toFixed(2))
      } catch (error) {
        console.log(error);
        return response.sendError("Failed fetching the data")
      }
    } else if (info === "users-count") {
      try {
        const date = url.searchParams.get('date')
        const lastDateTime = date ? new Date(date) : new Date()
        lastDateTime.setHours(23, 59, 59, 999)
        const usersCount = await db.user.count({
          where: {
            createdAt: {
              lt: lastDateTime
            }
          }
        })
        return response.sendSuccess("Success", usersCount)
      } catch (error) {
        console.log(error);
        return response.sendError("Failed fetching the data")
      }
    } else if (info === "system-metrics") {
      try {
        const avgResponseTime = await db.message.aggregate({
          _avg: {
            response_time: true
          }
        })
        const data = {
          avgResponseTime: (Math.round((avgResponseTime._avg.response_time || 0) * 100) / 100).toFixed(2)
        }
        return response.sendSuccess("Success", data)
      } catch (error) { 
        console.log(error);
        return response.sendError("Failed fetching the data")
      }
    } else if (info === "resource-usage") {
      const url = `${process.env.DOCKER_URL}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: 'no-cache'
      })

      if(!res.ok) return response.sendError("Failed fetching the resource usage")

      const data = await res.json()
      const usedMemory = data.memory_stats.usage - data.memory_stats.stats.total_inactive_file
      const availableMemory = data.memory_stats.limit
      const memoryUsage = (usedMemory / availableMemory) * 100.0
      const cpuDelta = data.cpu_stats.cpu_usage.total_usage - data.precpu_stats.cpu_usage.total_usage
      const systemCpuDelta = data.cpu_stats.system_cpu_usage - data.precpu_stats.system_cpu_usage
      const numberCpus = data.cpu_stats.online_cpus
      const cpuUsage = (cpuDelta / systemCpuDelta) * numberCpus * 100.0
      const sentNetworkData = (data.networks.eth0.tx_bytes / 1024).toFixed(2)
      const receivedNetworkData = (data.networks.eth0.rx_bytes / 1024).toFixed(2)

      const resData = {
        memoryUsage,
        usedMemory,
        availableMemory,
        numberCpus,
        cpuUsage,
        sentNetworkData,
        receivedNetworkData
      }

      return response.sendSuccess("Success", resData)
     
    } else if (info === "user-interactions") {
      try {
        const date = url.searchParams.get('date') ? new Date(url.searchParams.get('date')) : new Date()
        const date30DaysAgo = new Date(date)
        date30DaysAgo.setDate(date.getDate() - 30)
        const dateStr = date.toISOString().replace('T', ' ').replace('Z', '')
        const date30DaysStr = date30DaysAgo.toISOString().replace('T', ' ').replace('Z', '')

        const interactions = await db.$queryRaw`
          SELECT 
          CONCAT(
            EXTRACT(DAY FROM "createdAt")::text, '-', 
            EXTRACT(MONTH FROM "createdAt")::text, '-', 
            EXTRACT(YEAR FROM "createdAt")::text
          ) AS date,
          COUNT(*)::int AS count
          FROM "Message"
          WHERE 
            "createdAt" <= to_timestamp(${dateStr}, 'YYYY-MM-DD HH24:MI:SS')
            AND
            "createdAt" >= to_timestamp(${date30DaysStr}, 'YYYY-MM-DD HH24:MI:SS')
          GROUP BY 
            EXTRACT(DAY FROM "createdAt"), 
            EXTRACT(MONTH FROM "createdAt"),
            EXTRACT(YEAR FROM "createdAt")
          ORDER BY 
            EXTRACT(MONTH FROM "createdAt") ASC,
            EXTRACT(DAY FROM "createdAt") ASC
        ` as []
        
        const dateMap = new Map(Array.from({ length: 30 }, (_) => {
          date30DaysAgo.setDate(date30DaysAgo.getDate() + 1)
          const day = date30DaysAgo.getDate()
          const month = date30DaysAgo.getMonth() + 1
          const year = date30DaysAgo.getFullYear()
          return [`${day}-${month}-${year}`, 0]
        }))

        interactions.forEach(({ date, count }) => {
          dateMap.set(date, count)
        })

        const data = Array.from(dateMap, ([date, count]) => ({ date, count }));

        return response.sendSuccess("Success", data)
        
      } catch (error) {
        console.log(error);
        return response.sendError("Error fetching users interactions")
      }
    }

    return notFound()
  }