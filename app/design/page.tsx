import { prisma } from "@/lib/prisma";
import DesignPageClient from "./DesignPageClient";

export default async function DesignPage() {
  const banner = await prisma.aiDesignerBanner.upsert({
    where: { id: "ai-designer-banner" },
    create: { id: "ai-designer-banner" },
    update: {},
  });

  return <DesignPageClient banner={banner} />;
}
