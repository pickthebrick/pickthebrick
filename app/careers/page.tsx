import { prisma } from "@/lib/prisma";
import SiteFooter from "@/app/components/SiteFooter";
import CareersClient from "./CareersClient";
import "../marketing.css";

export default async function CareersPage() {
  const [categories, postings] = await Promise.all([
    prisma.category.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" }, select: { key: true, label: true } }),
    prisma.jobPosting.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="ptb-marketing">
      <CareersClient postings={postings} />
      <SiteFooter categories={categories} />
    </div>
  );
}
