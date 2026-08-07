import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Standard Next.js dev-mode singleton: avoids exhausting connections across
// hot-reloads by stashing the client on the global object.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Uses Neon's driver adapter (Wasm query compiler, no native binary engine)
// instead of Prisma's default binary Query Engine - the binary approach
// isn't reliably bundled by Vercel's serverless build with a custom
// generator output path, causing "Query Engine not found" at runtime. The
// adapter also uses Neon's HTTP/WebSocket driver, which suits serverless
// functions better than a raw TCP connection per invocation.
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
