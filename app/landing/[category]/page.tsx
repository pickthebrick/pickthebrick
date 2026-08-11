import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { fetchCatalog } from "@/lib/catalog";
import { getLandingContent } from "@/lib/landingContent";
import SiteFooter from "@/app/components/SiteFooter";
import LandingClient from "./LandingClient";
import "../../marketing.css";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const { categoryMeta } = await fetchCatalog();
  const meta = categoryMeta[category];
  if (!meta || !meta.enabled) return {};

  const content = getLandingContent(meta.key, meta.label);
  const description = content.intro[0]?.slice(0, 160) ?? `${meta.label} for Dubai office fit-outs, supplied and installed by PickTheBrick.`;

  return {
    title: `${meta.label} for Dubai Office Fit-Outs | PickTheBrick`,
    description,
  };
}

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
