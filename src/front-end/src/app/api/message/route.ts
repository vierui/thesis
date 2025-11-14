import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "File uploaded successfully" });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const requestChat = formData.get("request");
  const userId = formData.get("userId");
  const chatBoxId = formData.get("chatBoxId");
  const response = formData.get("response");
  const retrievedDocString = formData.get("retrievedDocIds");
  const responseTime = formData.get("responseTime");

  const retrievedDocs = retrievedDocString ? JSON.parse(retrievedDocString as string) : [];

  if (!requestChat || !userId || !chatBoxId || !response) {
    return NextResponse.json(
      { message: "Please fill in all fields" },
      { status: 400 }
    );
  }
  // const response = await getRecordLLM(requestChat as string) as string[];

  const id = await createRecord(
    requestChat as string,
    response as string,
    userId.toString(),
    Number(chatBoxId),
    Number(responseTime),
    retrievedDocs
  );

  return NextResponse.json(
    {
      message: "Message has been successfully saved",
      id: id,
    },
    {
      status: 200,
    }
  );
}

export async function PUT(request: NextRequest) {
  const formData = await request.formData();
  const id = formData.get("id");
  const liked = formData.get("liked");
  const disliked = formData.get("disliked");
  const rating = formData.get("rating");

  // Validate ID exists and is not empty
  if (!id || id === "") {
    return NextResponse.json(
      { message: "Message ID is required" },
      { status: 400 }
    );
  }

  // Convert to number and validate
  const numericId = Number(id);
  if (isNaN(numericId) || !Number.isInteger(numericId) || numericId <= 0) {
    return NextResponse.json(
      { message: "Invalid message ID format" },
      { status: 400 }
    );
  }

  // Call updateRecord and handle errors
  const result = await updateRecord(numericId, liked, disliked, rating);

  // If updateRecord returns an error response, return it
  if (result instanceof NextResponse) {
    return result;
  }

  return NextResponse.json({ message: "Updated successfully" });
}

async function createRecord(
  request: string,
  response: string,
  userId: string,
  chatBoxId: number,
  responseTime: number,
  retrievedDocs: any
) {
  if (globalThis.prisma == null) {
    globalThis.prisma = new PrismaClient();
  }

  try {
    const message = await prisma.message.create({
      data: {
        request,
        response,
        userId,
        chatBoxId,
        createdAt: new Date(),
        response_time: responseTime,
        retrieved_docs: retrievedDocs.length > 0 ? retrievedDocs : null,
      },
    });
    return message.id;
  } catch (err) {
    console.error("Error creating record", err);
  }
}
async function updateRecord(
  id: number,
  liked: FormDataEntryValue | null,
  disliked: FormDataEntryValue | null,
  rating: FormDataEntryValue | null
): Promise<void | NextResponse> {
  if (globalThis.prisma == null) {
    globalThis.prisma = new PrismaClient();
  }

  // Additional validation: ensure ID is positive integer
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { message: "Invalid message ID" },
      { status: 400 }
    );
  }

  const liked_bool = liked === "true";
  const disliked_bool = disliked === "true";
  const rating_int = Number(rating);

  try {
    await prisma.message.update({
      where: { id },
      data: {
        liked: liked_bool,
        disliked: disliked_bool,
        rating: rating_int,
      },
    });
  } catch (err: any) {
    console.error("Error updating record", err);

    // Handle specific Prisma errors
    if (err.code === "P2025") {
      // Record not found
      return NextResponse.json(
        { message: "Message not found" },
        { status: 404 }
      );
    }

    // Generic error
    return NextResponse.json(
      { message: "Error updating record", error: err.message },
      { status: 500 }
    );
  }
}
