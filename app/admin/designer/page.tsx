import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DesignRequestStatus, Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import { PACKAGE_LABELS, spaceKeysToLabels } from "@/lib/spaces";
import AdminShell from "../AdminShell";
import "../../dashboard.css";

const STATUS_LABEL: Record<DesignRequestStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_progress: "In progress",
  delivered: "Delivered",
};

export default async function AdminDesignerPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.admin) redirect(ROLE_HOME[session.role]);

  const requests = await prisma.designRequest.findMany({
    where: { status: { not: DesignRequestStatus.draft } },
    include: { client: true, designer: true },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <AdminShell active="designer">
      <h1>Design requests</h1>
      <p className="sub">Every design survey a client has submitted, and where it stands with the designer.</p>

      {requests.length === 0 ? (
        <div className="empty">No design requests have been submitted yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Submitted</th>
              <th>Client</th>
              <th>Package</th>
              <th>Size</th>
              <th>Spaces</th>
              <th>Designer</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "-"}</td>
                <td>
                  {r.client.fullName ?? r.client.email}
                  <br />
                  <span className="sub" style={{ marginBottom: 0 }}>
                    {r.client.email}
                  </span>
                </td>
                <td>{PACKAGE_LABELS[r.packageKey] ?? r.packageKey}</td>
                <td>{r.sqft.toLocaleString()} sqft</td>
                <td style={{ maxWidth: 220 }}>{spaceKeysToLabels(r.spaces).join(", ") || "-"}</td>
                <td>{r.designer?.fullName ?? r.designer?.email ?? "-"}</td>
                <td>
                  <span className={`status-badge ${r.status}`}>{STATUS_LABEL[r.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminShell>
  );
}
