import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  // Karena kita kirim JSON dari client, kita pakai request.json()
  const { prompt } = await request.json();

  if (!prompt) {
    return NextResponse.json(
      { message: "Prompt is required" },
      { status: 400 }
    );
  }

  // Body yang akan dikirim ke server LLM
  const body = {
    prompt: prompt,
  };

  try {
    const { getToken } = await auth();
    const token = await getToken();

    const response = await fetch(
      // Panggil endpoint baru di server LLM
      process.env.LLM_URL + "/llm/generate-title",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Tetap pakai auth jika backendmu memerlukannya
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
        // Handle jika server LLM mengembalikan error
        const errorData = await response.json();
        return NextResponse.json(
            { message: errorData.message || "Error from LLM server" },
            { status: response.status }
        );
    }
    
    // Server LLM kita mengembalikan { payload: { title: "..." } }
    const data = await response.json();

    // Kirim kembali payloadnya ke client
    return NextResponse.json(data.payload, { status: 200 });

  } catch (err) {
    console.error("Error in generate-title proxy:", err);
    return NextResponse.json(
      { message: "Error fetching title" },
      { status: 500 }
    );
  }
}
