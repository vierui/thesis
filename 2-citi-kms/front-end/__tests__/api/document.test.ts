import { NextRequest } from "next/server";
import { GET, POST, PUT, DELETE } from "@/app/api/document/route";
import { auth } from "@clerk/nextjs/server";
import path from "path";
import fs from "fs";

jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));

describe("/api/document", () => {
  it("should return a 200 status and the correct message for authenticated users", async () => {
    (auth as jest.Mock).mockReturnValue({
      userId: "user_2i09vFjqeHy5KIfCl6brDwJeOmy",
    });

    const req = new NextRequest(
      "http://localhost:3000/api/document?id=47&tag=pdf",
      {
        method: "GET",
        headers: { Authorization: "Bearer valid-token" },
      }
    );

    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it("should return a 400 status when one or more parameters are missing", async () => {
    (auth as jest.Mock).mockReturnValue({
      userId: "user_2i09vFjqeHy5KIfCl6brDwJeOmy",
    });

    const req = new NextRequest("http://localhost:3000/api/document", {
      method: "GET",
      headers: { Authorization: "Bearer valid-token" },
    });

    const res = await GET(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(["Please provide an id", "Error reading file"]).toContain(
      json.message
    );
  });

  it("should return a 200 status and the correct message for authenticated users", async () => {
    (auth as jest.Mock).mockReturnValue({
      userId: "user_2i09vFjqeHy5KIfCl6brDwJeOmy",
    });

    const filePath = path.resolve(__dirname, "../../storage/sample.pdf");
    const fileContent = fs.readFileSync(filePath);
    const file = new Blob([fileContent], { type: "application/json" });

    const formData = new FormData();
    formData.append("file", file, "test.pdf");
    formData.append("title", "test");
    formData.append("topic", "test");
    formData.append("user_id", "user_2i09vFjqeHy5KIfCl6brDwJeOmy");

    const req = new NextRequest("http://localhost:3000/api/document", {
      method: "POST",
      body: formData,
      headers: { Authorization: "Bearer valid-token" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toEqual("File uploaded successfully");
  });

  it("should return a 400 status when one or more parameters are missing", async () => {
    (auth as jest.Mock).mockReturnValue({
      userId: "user_2i09vFjqeHy5KIfCl6brDwJeOmy",
    });

    const filePath = path.resolve(__dirname, "../../storage/sample.pdf");
    const fileContent = fs.readFileSync(filePath);
    const file = new Blob([fileContent], { type: "application/json" });

    const formData = new FormData();
    formData.append("file", file, "test.pdf");
    formData.append("title", "test");
    formData.append("user_id", "user_2i09vFjqeHy5KIfCl6brDwJeOmy");

    const req = new NextRequest("http://localhost:3000/api/document", {
      method: "POST",
      body: formData,
      headers: { Authorization: "Bearer valid-token" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect([
      "Please fill in all fields",
      "No file uploaded",
      "Error insert to SQL",
      "Error creating directory",
      "Error uploading file",
      "Error inserting to VDB",
    ]).toContain(json.message);
  });

  it("should return a 200 status and the correct message for authenticated users", async () => {
    (auth as jest.Mock).mockReturnValue({
      userId: "user_2i09vFjqeHy5KIfCl6brDwJeOmy",
    });

    const formData = new FormData();
    formData.append("id", "47");
    formData.append("title", "test");
    formData.append("topic", "test");
    formData.append("public", "true");

    const req = new NextRequest("http://localhost:3000/api/document", {
      method: "PUT",
      body: formData,
      headers: { Authorization: "Bearer valid-token" },
    });

    const res = await PUT(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toEqual("Document updated successfully");
  });
});
