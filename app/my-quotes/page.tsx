import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DesignRequestStatus, QuoteStatus, Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import { PACKAGE_LABELS, spaceKeysToLabels } from "@/lib/spaces";
import SignOutButton from "@/app/components/SignOutButton";
import BrandMark from "@/app/components/BrandMark";
import "../dashboard.css";

const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  captain_confirmed: "Captain confirmed",
  admin_approved: "Approved",
  paid: "Paid",
};

const DESIGN_STATUS_LABEL: Record<DesignRequestStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_progress: "In progress",
  delivered: "Delivered",
};

export default async function MyQuotesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.client) redirect(ROLE_HOME[session.role]);

  const [quotes, designRequests] = await Promise.all([
    prisma.quote.findMany({
      where: { clientId: session.id, status: { not: QuoteStatus.draft } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.designRequest.findMany({
      where: { clientId: session.id, status: { not: DesignRequestStatus.draft } },
      include: { files: { orderBy: { sortOrder: "asc" } } },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  return (
    <div className="ptb-dash">
      <header>
        <BrandMark />
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <a href="/build" style={{ fontSize: 13, fontWeight: 600 }}>
            Build a quote
          </a>
          <SignOutButton className="signout" />
        </div>
      </header>
      <main>
        <h1>My design requests</h1>
        <p className="sub">Your design survey submissions and what your designer has delivered.</p>

        {designRequests.length === 0 ? (
          <div className="empty">No design requests yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Package</th>
                <th>Spaces</th>
                <th>Status</th>
                <th>Files</th>
              </tr>
            </thead>
            <tbody>
              {designRequests.map((r) => (
                <tr key={r.id}>
                  <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "-"}</td>
                  <td>{PACKAGE_LABELS[r.packageKey] ?? r.packageKey}</td>
                  <td style={{ maxWidth: 220 }}>{spaceKeysToLabels(r.spaces).join(", ") || "-"}</td>
                  <td>
                    <span className={`status-badge ${r.status}`}>{DESIGN_STATUS_LABEL[r.status]}</span>
                  </td>
                  <td>
                    {r.files.length === 0 ? (
                      <span className="sub" style={{ marginBottom: 0 }}>
                        Not delivered yet
                      </span>
                    ) : (
                      r.files.map((f) => (
                        <div key={f.id}>
                          <a href={f.filePath} target="_blank" rel="noopener noreferrer">
                            {f.label}
                          </a>
                        </div>
                      ))
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h1 style={{ marginTop: 32 }}>My quotes</h1>
        <p className="sub">Quotes you&apos;ve submitted and their current status.</p>

        {quotes.length === 0 ? (
          <div className="empty">No submitted quotes yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td>{q.submittedAt ? new Date(q.submittedAt).toLocaleDateString() : "-"}</td>
                  <td>
                    <span className={`status-badge ${q.status}`}>{STATUS_LABEL[q.status]}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>AED {q.grandTotal.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
