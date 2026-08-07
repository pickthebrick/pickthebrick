import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { QuoteStatus, Role, TimelineItemStatus } from "@/app/generated/prisma/enums";
import { ROLE_HOME, isAdminRole } from "@/lib/roles";
import AdminShell from "../AdminShell";
import QuotesClient from "./QuotesClient";
import "../../dashboard.css";

export default async function AdminQuotesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminRole(session.role)) redirect(ROLE_HOME[session.role]);

  const [quotes, captains] = await Promise.all([
    prisma.quote.findMany({
      where: { status: { not: QuoteStatus.draft } },
      include: {
        client: true,
        captain: true,
        items: {
          select: {
            id: true,
            productId: true,
            name: true,
            categoryLabel: true,
            typeLabel: true,
            subtypeLabel: true,
            rate: true,
            qty: true,
            unit: true,
            amount: true,
            product: { select: { images: { orderBy: { sortOrder: "asc" }, take: 1, select: { path: true } } } },
          },
        },
        timelineItems: {
          where: { status: TimelineItemStatus.assigned },
          select: { contractor: { select: { fullName: true, email: true } } },
        },
      },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.user.findMany({ where: { role: Role.captain }, select: { id: true, fullName: true, email: true } }),
  ]);

  return (
    <AdminShell active="quotes" isSuperAdmin={session.role === Role.super_admin}>
      <h1>New Quotes</h1>
      <p className="sub">Every quote submitted by a client, across the full approval pipeline.</p>
      {quotes.length === 0 ? (
        <div className="empty">No quotes have been submitted yet.</div>
      ) : (
        <QuotesClient quotes={quotes} captains={captains} />
      )}
    </AdminShell>
  );
}
