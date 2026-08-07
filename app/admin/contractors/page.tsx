import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME, isAdminRole } from "@/lib/roles";
import AdminShell from "../AdminShell";
import ContractorApplicationsClient from "./ContractorApplicationsClient";
import "../../dashboard.css";

export default async function AdminContractorsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminRole(session.role)) redirect(ROLE_HOME[session.role]);

  const applications = await prisma.contractorApplication.findMany({
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
  });

  return (
    <AdminShell active="contractors" isSuperAdmin={session.role === Role.super_admin}>
      <h1>Contractor applications</h1>
      <p className="sub">Review and approve contractors who&apos;ve applied to partner with us.</p>
      <ContractorApplicationsClient
        applications={applications.map((app) => ({
          ...app,
          categories: app.categories.map((c) => ({
            label: c.category.label,
            types: app.types.filter((t) => t.type.categoryId === c.category.id).map((t) => t.type.label),
          })),
        }))}
      />
    </AdminShell>
  );
}
