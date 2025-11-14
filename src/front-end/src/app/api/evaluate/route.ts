import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const LLM_SERVICE_URL = process.env.LLM_URL + "/llm/evaluate";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { messageId, question, answer, contexts } = body;

    // Terusin request-nya ke service Python
    const response = await fetch(LLM_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message_id: messageId,
        question: question,
        answer: answer,
        contexts: contexts, // Python nerimanya sebagai 'contexts'
      }),
    });

    if (!response.ok) {
      throw new Error("Gagal memicu evaluasi di service LLM");
    }

    return NextResponse.json({ message: "Evaluation successfully scheduled" });

  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}