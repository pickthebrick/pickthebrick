import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import HomeClient from "./HomeClient";
import "./marketing.css";

// Public home page - only ever reached by anonymous visitors or signed-in
// clients (proxy.ts bounces every other role straight to their own
// dashboard). Data fetching lives here; the actual page (parallax hero,
// illustrated sections, footer) is HomeClient.tsx.
export default async function Home() {
  const [session, categories] = await Promise.all([
    getSession(),
    prisma.category.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" }, select: { key: true, label: true } }),
  ]);

  return (
    <>
      <HomeClient isClientSession={!!session} categories={categories} />
      {!session && (
        <a href="/staff-login" className="staff-login-link">
          Staff login
        </a>
      )}
    </>
  );
}
