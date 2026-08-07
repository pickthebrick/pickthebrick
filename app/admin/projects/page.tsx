import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { QuoteStatus, Role, ContractorApplicationStatus } from "@/app/generated/prisma/enums";
import { ROLE_HOME, isAdminRole } from "@/lib/roles";
import AdminShell from "../AdminShell";
import AdminProjectsClient from "./AdminProjectsClient";
import "../../dashboard.css";

export default async function AdminProjectsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminRole(session.role)) redirect(ROLE_HOME[session.role]);

  const [projects, contractorUsers, types, categories] = await Promise.all([
    prisma.quote.findMany({
      where: { status: { in: [QuoteStatus.captain_confirmed, QuoteStatus.admin_approved, QuoteStatus.paid] } },
      select: {
        id: true,
        status: true,
        confirmedAt: true,
        grandTotal: true,
        referenceNumber: true,
        location: true,
        officeSize: true,
        client: { select: { fullName: true, email: true } },
        captain: { select: { fullName: true, email: true } },
        inspections: {
          orderBy: { requestedAt: "desc" },
          select: {
            id: true,
            status: true,
            note: true,
            preferredDate: true,
            scheduledAt: true,
            captainNote: true,
            visitNotes: true,
            visitNotesRecordedAt: true,
            requestedAt: true,
          },
        },
        timelineItems: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            label: true,
            startDate: true,
            endDate: true,
            status: true,
            category: { select: { id: true, label: true } },
            type: { select: { id: true, label: true } },
            contractor: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                contractorApplication: { select: { companyName: true, contactPhone: true } },
              },
            },
            deliveryReported: true,
            deliveryApproved: true,
            siteReported: true,
            siteApproved: true,
            applications: { select: { contractorId: true } },
          },
        },
      },
      orderBy: { confirmedAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: Role.contractor, contractorApplication: { status: ContractorApplicationStatus.approved } },
      select: {
        id: true,
        fullName: true,
        email: true,
        contractorApplication: {
          select: { categories: { select: { categoryId: true } }, types: { select: { typeId: true } } },
        },
      },
    }),
    prisma.type.findMany({ select: { id: true, categoryId: true, label: true } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, label: true } }),
  ]);

  const contractors = contractorUsers.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    approvedCategoryIds: c.contractorApplication?.categories.map((cat) => cat.categoryId) ?? [],
    approvedTypeIds: c.contractorApplication?.types.map((t) => t.typeId) ?? [],
  }));

  return (
    <AdminShell active="projects" isSuperAdmin={session.role === Role.super_admin}>
      <h1>Projects</h1>
      <p className="sub">
        Every confirmed project across every captain and contractor - the same progress tools they have on their own
        dashboards, in one place.
      </p>
      <AdminProjectsClient projects={projects} contractors={contractors} types={types} categories={categories} />
    </AdminShell>
  );
}
