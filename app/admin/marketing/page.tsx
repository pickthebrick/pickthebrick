import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME, isAdminRole } from "@/lib/roles";
import AdminShell from "../AdminShell";
import MarketingClient from "./MarketingClient";
import "../../dashboard.css";

export default async function MarketingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminRole(session.role) && session.role !== Role.marketing) redirect(ROLE_HOME[session.role]);

  const [banners, aiDesignerBanner, categories, caseStudyCards] = await Promise.all([
    prisma.banner.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.aiDesignerBanner.upsert({
      where: { id: "ai-designer-banner" },
      create: { id: "ai-designer-banner" },
      update: {},
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, key: true, label: true, imageUrl: true } }),
    Promise.all(
      ["case-1", "case-2", "case-3"].map((id) =>
        prisma.caseStudyCard.upsert({ where: { id }, create: { id }, update: {} })
      )
    ),
  ]);

  return (
    <AdminShell active="marketing" role={session.role === Role.marketing ? "Marketing" : "Admin"} isSuperAdmin={session.role === Role.super_admin}>
      <h1>Marketing banners</h1>
      <p className="sub">Manage the promotional banners shown to clients on the build page.</p>
      <MarketingClient
        banners={banners}
        aiDesignerBanner={aiDesignerBanner}
        categories={categories}
        caseStudyCards={caseStudyCards}
      />
    </AdminShell>
  );
}
