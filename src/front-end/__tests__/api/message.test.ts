import { NextRequest } from "next/server";
import { POST } from "@/app/api/message/route";
import { auth } from "@clerk/nextjs/server";
import path from "path";
import fs from "fs";
import { Form } from "react-hook-form";

jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));

describe("/api/message", () => {
  it("should return a 200 status and the correct message for authenticated users", async () => {
    (auth as jest.Mock).mockReturnValue({
      userId: "user_2i09vFjqeHy5KIfCl6brDwJeOmy",
    });

    const formData = new FormData();
    formData.append("request", "hi");
    formData.append("userId", "user_2i09vFjqeHy5KIfCl6brDwJeOmy");
    formData.append("chatBoxId", "1");
    formData.append("response", "nice");

    const req = new NextRequest("http://localhost:3000/api/message", {
      method: "POST",
      body: formData,
      headers: { Authorization: "Bearer valid-token" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.message).toEqual("Message has been successfully saved");
  });

  it("should return a 400 status when one or more parameters are missing", async () => {
    (auth as jest.Mock).mockReturnValue({
      userId: "user_2i09vFjqeHy5KIfCl6brDwJeOmy",
    });

    const formData = new FormData();

    const req = new NextRequest("http://localhost:3000/api/message", {
      method: "POST",
      body: formData,
      headers: { Authorization: "Bearer valid-token" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(["Please fill in all fields"]).toContain(json.message);
  });
});
