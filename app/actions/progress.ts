"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { getSession } from "@/lib/auth";
import { Role, SiteInspectionStatus, PaymentClaimStatus, TimelineItemStatus } from "@/app/generated/prisma/enums";
import {
  sendProgressReportedEmail,
  sendProgressApprovedEmail,
  sendSiteInspectionRequestedEmail,
  sendSiteInspectionRespondedEmail,
  sendPaymentClaimRequestedEmail,
  sendPaymentClaimResolvedEmail,
  money,
} from "@/lib/email";
import { sendTemplatedWhatsApp } from "@/lib/whatsapp";
import { applyContractorReduction, blendedReductionPercent } from "@/lib/contractorPricing";

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  return session;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

// A project's eligible-to-claim percent is the average, across every
// *assigned* timeline item on it, of that item's own captain-approved
// progress (delivery weighted 40%, site work 60%) - unassigned items have no
// contractor yet and don't factor in.
function eligiblePercent(rows: { deliveryApproved: number; siteApproved: number }[]) {
  if (rows.length === 0) return 0;
  const total = rows.reduce((s, r) => s + (r.deliveryApproved * 0.4 + r.siteApproved * 0.6), 0);
  return Math.round(total / rows.length);
}

async function requireOwnAssignment(timelineItemId: string, contractorId: string) {
  const assignment = await prisma.projectTimelineItem.findUnique({
    where: { id: timelineItemId },
    include: { quote: { include: { captain: true } } },
  });
  if (!assignment || assignment.contractorId !== contractorId || assignment.status !== TimelineItemStatus.assigned) {
    throw new Error("This assignment isn't yours");
  }
  return assignment;
}

// Admin has the same progress-management access as the assigned captain
// (see "Projects" in AdminShell) - bypasses the ownership check entirely.
async function requireCaptainOrAdminAssignment(timelineItemId: string, session: { id: string; role: Role }) {
  const assignment = await prisma.projectTimelineItem.findUnique({
    where: { id: timelineItemId },
    include: { quote: true, contractor: true },
  });
  if (!assignment || assignment.status !== TimelineItemStatus.assigned || !assignment.contractor) {
    throw new Error("This timeline item isn't assigned to a contractor yet");
  }
  if (isAdminRole(session.role)) return { ...assignment, contractor: assignment.contractor };
  if (assignment.quote.captainId !== session.id) throw new Error("This project isn't assigned to you");
  return { ...assignment, contractor: assignment.contractor };
}

export async function reportProgress(
  timelineItemId: string,
  input: { deliveryReported?: number; siteReported?: number },
) {
  const session = await requireSession();
  if (session.role !== Role.contractor) throw new Error("Only a contractor can report progress");
  const assignment = await requireOwnAssignment(timelineItemId, session.id);

  const data: { deliveryReported?: number; siteReported?: number } = {};
  if (input.deliveryReported !== undefined) data.deliveryReported = clampPercent(input.deliveryReported);
  if (input.siteReported !== undefined) data.siteReported = clampPercent(input.siteReported);

  await prisma.projectTimelineItem.update({ where: { id: timelineItemId }, data });

  if (assignment.quote.captain) {
    await sendProgressReportedEmail(assignment.quote.captain.email, assignment.quoteId);
    await sendTemplatedWhatsApp("progress_reported", assignment.quote.captain.whatsappNumber, { quoteId: assignment.quoteId });
  }
  revalidatePath("/contractor");
  revalidatePath("/captain");
}

export async function approveProgress(
  timelineItemId: string,
  input: { approveDelivery?: boolean; approveSite?: boolean },
) {
  const session = await requireSession();
  if (session.role !== Role.captain && !isAdminRole(session.role)) throw new Error("Only a captain or admin can approve progress");
  const assignment = await requireCaptainOrAdminAssignment(timelineItemId, session);

  const data: { deliveryApproved?: number; siteApproved?: number } = {};
  if (input.approveDelivery) data.deliveryApproved = assignment.deliveryReported;
  if (input.approveSite) data.siteApproved = assignment.siteReported;
  if (Object.keys(data).length === 0) return;

  await prisma.projectTimelineItem.update({ where: { id: timelineItemId }, data });

  await sendProgressApprovedEmail(assignment.contractor.email, assignment.quoteId);
  await sendTemplatedWhatsApp("progress_approved", assignment.contractor.whatsappNumber, { quoteId: assignment.quoteId });
  revalidatePath("/contractor");
  revalidatePath("/captain");
  revalidatePath("/admin/projects");
}

// A captain can set a contractor's progress directly (reported and/or
// approved), not just sign off on what the contractor already reported -
// some contractors aren't tech-savvy and never touch the portal themselves.
export async function setContractorProgress(
  timelineItemId: string,
  input: { deliveryReported?: number; deliveryApproved?: number; siteReported?: number; siteApproved?: number },
) {
  const session = await requireSession();
  if (session.role !== Role.captain && !isAdminRole(session.role)) throw new Error("Only a captain or admin can set progress");
  const assignment = await requireCaptainOrAdminAssignment(timelineItemId, session);

  const data: Record<string, number> = {};
  if (input.deliveryReported !== undefined) data.deliveryReported = clampPercent(input.deliveryReported);
  if (input.deliveryApproved !== undefined) data.deliveryApproved = clampPercent(input.deliveryApproved);
  if (input.siteReported !== undefined) data.siteReported = clampPercent(input.siteReported);
  if (input.siteApproved !== undefined) data.siteApproved = clampPercent(input.siteApproved);
  if (Object.keys(data).length === 0) return;

  await prisma.projectTimelineItem.update({ where: { id: timelineItemId }, data });

  await sendProgressApprovedEmail(assignment.contractor.email, assignment.quoteId);
  await sendTemplatedWhatsApp("progress_approved", assignment.contractor.whatsappNumber, { quoteId: assignment.quoteId });
  revalidatePath("/contractor");
  revalidatePath("/captain");
  revalidatePath("/admin/projects");
}

async function requireAssignedToQuote(quoteId: string, contractorId: string) {
  const quote = await prisma.quote.findUnique({ where: { id: quoteId }, include: { captain: true } });
  if (!quote) throw new Error("Project not found");
  const isAssigned = await prisma.projectTimelineItem.findFirst({
    where: { quoteId, contractorId, status: TimelineItemStatus.assigned },
  });
  if (!isAssigned) throw new Error("This project isn't assigned to you");
  return quote;
}

export async function requestSiteInspection(quoteId: string, preferredDate?: string, note?: string) {
  const session = await requireSession();
  if (session.role !== Role.contractor) throw new Error("Only a contractor can request a site inspection");
  const quote = await requireAssignedToQuote(quoteId, session.id);

  await prisma.siteInspectionRequest.create({
    data: {
      quoteId,
      note: note?.trim() || null,
      preferredDate: preferredDate ? new Date(preferredDate) : null,
    },
  });

  if (quote.captain) {
    await sendSiteInspectionRequestedEmail(quote.captain.email, quoteId);
    await sendTemplatedWhatsApp("site_inspection_requested", quote.captain.whatsappNumber, { quoteId });
  }
  revalidatePath("/contractor");
  revalidatePath("/captain");
}

// Lets a captain/admin schedule a site visit directly, without waiting on a
// contractor's request first - skips straight to `scheduled` rather than
// going through the `requested` stage.
export async function createSiteInspection(quoteId: string, scheduledAt: string, note?: string) {
  const session = await requireSession();
  if (session.role !== Role.captain && !isAdminRole(session.role)) throw new Error("Only a captain or admin can schedule a site visit");

  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new Error("Project not found");
  if (session.role === Role.captain && quote.captainId !== session.id) throw new Error("This project isn't assigned to you");

  await prisma.siteInspectionRequest.create({
    data: {
      quoteId,
      status: SiteInspectionStatus.scheduled,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      captainNote: note?.trim() || null,
    },
  });
  revalidatePath("/contractor");
  revalidatePath("/captain");
  revalidatePath("/admin/projects");
}

// The captain's frozen write-up of what happened on site - only allowed
// once, on a completed inspection. Kept separate from captainNote (which is
// just scheduling context and can be edited freely).
export async function recordSiteVisitNotes(id: string, notes: string) {
  const session = await requireSession();
  if (session.role !== Role.captain && !isAdminRole(session.role)) throw new Error("Only a captain or admin can log visit notes");
  if (!notes.trim()) throw new Error("Please enter what you found on site");

  const inspection = await prisma.siteInspectionRequest.findUnique({
    where: { id },
    include: { quote: true },
  });
  if (!inspection) throw new Error("Inspection not found");
  if (session.role === Role.captain && inspection.quote.captainId !== session.id) throw new Error("This project isn't assigned to you");
  if (inspection.status !== SiteInspectionStatus.completed) throw new Error("Only completed visits can have notes logged");
  if (inspection.visitNotesRecordedAt) throw new Error("Visit notes have already been recorded and can't be changed");

  await prisma.siteInspectionRequest.update({
    where: { id },
    data: { visitNotes: notes.trim(), visitNotesRecordedAt: new Date() },
  });
  revalidatePath("/captain");
  revalidatePath("/admin/projects");
}

export async function respondToSiteInspection(
  id: string,
  input: { status: "scheduled" | "completed" | "cancelled"; scheduledAt?: string; captainNote?: string },
) {
  const session = await requireSession();
  if (session.role !== Role.captain && !isAdminRole(session.role)) throw new Error("Only a captain or admin can respond to a site inspection");

  const inspection = await prisma.siteInspectionRequest.findUnique({
    where: { id },
    include: {
      quote: {
        include: {
          timelineItems: { where: { status: TimelineItemStatus.assigned }, include: { contractor: true } },
        },
      },
    },
  });
  if (!inspection) throw new Error("Request not found");
  if (session.role === Role.captain && inspection.quote.captainId !== session.id) {
    throw new Error("This request isn't assigned to you");
  }

  await prisma.siteInspectionRequest.update({
    where: { id },
    data: {
      status: input.status as SiteInspectionStatus,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
      captainNote: input.captainNote?.trim() || null,
    },
  });

  const notified = new Set<string>();
  for (const ti of inspection.quote.timelineItems) {
    if (!ti.contractor || notified.has(ti.contractorId!)) continue;
    notified.add(ti.contractorId!);
    await sendSiteInspectionRespondedEmail(ti.contractor.email, inspection.quoteId, input.status);
    await sendTemplatedWhatsApp("site_inspection_responded", ti.contractor.whatsappNumber, {
      quoteId: inspection.quoteId,
      status: input.status,
    });
  }
  revalidatePath("/contractor");
  revalidatePath("/captain");
  revalidatePath("/admin/projects");
}

export async function requestPaymentClaim(quoteId: string, note?: string) {
  const session = await requireSession();
  if (session.role !== Role.contractor) throw new Error("Only a contractor can request a payment claim");
  const quote = await requireAssignedToQuote(quoteId, session.id);

  const assignments = await prisma.projectTimelineItem.findMany({
    where: { quoteId, status: TimelineItemStatus.assigned },
  });
  const requestedPercent = eligiblePercent(assignments);
  if (requestedPercent <= 0) throw new Error("No approved progress to claim payment against yet");

  // What this contractor is actually paid, not the client sell price - see
  // lib/contractorPricing.ts. Blended across their own categories on this
  // quote, since eligiblePercent itself stays a whole-project average.
  const myAssignments = assignments.filter((a) => a.contractorId === session.id);
  const myCategoryIds = [...new Set(myAssignments.map((a) => a.categoryId).filter((id): id is string => id !== null))];
  const myCategories = myCategoryIds.length
    ? await prisma.category.findMany({ where: { id: { in: myCategoryIds } }, select: { contractorReductionPercent: true } })
    : [];
  const myReduction = blendedReductionPercent(myCategories.map((c) => c.contractorReductionPercent));

  const requestedAmount = applyContractorReduction((requestedPercent / 100) * quote.grandTotal, myReduction);
  await prisma.paymentClaim.create({
    data: { quoteId, requestedPercent, requestedAmount, note: note?.trim() || null },
  });

  const admins = await prisma.user.findMany({ where: { role: Role.admin } });
  if (quote.captain) {
    await sendPaymentClaimRequestedEmail(quote.captain.email, quoteId, requestedAmount);
    await sendTemplatedWhatsApp("payment_claim_requested", quote.captain.whatsappNumber, {
      quoteId,
      amount: money(requestedAmount),
    });
  }
  for (const admin of admins) {
    await sendPaymentClaimRequestedEmail(admin.email, quoteId, requestedAmount);
    await sendTemplatedWhatsApp("payment_claim_requested", admin.whatsappNumber, { quoteId, amount: money(requestedAmount) });
  }
  revalidatePath("/contractor");
  revalidatePath("/captain");
  revalidatePath("/admin");
}

export async function resolvePaymentClaim(id: string, status: "approved" | "paid", note?: string) {
  const session = await requireSession();
  if (!isAdminRole(session.role)) throw new Error("Only an admin can resolve a payment claim");

  const claim = await prisma.paymentClaim.update({
    where: { id },
    data: { status: status as PaymentClaimStatus, resolvedAt: new Date(), note: note?.trim() || undefined },
    include: {
      quote: {
        include: {
          timelineItems: { where: { status: TimelineItemStatus.assigned }, include: { contractor: true } },
        },
      },
    },
  });

  const notified = new Set<string>();
  for (const ti of claim.quote.timelineItems) {
    if (!ti.contractor || notified.has(ti.contractorId!)) continue;
    notified.add(ti.contractorId!);
    await sendPaymentClaimResolvedEmail(ti.contractor.email, claim.quoteId, status);
    await sendTemplatedWhatsApp("payment_claim_resolved", ti.contractor.whatsappNumber, { quoteId: claim.quoteId, status });
  }
  revalidatePath("/contractor");
  revalidatePath("/admin");
}
