import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DesignRequestStatus, Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME, isAdminRole } from "@/lib/roles";
import AdminShell from "../AdminShell";
import AdminDesignerClient from "./AdminDesignerClient";
import "../../dashboard.css";

export default async function AdminDesignerPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminRole(session.role)) redirect(ROLE_HOME[session.role]);

  const [requests, designers] = await Promise.all([
    prisma.designRequest.findMany({
      where: { status: { not: DesignRequestStatus.draft } },
      select: {
        id: true,
        packageKey: true,
        sqft: true,
        status: true,
        submittedAt: true,
        claimDeadline: true,
        siteVisitRequested: true,
        designerId: true,
        revisionsUsed: true,
        client: { select: { fullName: true, email: true } },
        designer: { select: { fullName: true, email: true } },
        spaceEntries: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, spaceKey: true, notes: true, answers: { select: { questionKey: true, value: true } } },
        },
        files: { orderBy: { sortOrder: "asc" }, select: { id: true, label: true, filePath: true, createdAt: true } },
        revisionComments: {
          orderBy: { createdAt: "asc" },
          select: { id: true, authorRole: true, body: true, channel: true, createdAt: true },
        },
      },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.user.findMany({ where: { role: Role.designer }, select: { id: true, fullName: true, email: true } }),
  ]);

  return (
    <AdminShell active="designer" isSuperAdmin={session.role === Role.super_admin}>
      <h1>Design requests</h1>
      <p className="sub">Every design survey a client has submitted, and where it stands with the designer.</p>
      <AdminDesignerClient requests={requests} designers={designers} />
    </AdminShell>
  );
}
