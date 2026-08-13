import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, QuoteStatus } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import { fetchCatalog } from "@/lib/catalog";
import { fetchCartLines } from "@/lib/quotes";
import { getOrCreateDraftQuote } from "@/app/actions/quotes";
import BuildClient from "./BuildClient";

export default async function BuildPage({
  searchParams,
}: {
  searchParams: Promise<{ editQuote?: string; contractorQuote?: string }>;
}) {
  const { editQuote, contractorQuote } = await searchParams;
  const session = await getSession();

  // A Captain opens this in a new tab from CaptainClient.tsx's "Edit
  // client's quote" link - a narrow, deliberate exception to the usual
  // client-only /build gate (see proxy.ts). Scoped to a specific
  // captain_confirmed quote the Captain themselves owns.
  if (editQuote) {
    if (!session) redirect("/login");
    if (session.role !== Role.captain) redirect(ROLE_HOME[session.role]);

    const quote = await prisma.quote.findUnique({
      where: { id: editQuote },
      select: {
        captainId: true,
        status: true,
        location: true,
        officeSize: true,
        contactPhone: true,
        contactEmail: true,
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

    const clientLabel = quote.client
      ? quote.client.company
        ? `${quote.client.fullName ?? quote.client.email} · ${quote.client.company}`
        : (quote.client.fullName ?? quote.client.email)
      : (quote.contactPhone ?? quote.contactEmail ?? "anonymous lead");

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

  // A contractor opens this from ContractorClient.tsx's "New quote for a
  // client" / "Continue editing" links - a quote they originated themselves
  // for their own end client, never a real PickTheBrick-brokered project
  // (see createContractorQuote in app/actions/quotes.ts). No client account
  // exists for the end customer, so there's no clientLabel to resolve, no
  // phone verification, and no submit-to-PTB step.
  if (contractorQuote) {
    if (!session) redirect("/login");
    if (session.role !== Role.contractor) redirect(ROLE_HOME[session.role]);

    const [quote, contractor] = await Promise.all([
      prisma.quote.findUnique({
        where: { id: contractorQuote },
        select: {
          contractorId: true,
          location: true,
          officeSize: true,
          contactName: true,
          contactPhone: true,
          contactEmail: true,
        },
      }),
      prisma.user.findUnique({ where: { id: session.id }, select: { logoUrl: true } }),
    ]);
    if (!quote || quote.contractorId !== session.id) redirect("/contractor");

    const [catalog, initialCart, banners] = await Promise.all([
      fetchCatalog(),
      fetchCartLines(contractorQuote),
      prisma.banner.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    ]);

    return (
      <BuildClient
        catalog={catalog}
        quoteId={contractorQuote}
        initialCart={initialCart}
        banners={banners}
        initialLocation={quote.location}
        initialOfficeSize={quote.officeSize}
        editAsContractor
        brandLogoUrl={contractor?.logoUrl ?? null}
        initialClientName={quote.contactName ?? undefined}
        initialClientPhone={quote.contactPhone ?? undefined}
        initialClientEmail={quote.contactEmail ?? undefined}
      />
    );
  }

  // A signed-in non-client role has nowhere useful to go on /build - proxy.ts
  // already bounces them via ROLE_AREAS, this is just belt-and-suspenders.
  if (session && session.role !== Role.client) redirect(ROLE_HOME[session.role]);

  const quoteId = await getOrCreateDraftQuote();
  const [catalog, initialCart, banners, quote, client] = await Promise.all([
    fetchCatalog(),
    fetchCartLines(quoteId),
    prisma.banner.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.quote.findUnique({ where: { id: quoteId }, select: { location: true, officeSize: true } }),
    session
      ? prisma.user.findUnique({
          where: { id: session.id },
          select: { fullName: true, company: true, email: true, phone: true, whatsappNumber: true },
        })
      : null,
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
      isAnonymous={!session}
      hasVerifiedWhatsapp={!!session?.whatsappVerifiedAt}
      hasSkippedWhatsapp={!!session?.whatsappSkippedAt}
      initialPhone={client?.whatsappNumber ?? client?.phone ?? undefined}
    />
  );
}
