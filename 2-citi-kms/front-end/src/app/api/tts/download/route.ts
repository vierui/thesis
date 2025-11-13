import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const filename = url.searchParams.get("filename");

    if (!filename) {
      return NextResponse.json(
        { message: "Filename is required" },
        { status: 400 }
      );
    }

    // Proxy the download request to the backend
    const response = await fetch(
      `${process.env.LLM_URL}/tts/download?filename=${encodeURIComponent(filename)}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { message: "Failed to download audio file" },
        { status: response.status }
      );
    }

    // Stream the audio file back to the client
    const audioBlob = await response.blob();
    
    return new NextResponse(audioBlob, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
    
  } catch (error) {
    console.error("Audio download error:", error);
    return NextResponse.json(
      { message: "Error downloading audio file" },
      { status: 500 }
    );
  }
}