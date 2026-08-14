import { NextResponse, type NextRequest } from "next/server";

// The R2 bucket serves every uploaded image (product photos, contractor
// logos) publicly over plain HTTPS, but without CORS headers - fine for a
// plain <img src>, but lib/quotePdf.ts needs the actual pixel bytes (it
// fetch()es the image client-side to embed it in a downloaded PDF), and a
// browser blocks that cross-origin read without an Access-Control-Allow-
// Origin header. Setting one requires bucket-admin R2 permissions our
// scoped upload token doesn't have. Routing the fetch through this
// same-origin proxy instead sidesteps CORS entirely - the browser only ever
// talks to our own domain, and this route fetches the real bytes server-side
// where CORS doesn't apply.
export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("url");
  if (!src) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  let target: URL;
  try {
    target = new URL(src);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  // Only ever proxies our own public R2 bucket - never an arbitrary
  // caller-supplied host, so this can't be turned into an open image proxy.
  const r2PublicUrl = process.env.R2_PUBLIC_URL;
  if (!r2PublicUrl || target.origin !== new URL(r2PublicUrl).origin) {
    return NextResponse.json({ error: "URL is not from the R2 bucket" }, { status: 403 });
  }

  const upstream = await fetch(target.toString());
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Could not fetch image" }, { status: upstream.status || 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      // Immutable: every upload gets a fresh randomized filename, so a given
      // URL's bytes never change (see uploadToStorage in lib/storage.ts).
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
