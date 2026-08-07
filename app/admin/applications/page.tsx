import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME, isAdminRole } from "@/lib/roles";
import AdminShell from "../AdminShell";
import ApplicationsClient from "./ApplicationsClient";
import "../../dashboard.css";

export default async function AdminApplicationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminRole(session.role)) redirect(ROLE_HOME[session.role]);

  const [contractorApps, designerApps] = await Promise.all([
    prisma.contractorApplication.findMany({
      select: {
        id: true,
        licenseFilePath: true,
        status: true,
        submittedAt: true,
        reviewedAt: true,
        reviewNote: true,
        companyName: true,
        contactPhone: true,
        officeLocation: true,
        contractor: { select: { fullName: true, email: true, phone: true } },
        categories: { select: { category: { select: { id: true, label: true } } } },
        types: { select: { type: { select: { categoryId: true, label: true } } } },
      },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.designerApplication.findMany({
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
    }),
  ]);

  const applications = [
    ...contractorApps.map((app) => ({
      type: "contractor" as const,
      id: app.id,
      applicantName: app.contractor.fullName,
      applicantEmail: app.contractor.email,
      applicantPhone: app.contactPhone ?? app.contractor.phone,
      status: app.status,
      submittedAt: app.submittedAt,
      reviewedAt: app.reviewedAt,
      reviewNote: app.reviewNote,
      categories: app.categories.map((c) => ({
        label: c.category.label,
        types: app.types.filter((t) => t.type.categoryId === c.category.id).map((t) => t.type.label),
      })),
      companyName: app.companyName,
      officeLocation: app.officeLocation,
      licenseFilePath: app.licenseFilePath,
    })),
    ...designerApps.map((app) => ({
      type: "designer" as const,
      id: app.id,
      applicantName: app.designer.fullName,
      applicantEmail: app.designer.email,
      applicantPhone: app.whatsappNumber,
      status: app.status,
      submittedAt: app.submittedAt,
      reviewedAt: app.reviewedAt,
      reviewNote: app.reviewNote,
      knowsRevit: app.knowsRevit,
      location: app.location,
      country: app.country,
      portfolioUrl: app.portfolioUrl,
      cvFilePath: app.cvFilePath,
    })),
  ].sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

  return (
    <AdminShell active="applications" isSuperAdmin={session.role === Role.super_admin}>
      <h1>Applications</h1>
      <p className="sub">Review and approve contractors and designers who&apos;ve applied to partner with us.</p>
      <ApplicationsClient applications={applications} />
    </AdminShell>
  );
}
