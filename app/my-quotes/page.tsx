import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role, TimelineItemStatus } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import BrandMark from "@/app/components/BrandMark";
import MyQuotesClient from "./MyQuotesClient";
import "../dashboard.css";
import "../marketing.css";

export default async function MyQuotesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.client) redirect(ROLE_HOME[session.role]);

  const [quotes, designRequests, client, styleFinderResult] = await Promise.all([
    prisma.quote.findMany({
      where: { clientId: session.id },
      include: {
        items: {
          select: {
            id: true,
            name: true,
            categoryLabel: true,
            rate: true,
            qty: true,
            unit: true,
            productId: true,
            product: { select: { images: { take: 1, orderBy: { sortOrder: "asc" }, select: { path: true } } } },
          },
        },
        captain: { select: { fullName: true, email: true, phone: true } },
        timelineItems: {
          where: { status: TimelineItemStatus.assigned },
          select: { deliveryApproved: true, siteApproved: true },
        },
        inspections: {
          orderBy: { requestedAt: "desc" },
          select: { id: true, status: true, note: true, scheduledAt: true, captainNote: true, requestedAt: true },
        },
        paymentClaims: {
          orderBy: { requestedAt: "desc" },
          select: { id: true, requestedPercent: true, requestedAmount: true, status: true, requestedAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.designRequest.findMany({
      where: { clientId: session.id },
      include: {
        files: { orderBy: { sortOrder: "asc" } },
        spaceEntries: true,
        revisionComments: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({ where: { id: session.id }, select: { fullName: true, company: true, email: true } }),
    // Client-level, not per-request - see app/actions/styleFinder.ts.
    prisma.styleFinderResult.findUnique({
      where: { clientId: session.id },
      select: { topStyle: true, stats: { select: { styleKey: true, shown: true, liked: true } } },
    }),
  ]);

  const clientLabel = client?.company
    ? `${client.fullName ?? client.email} · ${client.company}`
    : (client?.fullName ?? client?.email ?? null);
  // First name only, for the "Hi X" greeting - falls back to the email's
  // local part for accounts that never set a full name.
  const firstName = client?.fullName?.trim().split(/\s+/)[0] ?? client?.email?.split("@")[0] ?? null;

  return (
    <div className="ptb-dash">
      <header>
        <BrandMark />
        <a href="/build" style={{ fontSize: 13, fontWeight: 600 }}>
          Build a quote
        </a>
      </header>
      <main>
        <MyQuotesClient
          quotes={quotes}
          designRequests={designRequests}
          clientLabel={clientLabel}
          firstName={firstName}
          styleFinderResult={styleFinderResult}
        />
      </main>
    </div>
  );
}
