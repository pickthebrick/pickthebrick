import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { QuoteStatus, Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import AdminShell from "../AdminShell";
import "../../dashboard.css";

const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  captain_confirmed: "Captain confirmed",
  admin_approved: "Approved",
  paid: "Paid",
};

export default async function AdminQuotesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.admin) redirect(ROLE_HOME[session.role]);

  const quotes = await prisma.quote.findMany({
    where: { status: { not: QuoteStatus.draft } },
    include: { client: true, captain: true, contractor: true },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <AdminShell active="quotes">
      <h1>All quotes</h1>
      <p className="sub">Every quote submitted by a client, across the full approval pipeline.</p>

      {quotes.length === 0 ? (
        <div className="empty">No quotes have been submitted yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Submitted</th>
              <th>Client</th>
              <th>Location</th>
              <th>Captain</th>
              <th>Contractor</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id}>
                <td>{q.submittedAt ? new Date(q.submittedAt).toLocaleString() : "-"}</td>
                <td>
                  {q.client.fullName ?? q.client.email}
                  <br />
                  <span className="sub" style={{ marginBottom: 0 }}>
                    {q.client.email}
                  </span>
                </td>
                <td>
                  {q.location ?? "-"}
                  {q.officeSize && <div className="sub" style={{ marginBottom: 0 }}>{q.officeSize}</div>}
                </td>
                <td>{q.captain?.fullName ?? q.captain?.email ?? "-"}</td>
                <td>{q.contractor?.fullName ?? q.contractor?.email ?? "-"}</td>
                <td>
                  <span className={`status-badge ${q.status}`}>{STATUS_LABEL[q.status]}</span>
                </td>
                <td style={{ textAlign: "right" }}>AED {q.grandTotal.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminShell>
  );
}
