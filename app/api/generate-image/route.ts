import { NextRequest, NextResponse } from "next/server";

// The definitive NEW router endpoint for serverless image tasks
// Pattern: https://router.huggingface.co/hf-inference/models/{model_id}
const IMAGE_MODEL = "black-forest-labs/FLUX.1-schnell";
const HF_ROUTER_IMAGE_URL = `https://router.huggingface.co/hf-inference/models/${IMAGE_MODEL}`;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    if (!prompt) return NextResponse.json({ error: "No prompt provided" }, { status: 400 });

    const apiKey = process.env.HUGGING_FACE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing API Key" }, { status: 500 });

    const currentPrompt = prompt.trim();
    console.log(`[ROUTER_2.0] Direct Model Inference: ${IMAGE_MODEL}...`);

    // The router for /hf-inference/models expects the classic HF Inference API body { inputs: "..." }
    const response = await fetch(HF_ROUTER_IMAGE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: currentPrompt,
        options: { wait_for_model: true }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[ROUTER_2.0] Failed with ${response.status}: ${errText.slice(0, 200)}`);
      
      return NextResponse.json({ 
        error: `HF Router Error (${response.status}): ${errText.includes("transitioning") ? "Model is still booting on the new router. Please try once more in 15 seconds." : "Inference service is temporarily overloaded."}` 
      }, { status: response.status });
    }

    // The router for models returns binary image bytes directly
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/png";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });

  } catch (error: any) {
    console.error("[ROUTER_2.0_CRITICAL]:", error.message || error);
    return NextResponse.json({ error: "A connection error occurred with the HF Router." }, { status: 500 });
  }
}
