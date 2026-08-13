import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Next's Server Action requests default to a 1MB body cap - well under this
  // app's own 10MB per-file limits (design layouts, CVs, etc. - see
  // app/actions/design.ts, careers.ts), so every upload past ~1MB was
  // silently rejected by the framework before those checks ever ran. Raised
  // to comfortably cover the largest declared 10MB cap plus multipart
  // overhead. See node_modules/next/dist/docs/.../serverActions.md.
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
