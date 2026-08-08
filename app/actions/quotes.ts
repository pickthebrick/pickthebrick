"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminRole, ADMIN_ROLES } from "@/lib/roles";
import { getSession } from "@/lib/auth";
import { resolveActor, actorOwns, type Actor } from "@/lib/actor";
import { Role, QuoteStatus, type Unit } from "@/app/generated/prisma/enums";
import {
  sendQuoteSubmittedEmail,
  sendQuoteSubmittedAdminAlertEmail,
  sendCaptainAssignedEmail,
  sendCaptainReassignedEmail,
  sendCaptainRemovedEmail,
  sendQuoteConfirmedEmail,
  sendQuoteApprovedEmail,
  sendQuotePaidEmail,
  sendContractorPaymentRecordedEmail,
} from "@/lib/email";
import { sendTemplatedWhatsApp } from "@/lib/whatsapp";

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  return session;
}

async function recalcTotals(quoteId: string) {
  const items = await prisma.quoteItem.findMany({ where: { quoteId } });
  const materialsTotal = items.reduce((s, i) => s + i.rate * i.qty, 0);
  await prisma.quote.update({
    where: { id: quoteId },
    data: { materialsTotal, installTotal: 0, grandTotal: materialsTotal },
  });
}

async function recordHistory(quoteId: string, fromStatus: string | null, toStatus: string, changedById: string) {
  await prisma.quoteStatusHistory.create({
    data: { quoteId, fromStatus, toStatus, changedById },
  });
}

// Returns (creating if needed) the caller's single active draft quote - this
// is what lets an in-progress cart survive a refresh/disconnect, since it
// lives in QuoteItem rows rather than page-level state. Works identically
// for a signed-in client or an anonymous visitor (see lib/actor.ts) - the
// resolved actor is stamped onto whichever of clientId/anonymousSessionId
// applies, so the same draft is found again on a later visit either way.
export async function getOrCreateDraftQuote() {
  const actor = await resolveActor();

  const existing = await prisma.quote.findFirst({ where: { ...actor, status: QuoteStatus.draft } });
  if (existing) return existing.id;

  const created = await prisma.quote.create({ data: { ...actor, status: QuoteStatus.draft } });
  return created.id;
}

export async function setQuoteDetails(quoteId: string, location: string, officeSize: string) {
  const actor = await resolveActor();
  await assertOwnDraft(quoteId, actor);

  if (!location.trim() || !officeSize.trim()) {
    throw new Error("Please fill in both the location and the office size");
  }

  await prisma.quote.update({
    where: { id: quoteId },
    data: { location: location.trim(), officeSize: officeSize.trim() },
  });
}

export type CartLineInput = {
  productId: string;
  name: string;
  categoryLabel: string;
  typeLabel: string;
  subtypeLabel: string;
  rate: number;
  unit: Unit;
  qty: number;
};

async function assertOwnDraft(quoteId: string, actor: Actor) {
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote || !actorOwns(actor, quote) || quote.status !== QuoteStatus.draft) {
    throw new Error("Quote is not an editable draft you own");
  }
}

export async function upsertCartItem(quoteId: string, line: CartLineInput) {
  const actor = await resolveActor();
  await assertOwnDraft(quoteId, actor);

  // Resolves the live Category by label so items can later be grouped by
  // categoryId for per-timeline-item contractor assignment (see
  // app/actions/timeline.ts) - the string categoryLabel is still stored
  // separately as a point-in-time snapshot, independent of the catalog
  // category ever being renamed.
  const category = await prisma.category.findFirst({ where: { label: line.categoryLabel } });

  await prisma.quoteItem.upsert({
    where: { quoteId_productId: { quoteId, productId: line.productId } },
    create: {
      quoteId,
      productId: line.productId,
      categoryId: category?.id,
      name: line.name,
      categoryLabel: line.categoryLabel,
      typeLabel: line.typeLabel,
      subtypeLabel: line.subtypeLabel,
      rate: line.rate,
      unit: line.unit,
      qty: line.qty,
      amount: line.rate * line.qty,
    },
    update: {
      qty: line.qty,
      amount: line.rate * line.qty,
    },
  });
  await recalcTotals(quoteId);
}

export async function removeCartItem(quoteId: string, productId: string) {
  const actor = await resolveActor();
  await assertOwnDraft(quoteId, actor);

  await prisma.quoteItem.delete({ where: { quoteId_productId: { quoteId, productId } } }).catch(() => {});
  await recalcTotals(quoteId);
}

// A client's own "Complete quote" pass is often a layman's best guess - the
// Captain who actually confirmed the project is expected to clean up the
// line items on their behalf (see CaptainClient.tsx's "Edit client's quote"
// link, which opens /build?editQuote=<id> in a new tab). Scoped to
// captain_confirmed rather than draft: assignment work (timeline items,
// contractor picks) is already keyed off this quote, so editing line items
// here never touches status/submission, just the cart contents/totals.
async function assertCaptainOwnsQuote(quoteId: string, captainId: string) {
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote || quote.captainId !== captainId || quote.status !== QuoteStatus.captain_confirmed) {
    throw new Error("Quote is not one you can edit");
  }
  return quote;
}

export async function captainUpsertCartItem(quoteId: string, line: CartLineInput) {
  const session = await requireSession();
  if (session.role !== Role.captain) throw new Error("Captain only");
  await assertCaptainOwnsQuote(quoteId, session.id);

  const category = await prisma.category.findFirst({ where: { label: line.categoryLabel } });

  await prisma.quoteItem.upsert({
    where: { quoteId_productId: { quoteId, productId: line.productId } },
    create: {
      quoteId,
      productId: line.productId,
      categoryId: category?.id,
      name: line.name,
      categoryLabel: line.categoryLabel,
      typeLabel: line.typeLabel,
      subtypeLabel: line.subtypeLabel,
      rate: line.rate,
      unit: line.unit,
      qty: line.qty,
      amount: line.rate * line.qty,
    },
    update: {
      qty: line.qty,
      amount: line.rate * line.qty,
    },
  });
  await recalcTotals(quoteId);
  revalidatePath("/my-quotes");
}

export async function captainRemoveCartItem(quoteId: string, productId: string) {
  const session = await requireSession();
  if (session.role !== Role.captain) throw new Error("Captain only");
  await assertCaptainOwnsQuote(quoteId, session.id);

  await prisma.quoteItem.delete({ where: { quoteId_productId: { quoteId, productId } } }).catch(() => {});
  await recalcTotals(quoteId);
  revalidatePath("/my-quotes");
}

export async function captainSetQuoteDetails(quoteId: string, location: string, officeSize: string) {
  const session = await requireSession();
  if (session.role !== Role.captain) throw new Error("Captain only");
  await assertCaptainOwnsQuote(quoteId, session.id);

  if (!location.trim() || !officeSize.trim()) {
    throw new Error("Please fill in both the location and the office size");
  }

  await prisma.quote.update({
    where: { id: quoteId },
    data: { location: location.trim(), officeSize: officeSize.trim() },
  });
  revalidatePath("/my-quotes");
}

// Clears every line item plus the saved location/office-size off the
// caller's draft quote, leaving the same draft row so a fresh cart can be
// rebuilt against it - used by the build page's "Start over" button.
export async function startOverDraftQuote(quoteId: string) {
  const actor = await resolveActor();
  await assertOwnDraft(quoteId, actor);

  await prisma.quoteItem.deleteMany({ where: { quoteId } });
  await prisma.quote.update({
    where: { id: quoteId },
    data: { location: null, officeSize: null, materialsTotal: 0, installTotal: 0, grandTotal: 0 },
  });
  revalidatePath("/build");
}

// Lets a client add forgotten items to an already-submitted quote without
// touching the original record - copies its items/location/office-size onto
// a fresh draft (reusing the client's existing draft row if they happen to
// have one, exactly like getOrCreateDraftQuote, so there's never more than
// one draft for /build's own getOrCreateDraftQuote() to pick up next).
// Resubmitting the duplicate later gets its own new reference number.
export async function duplicateQuote(quoteId: string) {
  const session = await requireSession();
  if (session.role !== Role.client) throw new Error("Only clients can build quotes");

  const source = await prisma.quote.findUnique({ where: { id: quoteId }, include: { items: true } });
  if (!source || source.clientId !== session.id) throw new Error("Quote not found");
  if (source.status === QuoteStatus.draft) throw new Error("This quote hasn't been submitted yet");

  let draft = await prisma.quote.findFirst({ where: { clientId: session.id, status: QuoteStatus.draft } });
  if (draft) {
    await prisma.quoteItem.deleteMany({ where: { quoteId: draft.id } });
  } else {
    draft = await prisma.quote.create({ data: { clientId: session.id, status: QuoteStatus.draft } });
  }

  await prisma.quote.update({
    where: { id: draft.id },
    data: { location: source.location, officeSize: source.officeSize },
  });
  await prisma.quoteItem.createMany({
    data: source.items.map((item) => ({
      quoteId: draft.id,
      productId: item.productId,
      categoryId: item.categoryId,
      name: item.name,
      categoryLabel: item.categoryLabel,
      typeLabel: item.typeLabel,
      subtypeLabel: item.subtypeLabel,
      rate: item.rate,
      unit: item.unit,
      qty: item.qty,
      amount: item.amount,
    })),
  });
  await recalcTotals(draft.id);
  revalidatePath("/build");
  revalidatePath("/my-quotes");
  return draft.id;
}

// Allowed while draft or just-submitted - once a captain has confirmed it,
// real staff/contractor work may already be underway, so deletion stops
// being safe and the client would need to contact support instead.
export async function deleteQuote(quoteId: string) {
  const session = await requireSession();
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote || quote.clientId !== session.id) throw new Error("Quote not found");
  if (quote.status !== QuoteStatus.draft && quote.status !== QuoteStatus.submitted) {
    throw new Error("This quote is already being worked on and can no longer be deleted");
  }

  await prisma.quote.delete({ where: { id: quoteId } });
  revalidatePath("/my-quotes");
}

// DD/MM/YY/NN - counts quotes already submitted today to pick the sequence number.
async function generateReferenceNumber(): Promise<string> {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const countToday = await prisma.quote.count({
    where: { submittedAt: { gte: dayStart, lt: dayEnd } },
  });
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear() % 100).padStart(2, "0");
  const nn = String(countToday + 1).padStart(2, "0");
  return `${dd}/${mm}/${yy}/${nn}`;
}

export async function submitQuote(quoteId: string) {
  const actor = await resolveActor();
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: true, client: true },
  });
  if (!quote || !actorOwns(actor, quote)) throw new Error("Quote not found");
  if (quote.status !== QuoteStatus.draft) throw new Error("Quote is not in draft status");
  if (quote.items.length === 0) throw new Error("Cannot submit an empty quote");
  if (!("clientId" in actor)) throw new Error("Please sign in to submit your quote");

  await recalcTotals(quoteId);
  const referenceNumber = await generateReferenceNumber();
  await prisma.quote.update({
    where: { id: quoteId },
    data: { status: QuoteStatus.submitted, submittedAt: new Date(), referenceNumber },
  });
  if ("clientId" in actor) {
    await recordHistory(quoteId, quote.status, QuoteStatus.submitted, actor.clientId);
  }
  const clientEmail = quote.client?.email ?? quote.contactEmail ?? undefined;
  const clientWhatsapp = quote.client?.whatsappNumber ?? quote.contactPhone;
  if (clientEmail) await sendQuoteSubmittedEmail(clientEmail);
  await sendTemplatedWhatsApp("quote_submitted", clientWhatsapp);

  const admins = await prisma.user.findMany({ where: { role: { in: ADMIN_ROLES } } });
  const clientLabel = quote.client?.email ?? quote.contactEmail ?? quote.contactPhone ?? "an anonymous lead";
  for (const admin of admins) {
    await sendQuoteSubmittedAdminAlertEmail(admin.email, clientLabel, referenceNumber);
    await sendTemplatedWhatsApp("quote_submitted_admin_alert", admin.whatsappNumber, {
      clientEmail: clientLabel,
      referenceNumber,
    });
  }

  revalidatePath("/captain");
  revalidatePath("/my-quotes");
  revalidatePath("/admin/quotes");
}

// Admin assigns a captain to a project - captains no longer self-claim, and
// no longer separately "confirm" a quote either: assigning a captain to a
// still-submitted quote immediately confirms it (contractor assignment now
// happens per timeline item in the Projects tab, see app/actions/timeline.ts,
// rather than gating confirmation). Reassignable at any later stage too
// (captain terminated / left on an emergency) - since SiteInspectionRequest/
// PaymentClaim/ProjectTimelineItem are all keyed by quoteId rather than
// captainId, simply swapping captainId here already "transfers" every bit
// of the project's data to whoever takes over.
export async function assignCaptain(quoteId: string, captainId: string) {
  const session = await requireSession();
  if (!isAdminRole(session.role)) throw new Error("Only an admin can assign a captain");

  const captain = await prisma.user.findUnique({ where: { id: captainId } });
  if (!captain || captain.role !== Role.captain) throw new Error("captainId must reference a captain");

  const quote = await prisma.quote.findUnique({ where: { id: quoteId }, include: { captain: true, client: true } });
  if (!quote) throw new Error("Quote not found");
  if (quote.status === QuoteStatus.draft) throw new Error("Quote must be submitted before a captain can be assigned");
  if (quote.captainId === captainId) return;

  const previousCaptain = quote.captain;

  if (quote.status === QuoteStatus.submitted) {
    await prisma.quote.update({
      where: { id: quoteId },
      data: { captainId, status: QuoteStatus.captain_confirmed, confirmedAt: new Date() },
    });
    await recordHistory(quoteId, quote.status, QuoteStatus.captain_confirmed, session.id);
    await sendCaptainAssignedEmail(captain.email, quoteId);
    await sendTemplatedWhatsApp("captain_assigned", captain.whatsappNumber, { quoteId });
    const clientEmail = quote.client?.email ?? quote.contactEmail;
    if (clientEmail) await sendQuoteConfirmedEmail(clientEmail);
    await sendTemplatedWhatsApp("quote_confirmed", quote.client?.whatsappNumber ?? quote.contactPhone);
  } else {
    await prisma.quote.update({ where: { id: quoteId }, data: { captainId } });
    // Mid-project swap - notify both sides since a whole active project is changing hands.
    await sendCaptainReassignedEmail(captain.email, quoteId);
    await sendTemplatedWhatsApp("captain_reassigned", captain.whatsappNumber, { quoteId });
    if (previousCaptain) {
      await sendCaptainRemovedEmail(previousCaptain.email, quoteId);
      await sendTemplatedWhatsApp("captain_removed", previousCaptain.whatsappNumber, { quoteId });
    }
  }
  revalidatePath("/captain");
  revalidatePath("/admin/quotes");
  revalidatePath("/admin/projects");
  revalidatePath("/admin");
}

// Clears the captain off a project - the project simply disappears from
// that captain's dashboard (app/captain/page.tsx filters by captainId), no
// status change. Doesn't touch draft quotes since there's nothing to unassign yet.
export async function unassignCaptain(quoteId: string) {
  const session = await requireSession();
  if (!isAdminRole(session.role)) throw new Error("Only an admin can unassign a captain");

  const quote = await prisma.quote.findUnique({ where: { id: quoteId }, include: { captain: true } });
  if (!quote) throw new Error("Quote not found");
  if (quote.status === QuoteStatus.draft) throw new Error("This quote has no captain to unassign yet");
  if (!quote.captainId) return;

  const previousCaptain = quote.captain;
  await prisma.quote.update({ where: { id: quoteId }, data: { captainId: null } });

  if (previousCaptain) {
    await sendCaptainRemovedEmail(previousCaptain.email, quoteId);
    await sendTemplatedWhatsApp("captain_removed", previousCaptain.whatsappNumber, { quoteId });
  }
  revalidatePath("/captain");
  revalidatePath("/admin/quotes");
  revalidatePath("/admin/projects");
  revalidatePath("/admin");
}

export async function approveQuote(quoteId: string) {
  const session = await requireSession();
  if (!isAdminRole(session.role)) throw new Error("Only an admin can approve a quote");

  const quote = await prisma.quote.findUnique({ where: { id: quoteId }, include: { client: true } });
  if (!quote) throw new Error("Quote not found");
  if (quote.status !== QuoteStatus.captain_confirmed) throw new Error("Quote must be captain-confirmed before approval");

  await prisma.quote.update({
    where: { id: quoteId },
    data: { status: QuoteStatus.admin_approved, approvedAt: new Date() },
  });
  await recordHistory(quoteId, quote.status, QuoteStatus.admin_approved, session.id);
  const approvedClientEmail = quote.client?.email ?? quote.contactEmail;
  if (approvedClientEmail) await sendQuoteApprovedEmail(approvedClientEmail);
  await sendTemplatedWhatsApp("quote_approved", quote.client?.whatsappNumber ?? quote.contactPhone);
  revalidatePath("/admin");
}

export async function markQuotePaid(quoteId: string) {
  const session = await requireSession();
  if (!isAdminRole(session.role)) throw new Error("Only an admin can mark a quote as paid");

  const quote = await prisma.quote.findUnique({ where: { id: quoteId }, include: { client: true, contractor: true } });
  if (!quote) throw new Error("Quote not found");
  if (quote.status !== QuoteStatus.admin_approved) throw new Error("Quote must be admin-approved before it can be marked paid");

  await prisma.quote.update({
    where: { id: quoteId },
    data: { status: QuoteStatus.paid, paidAt: new Date() },
  });
  await recordHistory(quoteId, quote.status, QuoteStatus.paid, session.id);
  const paidClientEmail = quote.client?.email ?? quote.contactEmail;
  if (paidClientEmail) await sendQuotePaidEmail(paidClientEmail);
  await sendTemplatedWhatsApp("quote_paid", quote.client?.whatsappNumber ?? quote.contactPhone);
  if (quote.contractor) {
    await sendContractorPaymentRecordedEmail(quote.contractor.email, quoteId);
    await sendTemplatedWhatsApp("contractor_payment_recorded", quote.contractor.whatsappNumber, { quoteId });
  }
  revalidatePath("/admin");
  revalidatePath("/contractor");
}
