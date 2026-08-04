import { PrismaClient } from "@/app/generated/prisma/client";

// Standard Next.js dev-mode singleton: avoids exhausting SQLite connections
// across hot-reloads by stashing the client on the global object.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
