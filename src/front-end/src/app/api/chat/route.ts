import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return new Response(
      JSON.stringify({ message: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    const { getToken } = await auth();
    const token = await getToken();

    console.log("Proxying chat request to LLM server:", process.env.LLM_URL);

    // Forward the request to the LLM server
    const response = await fetch(
      `${process.env.LLM_URL}/llm/chat_with_llm`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          ...body,
          user_id: userId, // Ensure user_id is set
        }),
      }
    );

    if (!response.ok) {
      console.error("LLM server error:", response.status, response.statusText);
      return new Response(
        JSON.stringify({ message: "Error from LLM server" }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // Stream the response back to the client
    // This maintains the streaming functionality
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    console.error("Error in chat API route:", err);
    return new Response(
      JSON.stringify({ message: "Error processing chat request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
