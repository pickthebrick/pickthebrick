import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME, isAdminRole } from "@/lib/roles";
import AdminShell from "../AdminShell";
import DesignerApplicationsClient from "./DesignerApplicationsClient";
import "../../dashboard.css";

export default async function AdminDesignerApplicationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminRole(session.role)) redirect(ROLE_HOME[session.role]);

  const applications = await prisma.designerApplication.findMany({
    select: {
      id: true,
      knowsRevit: true,
      location: true,
      country: true,
      whatsappNumber: true,
      portfolioUrl: true,
      cvFilePath: true,
      status: true,
      submittedAt: true,
      reviewedAt: true,
      reviewNote: true,
      designer: { select: { fullName: true, email: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <AdminShell active="designerApplications" isSuperAdmin={session.role === Role.super_admin}>
      <h1>Designer applications</h1>
      <p className="sub">Review and approve designers who&apos;ve applied to partner with us.</p>
      <DesignerApplicationsClient applications={applications} />
    </AdminShell>
  );
}
