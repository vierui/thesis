import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { question, speaker_voices } = body;

    if (!question) {
      return NextResponse.json(
        { message: "Question is required" },
        { status: 400 }
      );
    }

    // Prepare the request body for the backend
    const requestBody = {
      question: question,
      user_id: userId,
      speaker_voices: speaker_voices || undefined
    };

    console.log("TTS Request:", requestBody);
    console.log("LLM Server URL:", process.env.LLM_URL);

    if (!process.env.LLM_URL) {
      return NextResponse.json(
        { message: "LLM_URL environment variable is not configured" },
        { status: 500 }
      );
    }

    // Make request to the backend TTS service
    const response = await fetch(
      `${process.env.LLM_URL}/tts/podcast/conversational`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log("Backend response status:", response.status);
    console.log("Backend response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error response:", errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || "Unknown backend error" };
      }
      
      return NextResponse.json(
        { message: errorData.message || `Backend error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({ 
      message: "Podcast generated successfully",
      payload: data.payload 
    }, { status: 200 });
    
  } catch (error) {
    console.error("TTS API Error:", error);
    
    // Handle network errors more specifically
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { message: "Cannot connect to LLM backend server. Please check if the server is running." },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { message: `Error generating podcast: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}