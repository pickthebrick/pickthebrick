import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { QuoteStatus, Role, TimelineItemStatus } from "@/app/generated/prisma/enums";
import { ROLE_HOME, isAdminRole } from "@/lib/roles";
import AdminShell from "./AdminShell";
import AdminClient from "./AdminClient";
import "../dashboard.css";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminRole(session.role)) redirect(ROLE_HOME[session.role]);

  const [toApprove, toPay, paymentClaims] = await Promise.all([
    prisma.quote.findMany({ where: { status: QuoteStatus.captain_confirmed }, orderBy: { confirmedAt: "asc" } }),
    prisma.quote.findMany({ where: { status: QuoteStatus.admin_approved }, orderBy: { approvedAt: "asc" } }),
    prisma.paymentClaim.findMany({
      where: { status: { not: "paid" } },
      select: {
        id: true,
        quoteId: true,
        requestedPercent: true,
        requestedAmount: true,
        status: true,
        requestedAt: true,
        quote: {
          select: {
            timelineItems: {
              where: { status: TimelineItemStatus.assigned },
              select: { contractor: { select: { fullName: true, email: true } } },
            },
          },
        },
      },
      orderBy: { requestedAt: "asc" },
    }),
  ]);

  return (
    <AdminShell active="approvals" isSuperAdmin={session.role === Role.super_admin}>
      <h1>Approvals</h1>
      <p className="sub">Quotes and payment claims waiting on an admin decision.</p>
      <AdminClient toApprove={toApprove} toPay={toPay} paymentClaims={paymentClaims} />
    </AdminShell>
  );
}
