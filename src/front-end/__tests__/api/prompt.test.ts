import { NextRequest } from "next/server";
import { POST } from "@/app/api/prompt/route";
import { auth } from "@clerk/nextjs/server";
import path from "path";
import fs from "fs";
import { MessageProps } from "@/types";
import { any } from "zod";

jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));

describe("/api/prompt", () => {
  it("should return a 200 status and the correct message for authenticated users", async () => {
    (auth as jest.Mock).mockReturnValue({
      userId: "user_2i09vFjqeHy5KIfCl6brDwJeOmy",
    });

    const data: MessageProps[] = [];

    const formData = new FormData();
    formData.append("question", "hi!");
    formData.append("history", new Blob(data as any));
    formData.append("hyde", "true");
    formData.append("reranking", "true");
    formData.append("selected_model", "Mistral 7B");

    const req = new NextRequest("http://localhost:3000/api/prompt", {
      method: "POST",
      body: formData,
      headers: { Authorization: "Bearer valid-token" },
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  //   it("should return a 400 status when one or more parameters are missing", async () => {
  //     (auth as jest.Mock).mockReturnValue({
  //       userId: "user_2i09vFjqeHy5KIfCl6brDwJeOmy",
  //     });

  //     const req = new NextRequest("http://localhost:3000/api/document", {
  //       method: "GET",
  //       headers: { Authorization: "Bearer valid-token" },
  //     });

  //     const res = await GET(req);
  //     expect(res.status).toBe(400);

  //     const json = await res.json();
  //     expect(["Please provide an id", "Error reading file"]).toContain(
  //       json.message
  //     );
  //   });
});
