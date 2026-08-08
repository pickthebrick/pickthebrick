import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, QuoteStatus } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import { fetchCatalog } from "@/lib/catalog";
import { fetchCartLines } from "@/lib/quotes";
import { getOrCreateDraftQuote } from "@/app/actions/quotes";
import BuildClient from "./BuildClient";

export default async function BuildPage({ searchParams }: { searchParams: Promise<{ editQuote?: string }> }) {
  const { editQuote } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");

  // A Captain opens this in a new tab from CaptainClient.tsx's "Edit
  // client's quote" link - a narrow, deliberate exception to the usual
  // client-only /build gate (see proxy.ts). Scoped to a specific
  // captain_confirmed quote the Captain themselves owns.
  if (editQuote) {
    if (session.role !== Role.captain) redirect(ROLE_HOME[session.role]);

    const quote = await prisma.quote.findUnique({
      where: { id: editQuote },
      select: {
        captainId: true,
        status: true,
        location: true,
        officeSize: true,
        client: { select: { fullName: true, company: true, email: true } },
      },
    });
    if (!quote || quote.captainId !== session.id || quote.status !== QuoteStatus.captain_confirmed) {
      redirect("/captain");
    }

    const [catalog, initialCart, banners] = await Promise.all([
      fetchCatalog(),
      fetchCartLines(editQuote),
      prisma.banner.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    ]);

    const clientLabel = quote.client.company
      ? `${quote.client.fullName ?? quote.client.email} · ${quote.client.company}`
      : quote.client.fullName ?? quote.client.email;

    return (
      <BuildClient
        catalog={catalog}
        quoteId={editQuote}
        initialCart={initialCart}
        banners={banners}
        initialLocation={quote.location}
        initialOfficeSize={quote.officeSize}
        editAsCaptain
        clientLabel={clientLabel}
      />
    );
  }

  if (session.role !== Role.client) redirect(ROLE_HOME[session.role]);

  const quoteId = await getOrCreateDraftQuote();
  const [catalog, initialCart, banners, quote, client] = await Promise.all([
    fetchCatalog(),
    fetchCartLines(quoteId),
    prisma.banner.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.quote.findUnique({ where: { id: quoteId }, select: { location: true, officeSize: true } }),
    prisma.user.findUnique({ where: { id: session.id }, select: { fullName: true, company: true, email: true } }),
  ]);

  const clientLabel = client?.company
    ? `${client.fullName ?? client.email} · ${client.company}`
    : (client?.fullName ?? client?.email ?? null);

  return (
    <BuildClient
      catalog={catalog}
      quoteId={quoteId}
      initialCart={initialCart}
      banners={banners}
      initialLocation={quote?.location ?? null}
      initialOfficeSize={quote?.officeSize ?? null}
      clientLabel={clientLabel ?? undefined}
    />
  );
}
