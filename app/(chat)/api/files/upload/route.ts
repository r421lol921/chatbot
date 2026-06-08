import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB for all files
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

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

function isVideoFile(file: File): boolean {
  return (
    file.type === "video/mp4" ||
    file.type === "video/webm" ||
    file.type === "video/ogg" ||
    file.type === "video/quicktime" ||
    file.name.endsWith(".mp4") ||
    file.name.endsWith(".webm") ||
    file.name.endsWith(".mov")
  );
}

function isAudioFile(file: File): boolean {
  return (
    file.type === "audio/mpeg" ||
    file.type === "audio/mp3" ||
    file.type === "audio/wav" ||
    file.type === "audio/ogg" ||
    file.type === "audio/flac" ||
    file.type === "audio/aac" ||
    file.type === "audio/x-m4a" ||
    file.name.endsWith(".mp3") ||
    file.name.endsWith(".wav") ||
    file.name.endsWith(".ogg") ||
    file.name.endsWith(".flac") ||
    file.name.endsWith(".m4a") ||
    file.name.endsWith(".aac")
  );
}

/** Extract basic metadata from filename for audio/video */
function extractMediaMetadata(file: File): Record<string, string> {
  const name = file.name.replace(/\.[^.]+$/, ""); // strip extension
  const parts = name.split(/[-_\s]+/).filter(Boolean);
  const meta: Record<string, string> = {
    filename: file.name,
    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    type: file.type || "unknown",
  };
  if (parts.length >= 2) {
    // Heuristic: "Artist - Title" or "Title - Artist" patterns
    meta.possibleArtist = parts[0];
    meta.possibleTitle = parts.slice(1).join(" ");
  } else {
    meta.possibleTitle = name;
  }
  return meta;
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

    const isImage = isImageFile(file);
    const isVideo = isVideoFile(file);
    const isAudio = isAudioFile(file);
    const isText = isTextFile(file);

    if (!isText && !isImage && !isVideo && !isAudio) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Allowed: images (JPEG, PNG, GIF, WebP), videos (MP4, WebM, MOV), audio (MP3, WAV, OGG, FLAC, M4A, AAC), and text files (TXT, MD, CSV).",
        },
        { status: 400 }
      );
    }

    const sizeLimit = isImage ? MAX_IMAGE_SIZE : MAX_SIZE;
    if (file.size > sizeLimit) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${sizeLimit / 1024 / 1024} MB.` },
        { status: 400 }
      );
    }

    // Text files: read content and return it directly — no blob storage needed
    if (isText) {
      const textContent = await file.text();
      return NextResponse.json({
        url: `data:text/plain;charset=utf-8,${encodeURIComponent(textContent)}`,
        name: file.name,
        contentType: "text/plain",
        textContent,
      });
    }

    // Audio/Video: upload to Vercel Blob + include metadata
    if (isAudio || isVideo) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const folder = isAudio ? "audio-uploads" : "video-uploads";
      const blob = await put(
        `${folder}/${session.user.id}/${Date.now()}-${safeName}`,
        file,
        { access: "public" }
      );
      const metadata = extractMediaMetadata(file);
      return NextResponse.json({
        url: blob.url,
        name: file.name,
        contentType: file.type,
        mediaType: isAudio ? "audio" : "video",
        metadata,
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
      mediaType: "image",
    });
  } catch (error) {
    console.error("[v0] File upload error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
