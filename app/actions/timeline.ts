"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { getSession } from "@/lib/auth";
import { Role, TimelineItemStatus } from "@/app/generated/prisma/enums";
import { sendContractorAssignedEmail } from "@/lib/email";
import { sendTemplatedWhatsApp } from "@/lib/whatsapp";

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  return session;
}

// Same dual-role pattern as progress.ts's requireCaptainOrAdminAssignment -
// the assigned captain manages their own project's timeline, admin can
// manage any project's timeline (see "Projects" in AdminShell).
async function requireCaptainOrAdminForQuote(quoteId: string, session: { id: string; role: Role }) {
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new Error("Project not found");
  if (isAdminRole(session.role)) return quote;
  if (session.role === Role.captain && quote.captainId === session.id) return quote;
  throw new Error("This project isn't assigned to you");
}

function revalidateTimeline() {
  revalidatePath("/captain");
  revalidatePath("/admin/projects");
}

// The label is derived from the chosen category rather than typed - picking
// "Flooring" both labels the bar and pre-fills the category half of the
// Assign step below (see assignTimelineItemContractor), so the same choice
// isn't made twice.
export async function addTimelineItem(quoteId: string, categoryId: string, startDate: string, endDate: string) {
  const session = await requireSession();
  if (session.role !== Role.captain && !isAdminRole(session.role)) throw new Error("Only a captain or admin can edit the timeline");
  await requireCaptainOrAdminForQuote(quoteId, session);

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) throw new Error("Please choose a category");
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new Error("Please choose valid dates");
  if (end < start) throw new Error("End date can't be before the start date");

  const count = await prisma.projectTimelineItem.count({ where: { quoteId } });
  await prisma.projectTimelineItem.create({
    data: { quoteId, label: category.label, categoryId: category.id, startDate: start, endDate: end, sortOrder: count },
  });
  revalidateTimeline();
}

export async function updateTimelineItem(
  id: string,
  input: { label?: string; startDate?: string; endDate?: string },
) {
  const session = await requireSession();
  if (session.role !== Role.captain && !isAdminRole(session.role)) throw new Error("Only a captain or admin can edit the timeline");

  const item = await prisma.projectTimelineItem.findUnique({ where: { id } });
  if (!item) throw new Error("Timeline item not found");
  await requireCaptainOrAdminForQuote(item.quoteId, session);

  const data: { label?: string; startDate?: Date; endDate?: Date } = {};
  if (input.label !== undefined) {
    if (!input.label.trim()) throw new Error("Please enter a label");
    data.label = input.label.trim();
  }
  if (input.startDate !== undefined) data.startDate = new Date(input.startDate);
  if (input.endDate !== undefined) data.endDate = new Date(input.endDate);

  const start = data.startDate ?? item.startDate;
  const end = data.endDate ?? item.endDate;
  if (end < start) throw new Error("End date can't be before the start date");

  await prisma.projectTimelineItem.update({ where: { id }, data });
  revalidateTimeline();
}

// Must be an approved contractor, approved for this specific category, AND
// approved for this specific type within it (no category-only fallback -
// see the ContractorApplicationType model). A contractor approved before
// type-level expertise existed won't match here until they delete and
// reapply with types selected (see deleteContractorApplication in
// app/actions/contractors.ts).
async function assertAssignableContractor(contractorId: string, categoryId: string, typeId: string) {
  const contractor = await prisma.user.findUnique({
    where: { id: contractorId },
    include: { contractorApplication: { include: { categories: true, types: true } } },
  });
  if (!contractor || contractor.role !== Role.contractor) throw new Error("contractorId must reference a contractor");
  if (contractor.contractorApplication?.status !== "approved") throw new Error(`${contractor.email} is not an approved contractor`);
  if (!contractor.contractorApplication.categories.some((c) => c.categoryId === categoryId)) {
    throw new Error(`${contractor.email} isn't approved for that category`);
  }
  if (!contractor.contractorApplication.types.some((t) => t.typeId === typeId)) {
    throw new Error(`${contractor.email} isn't approved for that type`);
  }
  return contractor;
}

// Assigns (or reassigns) a timeline item's category/type/contractor -
// replaces the old "one contractor per category" flow: contractor
// assignment now happens per timeline item instead of gating quote
// confirmation. Flips status to `assigned`, at which point the item's
// progress fields (see app/actions/progress.ts) become editable.
export async function assignTimelineItemContractor(
  id: string,
  input: { categoryId: string; typeId: string; contractorId: string },
) {
  const session = await requireSession();
  if (session.role !== Role.captain && !isAdminRole(session.role)) throw new Error("Only a captain or admin can assign contractors");

  const item = await prisma.projectTimelineItem.findUnique({ where: { id } });
  if (!item) throw new Error("Timeline item not found");
  await requireCaptainOrAdminForQuote(item.quoteId, session);

  const type = await prisma.type.findUnique({ where: { id: input.typeId } });
  if (!type || type.categoryId !== input.categoryId) throw new Error("That type doesn't belong to the selected category");

  const contractor = await assertAssignableContractor(input.contractorId, input.categoryId, input.typeId);

  await prisma.projectTimelineItem.update({
    where: { id },
    data: {
      categoryId: input.categoryId,
      typeId: input.typeId,
      contractorId: input.contractorId,
      status: TimelineItemStatus.assigned,
    },
  });

  await sendContractorAssignedEmail(contractor.email, item.quoteId);
  await sendTemplatedWhatsApp("contractor_assigned", contractor.whatsappNumber, { quoteId: item.quoteId });
  revalidateTimeline();
  revalidatePath("/contractor");
}

// A contractor expressing interest in an unassigned item in a category
// they're approved for - see the "Open jobs" tab in ContractorClient.tsx.
// Unassigned items don't have a typeId yet (that's only set once the
// captain/admin actually assigns someone), so this checks category-level
// approval rather than the exact-type rule assignTimelineItemContractor
// enforces. Purely informational (surfaced as a marker in GanttChart's
// Contractor picker); doesn't reserve the item or block anyone else from
// being assigned.
export async function applyForOpenJob(timelineItemId: string) {
  const session = await requireSession();
  if (session.role !== Role.contractor) throw new Error("Only a contractor can apply for a job");

  const item = await prisma.projectTimelineItem.findUnique({ where: { id: timelineItemId } });
  if (!item) throw new Error("Timeline item not found");
  if (item.status !== TimelineItemStatus.unassigned) throw new Error("This item has already been assigned");
  if (!item.categoryId) throw new Error("This item doesn't have a category set yet");

  const contractor = await prisma.user.findUnique({
    where: { id: session.id },
    include: { contractorApplication: { include: { categories: true } } },
  });
  if (contractor?.contractorApplication?.status !== "approved") throw new Error("Only approved contractors can apply");
  if (!contractor.contractorApplication.categories.some((c) => c.categoryId === item.categoryId)) {
    throw new Error("You're not approved for this category");
  }

  await prisma.timelineItemApplication.upsert({
    where: { timelineItemId_contractorId: { timelineItemId, contractorId: session.id } },
    create: { timelineItemId, contractorId: session.id },
    update: {},
  });
  revalidatePath("/contractor");
  revalidatePath("/captain");
  revalidatePath("/admin/projects");
}

export async function deleteTimelineItem(id: string) {
  const session = await requireSession();
  if (session.role !== Role.captain && !isAdminRole(session.role)) throw new Error("Only a captain or admin can edit the timeline");

  const item = await prisma.projectTimelineItem.findUnique({ where: { id } });
  if (!item) return;
  await requireCaptainOrAdminForQuote(item.quoteId, session);

  await prisma.projectTimelineItem.delete({ where: { id } });
  revalidateTimeline();
}
