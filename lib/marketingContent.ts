import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Organized local library of every content concept the AI has generated -
// one JSON file per piece, filed under data/marketing-content/<platform>/,
// not just whatever's currently shown on screen. Same read-only-filesystem
// caveat as lib/marketingLog.ts: no-ops safely in production on Vercel.
const CONTENT_DIR = path.join(process.cwd(), "data", "marketing-content");

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export type SavedContent = {
  platform: string;
  format: string;
  idea?: string;
  hook: string;
  visual: string;
  caption: string;
  cta: string;
};

export async function saveGeneratedContent(content: SavedContent) {
  try {
    const platformDir = path.join(CONTENT_DIR, slugify(content.platform) || "unknown-platform");
    await mkdir(platformDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const slugPart = content.idea ? `-${slugify(content.idea)}` : "";
    const filename = `${stamp}__${slugify(content.format)}${slugPart}.json`;
    const payload = { ...content, savedAt: new Date().toISOString() };
    await writeFile(path.join(platformDir, filename), JSON.stringify(payload, null, 2), "utf-8");
  } catch (err) {
    console.warn("marketingContent: could not save local content (expected on read-only filesystems like Vercel)", err);
  }
}
