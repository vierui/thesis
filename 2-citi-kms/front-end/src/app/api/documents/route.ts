import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const skip = request.nextUrl.searchParams.get("skip");
  const take = request.nextUrl.searchParams.get("take");
  const searchTerm = request.nextUrl.searchParams.get("searchTerm");
  const tags = request.nextUrl.searchParams.getAll("tag");

  if (!id) {
    return NextResponse.json(
      { message: "Please provide an id" },
      { status: 400 }
    );
  }

  const list = await getListOfDocumentsByUserId(
    id,
    searchTerm,
    tags,
    Number(skip),
    Number(take)
  );
  const docCounts = await getTotalCountByUserId(id, searchTerm, tags);
  return NextResponse.json(
    {
      message: "List of documents",
      data: {
        list: list,
        docCounts: docCounts,
      },
    },
    {
      status: 200,
    }
  );
}

async function getListOfDocumentsByUserId(
  userId: string,
  searchTerm: string | null,
  tags: string[],
  skip: number,
  take: number
) {
  if (globalThis.prisma == null) {
    globalThis.prisma = new PrismaClient();
  }

  if (!take) {
    take = 10;
  }
  if (!skip) {
    skip = 0;
  }

  try {
    var filterObject: { [k: string]: any } = {
      userId: userId,
      deletedAt: null,
    };

    // if searchTerm exists
    if (searchTerm) {
      filterObject.title = {
        startsWith: searchTerm,
        mode: "insensitive",
      };
    }

    // if tags exist
    if (tags.length !== 0) {
      const titleEndsWithConditions = tags.map((tag) => ({
        original_name: {
          endsWith: tag,
        },
      }));
      filterObject.OR = titleEndsWithConditions;
    }

    // querying
    const list = await prisma.document.findMany({
      skip: skip,
      take: take,
      where: filterObject,
      select: {
        id: true,
        title: true,
        topic: true,
        file_size: true,
        public: true,
        original_name: true,
        createdAt: true,
      },
    });

    let list_new = [];
    for (let i = 0; i < list.length; i++) {
      let sizeFormatted = "";
      if (list[i].file_size < 1024) {
        sizeFormatted = list[i].file_size + " B";
      } else if (list[i].file_size < 1024 * 1024) {
        sizeFormatted = (list[i].file_size / 1024).toFixed(2) + " KB";
      } else if (list[i].file_size < 1024 * 1024 * 1024) {
        sizeFormatted = (list[i].file_size / (1024 * 1024)).toFixed(2) + " MB";
      } else {
        sizeFormatted =
          (list[i].file_size / (1024 * 1024 * 1024)).toFixed(2) + " GB";
      }

      const tagFile = list[i].original_name.substring(
        list[i].original_name.lastIndexOf(".") + 1,
        list[i].original_name.length
      );

      list_new.push({
        id: list[i].id,
        title: list[i].title,
        topic: list[i].topic,
        file_size_formatted: sizeFormatted,
        original_name: list[i].original_name,
        createdAt: new Date(list[i].createdAt).toDateString(),
        tag: tagFile,
        public: list[i].public,
      });
    }
    return list_new;
  } catch (err) {
    console.error("Error getting list of documents", err);
    return NextResponse.json(
      { message: "Error getting list of documents" },
      { status: 500 }
    );
  }
}

async function getTotalCountByUserId(
  userId: string,
  searchTerm: string | null,
  tags: string[]
) {
  var filterObject: { [k: string]: any } = {
    userId: userId,
    deletedAt: null,
  };

  // if searchTerm exists
  if (searchTerm) {
    filterObject.title = {
      startsWith: searchTerm,
      mode: "insensitive",
    };
  }

  // if tags exist
  if (tags.length !== 0) {
    const titleEndsWithConditions = tags.map((tag) => ({
      original_name: {
        endsWith: tag,
      },
    }));
    filterObject.OR = titleEndsWithConditions;
  }

  const count = await prisma.document.count({
    where: filterObject,
  });

  return count;
}
