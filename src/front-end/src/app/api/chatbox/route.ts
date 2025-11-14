import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { auth } from "@clerk/nextjs/server";

interface T {
  id: number;
  name: string;
  updatedAt: Date;
}

interface ChatBoxGroup {
  [key: string]: T[];
}

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const chatBox = await getRecord(userId);
  let chatBoxGroup: ChatBoxGroup = {};

  if (Array.isArray(chatBox)) {
    for (let i = 0; i < chatBox.length; i++) {
      let dateNow = new Date();
      let dateChat: Date = chatBox[i].updatedAt ?? new Date();
      let differenceDays =
        (dateNow.getTime() - dateChat.getTime()) / (1000 * 3600 * 24);
      if (differenceDays <= 1) {
        chatBoxGroup["Today"] = chatBoxGroup["Today"] ?? [];
        chatBoxGroup["Today"].push({
          id: chatBox[i].id,
          name: chatBox[i].name,
          updatedAt: chatBox[i].updatedAt ?? new Date(),
        });
      } else if (differenceDays <= 2) {
        chatBoxGroup["Yesterday"] = chatBoxGroup["Yesterday"] ?? [];
        chatBoxGroup["Yesterday"].push({
          id: chatBox[i].id,
          name: chatBox[i].name,
          updatedAt: chatBox[i].updatedAt ?? new Date(),
        });
      } else if (differenceDays <= 7) {
        chatBoxGroup["Last 7 Days"] = chatBoxGroup["Last 7 Days"] ?? [];
        chatBoxGroup["Last 7 Days"].push({
          id: chatBox[i].id,
          name: chatBox[i].name,
          updatedAt: chatBox[i].updatedAt ?? new Date(),
        });
      } else if (differenceDays <= 30) {
        chatBoxGroup["Last 30 Days"] = chatBoxGroup["Last 30 Days"] ?? [];
        chatBoxGroup["Last 30 Days"].push({
          id: chatBox[i].id,
          name: chatBox[i].name,
          updatedAt: chatBox[i].updatedAt ?? new Date(),
        });
      } else if (dateNow.getFullYear() === dateChat.getFullYear()) {
        let month = dateChat.getMonth();
        let monthName = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
        chatBoxGroup[monthName[month]] = chatBoxGroup[monthName[month]] ?? [];
        chatBoxGroup[monthName[month]].push({
          id: chatBox[i].id,
          name: chatBox[i].name,
          updatedAt: chatBox[i].updatedAt ?? new Date(),
        });
      } else {
        chatBoxGroup[dateChat.getFullYear()] =
          chatBoxGroup[dateChat.getFullYear()] ?? [];
        chatBoxGroup[Number(dateChat.getFullYear())].push({
          id: chatBox[i].id,
          name: chatBox[i].name,
          updatedAt: chatBox[i].updatedAt ?? new Date(),
        });
      }
    }
  }
  return NextResponse.json(
    {
      message: "Record fetched successfully",
      data: chatBoxGroup,
    },
    {
      status: 200,
    }
  );
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const name = formData.get("name");
  var id = "0";

  if (!name) {
    return NextResponse.json(
      { message: "Please fill in all fields" },
      { status: 400 }
    );
  }

  const response = await createRecord(userId, name as string);
  id = await response.toString();
  return NextResponse.json(
    {
      message: "Record created successfully",
      id: await id,
    },
    {
      status: 200,
    }
  );
}

export async function PUT(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const id = formData.get("id");
  const name = formData.get("name");

  if (!id || !name) {
    return NextResponse.json(
      { message: "Please fill in all fields" },
      { status: 400 }
    );
  }

  // Verify ownership before updating
  const chatBox = await prisma.chatBox.findUnique({
    where: { id: Number(id) },
    select: { userId: true }
  });

  if (!chatBox) {
    return NextResponse.json(
      { message: "ChatBox not found" },
      { status: 404 }
    );
  }

  if (chatBox.userId !== userId) {
    return NextResponse.json(
      { message: "Forbidden: You don't own this chatbox" },
      { status: 403 }
    );
  }

  updateRecord(Number(id), name as string);
  return NextResponse.json(
    {
      message: "Record updated successfully",
    },
    {
      status: 200,
    }
  );
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { message: "Please provide an id" },
      { status: 400 }
    );
  }

  // Verify ownership before deleting
  const chatBox = await prisma.chatBox.findUnique({
    where: { id: Number(id) },
    select: { userId: true }
  });

  if (!chatBox) {
    return NextResponse.json(
      { message: "ChatBox not found" },
      { status: 404 }
    );
  }

  if (chatBox.userId !== userId) {
    return NextResponse.json(
      { message: "Forbidden: You don't own this chatbox" },
      { status: 403 }
    );
  }

  deleteRecord(Number(id));
  return NextResponse.json(
    {
      message: "Record deleted successfully",
    },
    {
      status: 200,
    }
  );
}

async function getRecord(id: string) {
  if (globalThis.prisma == null) {
    globalThis.prisma = new PrismaClient();
  }

  try {
    const record = await prisma.chatBox.findMany({
      where: {
        userId: id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
    return record ?? [];
  } catch (error) {
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

async function createRecord(userId: string, name: string) {
  if (globalThis.prisma == null) {
    globalThis.prisma = new PrismaClient();
  }

  try {
    const record = await prisma.chatBox.create({
      data: {
        userId: userId,
        name: name,
        createdAt: new Date(),
      },
    });
    return record.id;
  } catch (error) {
    console.error("Error creating record", error);
    return NextResponse.json(
      {
        message: "Error creating record",
      },
      {
        status: 500,
      }
    );
  }
}

async function updateRecord(id: number, name: string) {
  if (globalThis.prisma == null) {
    globalThis.prisma = new PrismaClient();
  }

  try {
    const record = await prisma.chatBox.update({
      where: {
        id: id,
      },
      data: {
        name: name,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error updating record", error);
    return NextResponse.json(
      {
        message: "Error updating record",
      },
      {
        status: 500,
      }
    );
  }
}

async function deleteRecord(id: number) {
  if (globalThis.prisma == null) {
    globalThis.prisma = new PrismaClient();
  }
  try {
    const record = await prisma.chatBox.update({
      where: {
        id: id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error deleting record", error);
    return NextResponse.json(
      {
        message: "Error deleting record",
      },
      {
        status: 500,
      }
    );
  }
}
