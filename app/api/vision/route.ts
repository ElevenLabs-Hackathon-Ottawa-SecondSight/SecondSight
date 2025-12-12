import { Anthropic } from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";
const FALLBACK_MODEL = process.env.ANTHROPIC_FALLBACK_MODEL || "claude-sonnet-4-5";

const errorResponse = (message: string, status = 500) => NextResponse.json({ error: message }, { status });

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return errorResponse("Missing ANTHROPIC_API_KEY", 500);

  let payload: { image?: string };
  try {
    payload = await req.json();
  } catch (err) {
    return errorResponse("Invalid JSON body", 400);
  }

  const raw = (payload.image || "").toString();
  if (!raw) return errorResponse("'image' is required", 400);

  const cleaned = raw.replace(/\s+/g, "");
  const dataUrlMatch = cleaned.match(/^data:(.+?);base64,(.+)$/);
  const mediaTypeRaw = dataUrlMatch?.[1]?.toLowerCase();
  const allowedMediaTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
  const mediaType = (allowedMediaTypes.includes(mediaTypeRaw as any) ? mediaTypeRaw : "image/jpeg") as
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp";
  const base64Data = dataUrlMatch?.[2] || cleaned;

  if (!base64Data) return errorResponse("Image data missing", 400);
  if (base64Data.length < 20) return errorResponse("Image data too small", 400);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const system = "Describe this image for a blind person. Identify text and objects.";

  const callModel = async (model: string) => {
    const result = await client.messages.create({
      model,
      max_tokens: 300,
      system,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } },
            { type: "text", text: "Describe what you see." },
          ],
        },
      ],
    });

    const text = result.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join(" ")
      .trim();

    return text || "No description returned.";
  };

  try {
    const text = await callModel(DEFAULT_MODEL);
    return NextResponse.json({ text });
  } catch (err: any) {
    const code = err?.error?.type || err?.code || "unknown_error";
    if (FALLBACK_MODEL && DEFAULT_MODEL !== FALLBACK_MODEL) {
      try {
        const text = await callModel(FALLBACK_MODEL);
        return NextResponse.json({ text });
      } catch (fallbackErr: any) {
        const fallbackCode = fallbackErr?.error?.type || fallbackErr?.code || "unknown_error";
        return errorResponse(`Vision failed (${code} / ${fallbackCode})`, 502);
      }
    }
    if (code === "not_found_error" || code === "model_not_found" || code === "model_not_found_error") {
      return errorResponse("Anthropic model not found or vision not enabled.", 502);
    }
    return errorResponse(err?.message || "Vision request failed", 500);
  }
}
