// File: app/api/chatbox/[chatBoxId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/db";
// Lo udah gak butuh `getDocumentsByIds` dan `DocumentProps` lagi di sini
// import { getDocumentsByIds } from "@/lib/document-queries";
// import { DocumentProps } from "@/types";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ chatboxId: string }> }
) {
  try {
    // --- Bagian verifikasi & otentikasi (ini tetep sama dan udah bener) ---
    const { userId } = await auth();
    if (!userId) {
       return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
     }
    const { chatboxId } = await context.params;
    const chatboxIdNum = parseInt(chatboxId);
    if (!chatboxIdNum) { /* ... */ }
    const chatbox = await prisma.chatBox.findFirst({ /* ... */ });
    if (!chatbox) { /* ... */ }

    // 1. Ambil pesan dari DB.
    // TANPA `select`, Prisma akan mengambil SEMUA kolom, termasuk skor.
    const messages = await prisma.message.findMany({
      where: {
        chatBoxId: chatboxIdNum,
      },
      select: {
    id: true,
    chatBoxId: true,
    userId: true,
    request: true,
    response: true,
    rating: true,
    disliked: true,
    liked: true,
    response_time: true,
    createdAt: true,
    retrieved_docs: true,
    // INI YANG PALING PENTING:
    faithfulness: true,
    answer_relevancy: true,
    context_precision: true,
    context_relevance: true,
      },

      orderBy: {
        createdAt: "asc",
      },
    });

    // 2. Olah data mentah jadi siap saji untuk frontend
    // Kita cuma perlu nyaring duplikat dari `retrieved_docs`
    const messagesForFrontend = messages.map(msg => {
      let uniqueSourceDocs = [];
      // Saring `retrieved_docs` jadi `sourceDocs` yang unik
      if (msg.retrieved_docs && Array.isArray(msg.retrieved_docs)) {
        const seen = new Map();
        (msg.retrieved_docs as any[]).forEach(doc => {
          if (doc && doc.document_id) {
            if(!seen.has(doc.document_id)) {
              seen.set(doc.document_id, doc);
            }  
          }
        });
        uniqueSourceDocs = Array.from(seen.values());
      }
      // console.log("Unique Source Docs:", uniqueSourceDocs);
      // Return semua data asli dari `msg` (yang udah ada skornya)
      // plus `sourceDocs` yang udah bersih
      return { ...msg, sourceDocs: uniqueSourceDocs };
    });
    // console.log("Messages for Frontend:", messagesForFrontend);
    // 3. Kirim data yang sudah lengkap dan bersih
    return NextResponse.json(
      {
        message: "Messages fetched successfully",
        data: messagesForFrontend,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching chatbox messages :", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}