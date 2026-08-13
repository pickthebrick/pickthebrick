// One-off: upload the curated "Style Picker images" reference folder into
// StyleFinderImage rows (5 slots per style, matching IMAGES_PER_STYLE in
// lib/styleFinder.ts). Run with: npx tsx scripts/upload-style-finder-images.ts
import "dotenv/config";
import { readdirSync, readFileSync } from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../lib/prisma";

// Inlines lib/storage.ts's upload logic instead of importing it - that file
// starts with `import "server-only"`, which always throws when loaded
// outside Next's own bundler (it relies on Next stubbing the package out for
// server components; plain tsx/node has no such stub).
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

async function uploadToStorage(folder: string, filename: string, buffer: Buffer, contentType: string): Promise<string> {
  const key = `${folder}/${filename}`;
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType }));
  return `${PUBLIC_URL}/${key}`;
}

const ROOT = "C:\\Users\\husai\\Desktop\\PTB Final\\Style Picker images";

const FOLDER_TO_STYLE_KEY: Record<string, string> = {
  Industrial: "industrial",
  Biophilic: "biophilic",
  "Mid-Century Modern": "mid-century-modern",
  Japandi: "japandi",
  "Contemporary Arabic": "contemporary-arabic",
  "Bold & Playful": "bold-playful",
  "Old Money": "old-money",
  "French Victorian": "french-victorian",
};

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

async function main() {
  let uploaded = 0;
  let failed = 0;

  for (const [folder, styleKey] of Object.entries(FOLDER_TO_STYLE_KEY)) {
    const dir = path.join(ROOT, folder);
    const files = readdirSync(dir)
      .filter((f) => CONTENT_TYPES[path.extname(f).toLowerCase()])
      .sort();

    for (let slot = 0; slot < files.length; slot++) {
      const file = files[slot];
      const ext = path.extname(file).toLowerCase();
      const contentType = CONTENT_TYPES[ext];
      try {
        const buffer = readFileSync(path.join(dir, file));
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
        const imageUrl = await uploadToStorage("style-finder", filename, buffer, contentType);

        await prisma.styleFinderImage.upsert({
          where: { styleKey_slot: { styleKey, slot } },
          create: { styleKey, slot, imageUrl },
          update: { imageUrl },
        });

        console.log(`OK   ${styleKey} slot ${slot}: ${file} -> ${imageUrl}`);
        uploaded++;
      } catch (err) {
        console.error(`FAIL ${styleKey} slot ${slot}: ${file} ->`, err instanceof Error ? err.message : err);
        failed++;
      }
    }
  }

  console.log(`\nDone. Uploaded: ${uploaded}, Failed: ${failed}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
