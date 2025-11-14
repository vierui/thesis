import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "File uploaded successfully" });
}
