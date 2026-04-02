import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const text = searchParams.get("text") || "A peaceful ambient track"
    const duration_seconds = Number.parseInt(searchParams.get("duration_seconds") || "30")

    console.log("[v0] API called with:", { text, duration_seconds })

    const apiKey = "sk_0450b2dbdc3f8dafda14a04188d61904c2f09959f47b37c9"
    console.log("[v0] Environment check:", {
      hasApiKey: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      keyPrefix: apiKey ? apiKey.substring(0, 8) + "..." : "undefined",
    })

    if (!apiKey) {
      console.error("[v0] ElevenLabs API key not found")
      return new Response(
        JSON.stringify({
          error: "ElevenLabs API key not configured",
          message: "Please add ELEVENLABS_API_KEY to your environment variables in Project Settings",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log("[v0] Calling ElevenLabs API...")

    const response = await fetch("https://api.elevenlabs.io/v1/music", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        prompt: text,
        music_length_ms: duration_seconds * 1000,
        output_format: "mp3_44100_128",
        model_id: "music_v1",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] ElevenLabs API error:", response.status, errorText)

      try {
        const errorData = JSON.parse(errorText)
        return new Response(JSON.stringify(errorData), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        })
      } catch (parseError) {
        // If parsing fails, return original error
        return new Response(
          JSON.stringify({
            error: "API Error",
            message: errorText,
          }),
          {
            status: response.status,
            headers: { "Content-Type": "application/json" },
          },
        )
      }
    }

    console.log("[v0] ElevenLabs API response received")

    const audioBuffer = await response.arrayBuffer()

    console.log("[v0] Audio buffer created, size:", audioBuffer.byteLength)

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    console.error("[v0] Error in music generation:", error)
    console.error("[v0] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
