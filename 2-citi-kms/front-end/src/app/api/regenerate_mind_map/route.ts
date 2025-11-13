import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const question = formData.get("question");
  const { userId } = await auth();

  const body = {
    user_id: userId,
    question: question,
  };

  console.log(body);

  try {
    const { getToken } = await auth();
    const token = await getToken();
    console.log(process.env.LLM_URL + "/llm/regenerate_mind_map");
    const response = await fetch(
      process.env.LLM_URL + "/llm/regenerate_mind_map",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    return NextResponse.json({ message: data.payload }, { status: 200 });

  } catch (err) {
    return NextResponse.json(
      {
        message: "Error fetching record",
      },
      {
        status: 500,
      }
    );
  }
}