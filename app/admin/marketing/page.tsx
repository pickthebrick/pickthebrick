import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME, isAdminRole } from "@/lib/roles";
import { DEFAULT_PACKAGE_FEATURES } from "@/lib/packageFeatures";
import AdminShell from "../AdminShell";
import MarketingClient from "./MarketingClient";
import "../../dashboard.css";

export default async function MarketingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminRole(session.role) && session.role !== Role.marketing) redirect(ROLE_HOME[session.role]);

  const [banners, aiDesignerBanner, categories, caseStudyCards, spaceLayerImages] = await Promise.all([
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
    prisma.spaceLayerImage.findMany({ select: { spaceKey: true, slot: true, imageUrl: true } }),
  ]);

  // Ensure the default feature rows exist (same fixed-id upsert pattern as
  // the case study cards above) so the panel below is never empty and
  // /design always has something to render, even before a marketer has
  // touched this page.
  await Promise.all(
    DEFAULT_PACKAGE_FEATURES.map((f) =>
      prisma.packageFeatureItem.upsert({
        where: { id: f.id },
        create: { id: f.id, label: f.label, description: f.description, minTier: f.minTier, sortOrder: f.sortOrder },
        update: {},
      })
    )
  );
  const packageFeatureItems = await prisma.packageFeatureItem.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <AdminShell active="marketing" role={session.role === Role.marketing ? "Marketing" : "Admin"} isSuperAdmin={session.role === Role.super_admin}>
      <h1>Marketing banners</h1>
      <p className="sub">Manage the promotional banners shown to clients on the build page.</p>
      <MarketingClient
        banners={banners}
        aiDesignerBanner={aiDesignerBanner}
        categories={categories}
        caseStudyCards={caseStudyCards}
        spaceLayerImages={spaceLayerImages}
        packageFeatureItems={packageFeatureItems}
      />
    </AdminShell>
  );
}
