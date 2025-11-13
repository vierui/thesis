"use server";
import { prisma } from "@/db";
import { DocumentProps } from "@/types";

export async function accumulatedSizeOfDocuments(id: string) {
  try {
    const documents = await prisma.document.groupBy({
      by: ["userId"],
      _sum: {
        file_size: true,
      },
      where: {
        userId: id,
        deletedAt: null,
      },
    });

    if (documents.length === 0) return 0;
    const file_size = documents[0]._sum.file_size
      ? documents[0]._sum.file_size / (1024 * 1024 * 1024)
      : 0;
    return Number(file_size.toFixed(2));
  } catch (err) {
    console.error("Error fetching documents", err);
  }
}

export async function numberOfDocuments(id: string) {
  try {
    const documents = await prisma.document.count({
      where: {
        userId: id,
      },
    });
    return documents;
  } catch (err) {
    console.error("Error fetching documents", err);
  }
}

export async function getDocumentsByIds(ids: number[]): Promise<DocumentProps[]> {
  if (!ids || ids.length === 0) {
    return [];
  }

  try {
    const documents = await prisma.document.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        original_name: true,
        topic: true,
        // tambahin kolom lain kalo perlu
      },
    });
    // @ts-ignore
    return documents;
  } catch (error) {
    console.error("Gagal fetch detail dokumen:", error);
    return [];
  }
}