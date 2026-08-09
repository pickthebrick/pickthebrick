import { prisma } from "@/lib/prisma";
import DesignPageClient from "./DesignPageClient";

export default async function DesignPage() {
  const [banner, categories, featureItems] = await Promise.all([
    prisma.aiDesignerBanner.upsert({
      where: { id: "ai-designer-banner" },
      create: { id: "ai-designer-banner" },
      update: {},
    }),
    prisma.category.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" }, select: { key: true, label: true } }),
    prisma.packageFeatureItem.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, label: true, description: true, minTier: true, sampleImageUrl: true },
    }),
  ]);

  return <DesignPageClient banner={banner} categories={categories} featureItems={featureItems} />;
}
