import { NextRequest, NextResponse } from "next/server";

const HF_ROUTER_URL = "https://router.huggingface.co/v1/chat/completions";
const TEXT_MODEL = "meta-llama/Llama-3.1-8B-Instruct";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "A message is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.HUGGING_FACE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Hugging Face API key is missing." },
        { status: 500 }
      );
    }

    const response = await fetch(HF_ROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [
          { role: "system", content: "You are a creative AI assistant named NewtonFuse. Provide helpful, inspiring responses." },
          { role: "user", content: prompt.trim() }
        ],
        stream: true,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Inference failed: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    // Set up a transformer to process the SSE stream
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;

            const data = trimmedLine.slice(6);
            if (data === "[DONE]") {
              controller.close();
              return;
            }

            try {
              const JSONData = JSON.parse(data);
              const content = JSONData.choices?.[0]?.delta?.content || "";
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            } catch (e) {
              console.error("Error parsing SSE chunk:", e);
            }
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in generate-text streaming API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during chat generation." },
      { status: 500 }
    );
  }
}
