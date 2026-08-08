import { prisma } from "@/lib/prisma";
import DesignPageClient from "./DesignPageClient";

export default async function DesignPage() {
  const [banner, categories] = await Promise.all([
    prisma.aiDesignerBanner.upsert({
      where: { id: "ai-designer-banner" },
      create: { id: "ai-designer-banner" },
      update: {},
    }),
    prisma.category.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" }, select: { key: true, label: true } }),
  ]);

  return <DesignPageClient banner={banner} categories={categories} />;
}
