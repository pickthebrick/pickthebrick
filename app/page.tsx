import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import HomeClient from "./HomeClient";
import "./marketing.css";

// Public home page - only ever reached by anonymous visitors or signed-in
// clients (proxy.ts bounces every other role straight to their own
// dashboard). Data fetching lives here; the actual page (parallax hero,
// illustrated sections, footer) is HomeClient.tsx.
const CASE_STUDY_IDS = ["case-1", "case-2", "case-3"];

export default async function Home() {
  const [session, categories, caseStudyRows] = await Promise.all([
    getSession(),
    prisma.category.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" }, select: { key: true, label: true, imageUrl: true } }),
    // findMany (not upsert) so a plain page view never writes to the DB -
    // rows are created lazily the first time marketing opens /admin/marketing
    // (see that page's caseStudyCards fetch); until then every card just
    // falls back to its default button below.
    prisma.caseStudyCard.findMany({ where: { id: { in: CASE_STUDY_IDS } } }),
  ]);
  const caseStudyById = new Map(caseStudyRows.map((c) => [c.id, c]));
  const caseStudyCards = CASE_STUDY_IDS.map(
    (id) => caseStudyById.get(id) ?? { id, imageUrl: null, buttonLabel: "View project", buttonUrl: "/build" }
  );

  return (
    <>
      <HomeClient isClientSession={!!session} categories={categories} caseStudyCards={caseStudyCards} />
      {!session && (
        <a href="/staff-login" className="staff-login-link">
          Staff login
        </a>
      )}
    </>
  );
}
