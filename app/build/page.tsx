import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import { fetchCatalog } from "@/lib/catalog";
import { fetchCartLines } from "@/lib/quotes";
import { getOrCreateDraftQuote } from "@/app/actions/quotes";
import BuildClient from "./BuildClient";

export default async function BuildPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.client) redirect(ROLE_HOME[session.role]);

  const quoteId = await getOrCreateDraftQuote();
  const [catalog, initialCart, banners, quote] = await Promise.all([
    fetchCatalog(),
    fetchCartLines(quoteId),
    prisma.banner.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.quote.findUnique({ where: { id: quoteId }, select: { location: true, officeSize: true } }),
  ]);

  return (
    <BuildClient
      catalog={catalog}
      quoteId={quoteId}
      initialCart={initialCart}
      banners={banners}
      initialLocation={quote?.location ?? null}
      initialOfficeSize={quote?.officeSize ?? null}
    />
  );
}
