import "server-only";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// R2 is S3-API-compatible, so the regular AWS SDK works against it - just
// point the endpoint at the account's R2 jurisdiction URL. Vercel's
// serverless functions have a read-only filesystem (aside from /tmp, which
// doesn't persist or serve publicly), so every upload in the app must go
// through here instead of node:fs.
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

// Uploads a file under the given folder/key and returns its public URL -
// the direct drop-in replacement for the old `/folder/filename` path that
// callers stored in the database and rendered as an <img src>/<a href>.
export async function uploadToStorage(folder: string, filename: string, buffer: Buffer, contentType?: string): Promise<string> {
  const key = `${folder}/${filename}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return `${PUBLIC_URL}/${key}`;
}

// Accepts the public URL previously returned by uploadToStorage (the same
// string callers stored in the database) and deletes the underlying object.
export async function deleteFromStorage(url: string): Promise<void> {
  if (!url.startsWith(`${PUBLIC_URL}/`)) return;
  const key = url.slice(PUBLIC_URL.length + 1);
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
