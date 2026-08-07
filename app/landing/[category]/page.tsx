import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fetchCatalog } from "@/lib/catalog";
import SiteFooter from "@/app/components/SiteFooter";
import LandingClient from "./LandingClient";
import "../../marketing.css";

export default async function CategoryLandingPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const [{ categoryMeta, catalog }, allCategories] = await Promise.all([
    fetchCatalog(),
    prisma.category.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" }, select: { key: true, label: true } }),
  ]);

  const meta = categoryMeta[category];
  if (!meta || !meta.enabled) notFound();

  return (
    <div className="ptb-marketing">
      <LandingClient meta={meta} types={catalog[category] ?? {}} />
      <SiteFooter categories={allCategories} />
    </div>
  );
}
