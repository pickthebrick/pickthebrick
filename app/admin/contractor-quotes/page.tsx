import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME, isAdminRole } from "@/lib/roles";
import AdminShell from "../AdminShell";
import "../../dashboard.css";

export default async function AdminContractorQuotesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminRole(session.role)) redirect(ROLE_HOME[session.role]);

  // Counts every quote a contractor has ever downloaded a PDF for
  // (contractorCompletedAt), regardless of whether they later deleted it
  // from their own dashboard (deleteContractorQuote only sets
  // contractorHiddenAt - the row and this count are unaffected) - this is
  // the backed-up "quotes created" figure the business will eventually
  // price a per-quote service against.
  const contractors = await prisma.user.findMany({
    where: { role: Role.contractor },
    select: {
      id: true,
      fullName: true,
      company: true,
      email: true,
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
    }))
    .sort((a, b) => b.count - a.count);

  const totalQuotes = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <AdminShell active="contractorQuotes" isSuperAdmin={session.role === Role.super_admin}>
      <h1>Contractor Quotes</h1>
      <p className="sub">
        How many free client quotes each contractor has built and downloaded via their own dashboard. Kept as a
        permanent record even if the contractor later deletes the quote from their side - the future basis for
        billing this as a per-quote service.
      </p>
      {rows.length === 0 ? (
        <div className="empty">No contractor accounts yet.</div>
      ) : (
        <>
          <p className="sub">
            {totalQuotes} quote{totalQuotes !== 1 ? "s" : ""} downloaded across {rows.length} contractor
            {rows.length !== 1 ? "s" : ""}.
          </p>
          <table>
            <thead>
              <tr>
                <th>Contractor</th>
                <th>Company</th>
                <th>Email</th>
                <th>Quotes downloaded</th>
                <th>Last quote</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.fullName ?? "-"}</td>
                  <td>{r.company ?? "-"}</td>
                  <td>{r.email}</td>
                  <td>{r.count}</td>
                  <td>{r.lastQuoteAt ? new Date(r.lastQuoteAt).toLocaleDateString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </AdminShell>
  );
}
