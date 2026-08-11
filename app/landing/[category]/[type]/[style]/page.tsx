import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSubtypeForLanding } from "@/lib/landingCatalog";
import { getSubtypeContent } from "@/lib/subtypeContent";
import SiteFooter from "@/app/components/SiteFooter";
import SubtypeLandingClient from "./SubtypeLandingClient";
import "../../../../marketing.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; type: string; style: string }>;
}): Promise<Metadata> {
  const { category, type, style } = await params;
  const data = await getSubtypeForLanding(category, type, style);
  if (!data) return {};

  const content = getSubtypeContent(category, data.type.key, data.subtype.key, data.subtype.label, data.type.label, data.meta.label);
  const description =
    content.intro[0]?.slice(0, 160) ?? `${data.subtype.label} ${data.type.label} for Dubai office fit-outs, supplied and installed by PickTheBrick.`;

  return {
    title: `${data.subtype.label} ${data.type.label} | PickTheBrick`,
    description,
  };
}

export default async function SubtypeLandingPage({
  params,
}: {
  params: Promise<{ category: string; type: string; style: string }>;
}) {
  const { category, type, style } = await params;
  const [data, allCategories] = await Promise.all([
    getSubtypeForLanding(category, type, style),
    prisma.category.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" }, select: { key: true, label: true } }),
  ]);
  if (!data) notFound();

  return (
    <div className="ptb-marketing">
      <SubtypeLandingClient meta={data.meta} type={data.type} subtype={data.subtype} />
      <SiteFooter categories={allCategories} />
    </div>
  );
}
