import "server-only";
import OpenAI from "openai";
import { uploadToStorage } from "@/lib/storage";

// Generates a single marketing visual from a short creative brief and
// persists it to R2, returning a durable public URL - mirrors every other
// image upload path in this app (see lib/storage.ts callers, e.g.
// setCategoryImage). Returns null rather than throwing whenever image
// generation isn't configured or fails, matching this app's fallback-first
// pattern - a missing image should never block the text half of a concept.
export async function generateConceptImage(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new OpenAI({ apiKey });
    // gpt-image-1 always returns b64_json (no response_format param - passing
    // one 400s with "Unknown parameter: 'response_format'", confirmed against
    // this project's account).
    const res = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      quality: "medium",
      n: 1,
    });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) return null;
    const buffer = Buffer.from(b64, "base64");
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
    return await uploadToStorage("marketing-content", filename, buffer, "image/png");
  } catch (err) {
    console.error("imageGen: generateConceptImage failed", err);
    return null;
  }
}
