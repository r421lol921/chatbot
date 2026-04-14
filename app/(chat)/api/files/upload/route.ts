import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function isTextFile(file: File): boolean {
  return (
    file.type.startsWith("text/") ||
    file.name.endsWith(".txt") ||
    file.name.endsWith(".md") ||
    file.name.endsWith(".csv") ||
    file.name.endsWith(".log")
  );
}

function isImageFile(file: File): boolean {
  return (
    file.type === "image/jpeg" ||
    file.type === "image/jpg" ||
    file.type === "image/png" ||
    file.type === "image/gif" ||
    file.type === "image/webp"
  );
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 10 MB.` },
        { status: 400 }
      );
    }

    if (!isTextFile(file) && !isImageFile(file)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Only images (JPEG, PNG, GIF, WebP) and text files (TXT, MD, CSV) are allowed.",
        },
        { status: 400 }
      );
    }

    // Text files: read content and return it directly — no blob storage needed
    if (isTextFile(file)) {
      const textContent = await file.text();
      return NextResponse.json({
        url: `data:text/plain;charset=utf-8,${encodeURIComponent(textContent)}`,
        name: file.name,
        contentType: "text/plain",
        textContent,
      });
    }

    // Images: upload to Vercel Blob
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const blob = await put(
      `chat-uploads/${session.user.id}/${Date.now()}-${safeName}`,
      file,
      { access: "public" }
    );

    return NextResponse.json({
      url: blob.url,
      name: file.name,
      contentType: file.type,
    });
  } catch (error) {
    console.error("[v0] File upload error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
