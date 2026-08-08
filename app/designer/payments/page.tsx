import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role, DesignRequestStatus } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import { PACKAGE_LABELS } from "@/lib/spaces";
import { contactLabel } from "@/lib/contactLabel";
import DesignerShell from "../DesignerShell";
import "../../dashboard.css";

// Designers are freelancers, eligible for 40% of the package fee charged to
// the client - issued only once a request is fully delivered. This is a
// read-only summary computed from DesignRequest rows; the admin still
// reconciles the actual payout manually offline, same as contractor payment
// claims (see app/admin's Approvals tab).
const DESIGNER_SHARE = 0.4;

export default async function DesignerPaymentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.designer) redirect(ROLE_HOME[session.role]);

  const requests = await prisma.designRequest.findMany({
    where: { designerId: session.id, status: DesignRequestStatus.delivered },
    select: {
      id: true,
      packageKey: true,
      packagePrice: true,
      deliveredAt: true,
      contactPhone: true,
      contactEmail: true,
      client: { select: { fullName: true, email: true } },
    },
    orderBy: { deliveredAt: "desc" },
  });

  const totalOwed = requests.reduce((s, r) => s + (r.packagePrice ?? 0) * DESIGNER_SHARE, 0);

  return (
    <DesignerShell active="payments">
      <h1>Payments</h1>
      <p className="sub">You&apos;re eligible for 40% of the design fee on each request once it&apos;s delivered.</p>

      <div className="designer-package-summary" style={{ marginBottom: 16 }}>
        Total eligible: AED {totalOwed.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </div>

      {requests.length === 0 ? (
        <div className="empty">Nothing delivered yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Package</th>
              <th>Delivered</th>
              <th style={{ textAlign: "right" }}>Package fee</th>
              <th style={{ textAlign: "right" }}>Your share (40%)</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{contactLabel(r)}</td>
                <td>{PACKAGE_LABELS[r.packageKey] ?? r.packageKey}</td>
                <td>{r.deliveredAt ? new Date(r.deliveredAt).toLocaleDateString() : "-"}</td>
                <td style={{ textAlign: "right" }}>AED {(r.packagePrice ?? 0).toLocaleString()}</td>
                <td style={{ textAlign: "right" }}>AED {((r.packagePrice ?? 0) * DESIGNER_SHARE).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DesignerShell>
  );
}
