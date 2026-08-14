import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role, TimelineItemStatus } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import { applyContractorReduction } from "@/lib/contractorPricing";
import BrandMark from "@/app/components/BrandMark";
import ContractorClient from "./ContractorClient";
import "../dashboard.css";

export default async function ContractorPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.contractor) redirect(ROLE_HOME[session.role]);

  const [assignments, contractorApp, contractor, myQuotes] = await Promise.all([
    prisma.projectTimelineItem.findMany({
      where: { contractorId: session.id, status: TimelineItemStatus.assigned },
      select: {
        id: true,
        label: true,
        deliveryReported: true,
        deliveryApproved: true,
        siteReported: true,
        siteApproved: true,
        category: { select: { label: true, contractorReductionPercent: true } },
        type: { select: { label: true } },
        quote: {
          select: {
            id: true,
            status: true,
            confirmedAt: true,
            grandTotal: true,
            referenceNumber: true,
            location: true,
            officeSize: true,
            items: { select: { id: true, name: true, categoryLabel: true, qty: true, unit: true } },
            timelineItems: {
              where: { status: TimelineItemStatus.assigned },
              select: { deliveryApproved: true, siteApproved: true },
            },
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
                requestedAt: true,
              },
            },
            paymentClaims: {
              orderBy: { requestedAt: "desc" },
              select: { id: true, requestedPercent: true, requestedAmount: true, status: true, requestedAt: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contractorApplication.findUnique({
      where: { contractorId: session.id },
      select: { categories: { select: { categoryId: true } } },
    }),
    prisma.user.findUnique({ where: { id: session.id }, select: { logoUrl: true, company: true } }),
    // A contractor's own quotes for their own clients - never a real
    // PickTheBrick-brokered project (see createContractorQuote in
    // app/actions/quotes.ts), so this is a separate list from `assignments`
    // above, which is real PTB project work assigned to this contractor.
    prisma.quote.findMany({
      where: { contractorId: session.id, contractorHiddenAt: null },
      select: {
        id: true,
        contactName: true,
        location: true,
        officeSize: true,
        grandTotal: true,
        createdAt: true,
        items: {
          select: {
            name: true,
            categoryLabel: true,
            rate: true,
            qty: true,
            unit: true,
            productId: true,
            product: { select: { images: { select: { path: true }, take: 1 } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // An unassigned timeline item only has a categoryId - its type isn't
  // chosen until the captain/admin actually assigns a contractor (see
  // assignTimelineItemContractor in app/actions/timeline.ts), so "matches
  // this contractor's approved types" can only be checked at the category
  // level here (approved for >=1 type in that category, per the "must
  // explicitly pick types" rule every approved category already has one).
  const approvedCategoryIds = contractorApp?.categories.map((c) => c.categoryId) ?? [];

  // Unassigned timeline items across every project in a category this
  // contractor is approved for - the "Open jobs" tab. Excludes
  // draft/unconfirmed quotes automatically since a timeline item only
  // exists once a project is confirmed.
  const openJobs =
    approvedCategoryIds.length === 0
      ? []
      : await prisma.projectTimelineItem.findMany({
          where: { status: TimelineItemStatus.unassigned, categoryId: { in: approvedCategoryIds } },
          select: {
            id: true,
            label: true,
            startDate: true,
            endDate: true,
            categoryId: true,
            category: { select: { label: true, contractorReductionPercent: true } },
            type: { select: { label: true } },
            quote: {
              select: {
                location: true,
                items: { select: { name: true, categoryId: true, qty: true, unit: true, amount: true } },
              },
            },
            applications: { select: { contractorId: true } },
          },
          orderBy: { createdAt: "desc" },
        });

  const openJobsForClient = openJobs.map((job) => {
    const matchingItems = job.quote.items.filter((it) => it.categoryId === job.categoryId);
    const sellTotal = matchingItems.reduce((sum, it) => sum + it.amount, 0);
    return {
      id: job.id,
      label: job.label,
      startDate: job.startDate,
      endDate: job.endDate,
      categoryLabel: job.category?.label ?? "-",
      typeLabel: job.type?.label ?? "-",
      location: job.quote.location,
      // The client sell price for this job's own category, reduced by that
      // category's contractor rate - not the whole project's grandTotal,
      // which may span other categories/contractors too.
      value: applyContractorReduction(sellTotal, job.category?.contractorReductionPercent ?? 15),
      matchingItems: matchingItems.map(({ name, categoryId, qty, unit }) => ({ name, categoryId, qty, unit })),
      hasApplied: job.applications.some((a) => a.contractorId === session.id),
    };
  });

  const myQuotesForClient = myQuotes.map((q) => ({
    id: q.id,
    clientName: q.contactName,
    location: q.location,
    officeSize: q.officeSize,
    grandTotal: q.grandTotal,
    createdAt: q.createdAt,
    itemCount: q.items.length,
    items: q.items,
  }));

  return (
    <div className="ptb-dash">
      <header>
        <BrandMark role="Contractor" logoUrl={contractor?.logoUrl} />
      </header>
      <ContractorClient
        assignments={assignments}
        openJobs={openJobsForClient}
        myQuotes={myQuotesForClient}
        logoUrl={contractor?.logoUrl}
        companyName={contractor?.company}
      />
    </div>
  );
}
