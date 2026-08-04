import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { QuoteStatus, Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import AdminShell from "./AdminShell";
import AdminClient from "./AdminClient";
import "../dashboard.css";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.admin) redirect(ROLE_HOME[session.role]);

  const [toApprove, toPay] = await Promise.all([
    prisma.quote.findMany({ where: { status: QuoteStatus.captain_confirmed }, orderBy: { confirmedAt: "asc" } }),
    prisma.quote.findMany({ where: { status: QuoteStatus.admin_approved }, orderBy: { approvedAt: "asc" } }),
  ]);

  return (
    <AdminShell active="approvals">
      <AdminClient toApprove={toApprove} toPay={toPay} />
    </AdminShell>
  );
}
