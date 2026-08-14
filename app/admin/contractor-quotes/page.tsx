import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME, isAdminRole } from "@/lib/roles";
import { getContractorQuoteLimit } from "@/lib/contractorPlan";
import AdminShell from "../AdminShell";
import ContractorQuotesClient from "./ContractorQuotesClient";
import "../../dashboard.css";

export default async function AdminContractorQuotesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminRole(session.role)) redirect(ROLE_HOME[session.role]);

  // Counts every quote a contractor has ever downloaded a PDF for
  // (contractorCompletedAt), regardless of whether they later deleted it
  // from their own dashboard (deleteContractorQuote only sets
  // contractorHiddenAt - the row and this count are unaffected) - this is
  // the same figure createContractorQuote checks against the free-quote
  // limit (lib/contractorPlan.ts).
  const contractors = await prisma.user.findMany({
    where: { role: Role.contractor },
    select: {
      id: true,
      fullName: true,
      company: true,
      email: true,
      contractorPlan: true,
      contractorPlanUpdatedAt: true,
      contractorFreeQuotaOverride: true,
      quotesAsContractor: {
        where: { contractorCompletedAt: { not: null } },
        select: { contractorCompletedAt: true },
        orderBy: { contractorCompletedAt: "desc" },
      },
    },
    orderBy: { fullName: "asc" },
  });

  const rows = contractors
    .map((c) => ({
      id: c.id,
      fullName: c.fullName,
      company: c.company,
      email: c.email,
      count: c.quotesAsContractor.length,
      lastQuoteAt: c.quotesAsContractor[0]?.contractorCompletedAt ?? null,
      plan: c.contractorPlan,
      planUpdatedAt: c.contractorPlanUpdatedAt,
      quotaLimit: getContractorQuoteLimit(c.contractorFreeQuotaOverride),
    }))
    .sort((a, b) => b.count - a.count);

  const totalQuotes = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <AdminShell active="contractorQuotes" isSuperAdmin={session.role === Role.super_admin}>
      <h1>Contractor Quotes</h1>
      <p className="sub">
        How many free client quotes each contractor has built and downloaded via their own dashboard, and whether
        they&apos;ve hit the free limit and need to be moved to a paid plan. Kept as a permanent record even if the
        contractor later deletes the quote from their side.
      </p>
      {rows.length === 0 ? (
        <div className="empty">No contractor accounts yet.</div>
      ) : (
        <>
          <p className="sub">
            {totalQuotes} quote{totalQuotes !== 1 ? "s" : ""} downloaded across {rows.length} contractor
            {rows.length !== 1 ? "s" : ""}.
          </p>
          <ContractorQuotesClient rows={rows} />
        </>
      )}
    </AdminShell>
  );
}
