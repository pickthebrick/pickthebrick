import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { QuoteStatus, Role, ContractorApplicationStatus } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import BrandMark from "@/app/components/BrandMark";
import CaptainClient from "./CaptainClient";
import "../dashboard.css";

const CLIENT_SELECT = { fullName: true, email: true, phone: true, company: true } as const;

export default async function CaptainPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.captain) redirect(ROLE_HOME[session.role]);

  const [contractorUsers, activeProjects, types, categories] = await Promise.all([
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
    prisma.quote.findMany({
      where: { captainId: session.id, status: { in: [QuoteStatus.captain_confirmed, QuoteStatus.admin_approved, QuoteStatus.paid] } },
      select: {
        id: true,
        status: true,
        confirmedAt: true,
        grandTotal: true,
        referenceNumber: true,
        location: true,
        officeSize: true,
        client: { select: CLIENT_SELECT },
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
    <div className="ptb-dash">
      <header>
        <BrandMark role="Captain" />
      </header>
      <CaptainClient activeProjects={activeProjects} contractors={contractors} types={types} categories={categories} />
    </div>
  );
}
