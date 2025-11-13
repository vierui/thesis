// File: app/api/retrievedocs/[messageId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ messageId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = await context.params;
    const messageIdNum = parseInt(messageId);

    if (isNaN(messageIdNum)) {
      return NextResponse.json({ message: "Invalid Message ID" }, { status: 400 });
    }

    // Cari pesan di DB berdasarkan ID-nya
    const message = await prisma.message.findUnique({
      where: {
        id: messageIdNum,
        // Tambahin cek userId biar aman, user gak bisa liat chat orang lain
        userId: userId, 
      },
      // Ambil HANYA kolom retrieved_docs
      select: {
        retrieved_docs: true,
      },
    });

    if (!message) {
      return NextResponse.json({ message: "Message not found" }, { status: 404 });
    }
    const rawDocs = message.retrieved_docs as any[]; // Anggap ini array objek

    // Pake Map buat nyimpen dokumen unik berdasarkan document_id
    const seen = new Map();
    rawDocs.forEach(doc => {
      // `document_id` akan jadi 'KTP'-nya
      
      if (doc && doc.document_id) {
        if (!seen.has(doc.document_id)) { 
    
         seen.set(doc.document_id, doc); 
    }
      }
    });

    // Ubah Map kembali jadi array
    const uniqueDocs = Array.from(seen.values());
  
    // Balikin isi kolom yang SUDAH DISARING dan unik
    return NextResponse.json(uniqueDocs);

  } catch (error) {
    console.error("Gagal mengambil retrieved docs:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}