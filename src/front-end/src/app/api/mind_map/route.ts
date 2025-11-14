import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const collection_name = formData.get("collection_name");
  const document_id = formData.get("document_id");
  const tag = formData.get("tag");
  const { userId } = await auth();

  const body = {
    user_id: userId,
    collection_name: collection_name,
    document_id: document_id,
    tag: tag,
  };

  console.log(body);

  try {
    const { getToken } = await auth();
    const token = await getToken();
    console.log(process.env.LLM_URL + "/document/mind_map");
    const response = await fetch(
      process.env.LLM_URL + "/document/mind_map",
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