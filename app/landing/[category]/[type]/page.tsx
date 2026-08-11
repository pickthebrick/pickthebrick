import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getTypeForLanding } from "@/lib/landingCatalog";
import { getTypeContent } from "@/lib/typeContent";
import SiteFooter from "@/app/components/SiteFooter";
import TypeLandingClient from "./TypeLandingClient";
import "../../../marketing.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; type: string }>;
}): Promise<Metadata> {
  const { category, type } = await params;
  const data = await getTypeForLanding(category, type);
  if (!data) return {};

  const content = getTypeContent(category, data.type.key, data.type.label, data.meta.label);
  const description =
    content.intro[0]?.slice(0, 160) ?? `${data.type.label} for Dubai office fit-outs, supplied and installed by PickTheBrick - no separate install charge.`;

  return {
    title: `${data.type.label} - ${data.meta.label} for Dubai Offices | PickTheBrick`,
    description,
  };
}

export default async function TypeLandingPage({
  params,
}: {
  params: Promise<{ category: string; type: string }>;
}) {
  const { category, type } = await params;
  const [data, allCategories] = await Promise.all([
    getTypeForLanding(category, type),
    prisma.category.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" }, select: { key: true, label: true } }),
  ]);
  if (!data) notFound();

  return (
    <div className="ptb-marketing">
      <TypeLandingClient meta={data.meta} type={data.type} />
      <SiteFooter categories={allCategories} />
    </div>
  );
}
