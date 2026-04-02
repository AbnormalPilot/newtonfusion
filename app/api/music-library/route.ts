import { type NextRequest, NextResponse } from "next/server"
import { put, list } from "@vercel/blob"
const getBlobConfig = () => {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  return token ? { token } : {}
}

export async function GET() {
  try {
    console.log("[v0] Fetching music library from Blob storage...")

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("[v0] BLOB_READ_WRITE_TOKEN not configured")
      return NextResponse.json({
        tracks: [],
        error: "Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN in Project Settings.",
      })
    }

    const { blobs } = await list({
      prefix: "music-",
      ...getBlobConfig(),
    })

    const tracks = blobs
      .map((blob) => {
        const filename = blob.pathname.split("/").pop() || "unknown"
        const parts = filename.replace("music-", "").replace(".mp3", "").split("-")
        const timestamp = parts[0]
        const duration = Number.parseInt(parts[1]) || 30 // Extract duration from filename, fallback to 30
        const title = parts.slice(2).join("-").replace(/-/g, " ") || "Untitled"

        return {
          id: blob.url, // Use blob URL as unique identifier
          title: title,
          prompt: `Generated music: ${title}`, // Default prompt since we can't store it in blob
          duration_seconds: duration, // Use extracted duration instead of hardcoded 30
          file_url: blob.url,
          created_at: new Date(Number.parseInt(timestamp) || Date.now()).toISOString(),
          size: blob.size,
        }
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    console.log("[v0] Found", tracks.length, "tracks in Blob storage")
    return NextResponse.json({ tracks })
  } catch (error) {
    console.error("[v0] Error fetching music library:", error)
    return NextResponse.json(
      {
        tracks: [],
        error: "Failed to fetch music library. Check Blob storage configuration.",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting music track save process")

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("[v0] BLOB_READ_WRITE_TOKEN not configured")
      return NextResponse.json(
        {
          error: "Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN in Project Settings.",
        },
        { status: 500 },
      )
    }

    const formData = await request.formData()
    console.log("[v0] FormData received, keys:", Array.from(formData.keys()))

    const audioFile = formData.get("audio") as File
    const title = formData.get("title") as string
    const prompt = formData.get("prompt") as string
    const durationSeconds = Number.parseInt(formData.get("duration_seconds") as string)

    console.log("[v0] Parsed data:", {
      hasAudioFile: !!audioFile,
      audioFileSize: audioFile?.size,
      title,
      prompt,
      durationSeconds,
    })

    if (!audioFile || !title) {
      return NextResponse.json({ error: "Missing audio file or title" }, { status: 400 })
    }

    const timestamp = Date.now()
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-")
    const filename = `music-${timestamp}-${durationSeconds}-${sanitizedTitle}.mp3`

    console.log("[v0] Uploading audio file to Vercel Blob...")
    const blob = await put(filename, audioFile, {
      access: "public",
      contentType: "audio/mpeg",
      ...getBlobConfig(),
    })
    console.log("[v0] Audio uploaded to Blob, URL:", blob.url)

    const track = {
      id: blob.url,
      title: title,
      prompt: prompt,
      duration_seconds: durationSeconds,
      file_url: blob.url,
      created_at: new Date().toISOString(),
      size: audioFile.size,
    }

    return NextResponse.json({
      success: true,
      track: track,
    })
  } catch (error) {
    console.error("[v0] Error saving music track:", error)
    return NextResponse.json({ error: "Failed to save music track" }, { status: 500 })
  }
}
