"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role, QuoteStatus, type Unit } from "@/app/generated/prisma/enums";

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
// lives in QuoteItem rows rather than page-level state.
export async function getOrCreateDraftQuote() {
  const session = await requireSession();
  if (session.role !== Role.client) throw new Error("Only clients can build quotes");

  const existing = await prisma.quote.findFirst({ where: { clientId: session.id, status: QuoteStatus.draft } });
  if (existing) return existing.id;

  const created = await prisma.quote.create({ data: { clientId: session.id, status: QuoteStatus.draft } });
  return created.id;
}

export async function setQuoteDetails(quoteId: string, location: string, officeSize: string) {
  const session = await requireSession();
  await assertOwnDraft(quoteId, session.id);

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

async function assertOwnDraft(quoteId: string, clientId: string) {
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote || quote.clientId !== clientId || quote.status !== QuoteStatus.draft) {
    throw new Error("Quote is not an editable draft you own");
  }
}

export async function upsertCartItem(quoteId: string, line: CartLineInput) {
  const session = await requireSession();
  await assertOwnDraft(quoteId, session.id);

  await prisma.quoteItem.upsert({
    where: { quoteId_productId: { quoteId, productId: line.productId } },
    create: {
      quoteId,
      productId: line.productId,
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
  const session = await requireSession();
  await assertOwnDraft(quoteId, session.id);

  await prisma.quoteItem.delete({ where: { quoteId_productId: { quoteId, productId } } }).catch(() => {});
  await recalcTotals(quoteId);
}

export async function submitQuote(quoteId: string) {
  const session = await requireSession();
  const quote = await prisma.quote.findUnique({ where: { id: quoteId }, include: { items: true } });
  if (!quote || quote.clientId !== session.id) throw new Error("Quote not found");
  if (quote.status !== QuoteStatus.draft) throw new Error("Quote is not in draft status");
  if (quote.items.length === 0) throw new Error("Cannot submit an empty quote");

  await recalcTotals(quoteId);
  await prisma.quote.update({
    where: { id: quoteId },
    data: { status: QuoteStatus.submitted, submittedAt: new Date() },
  });
  await recordHistory(quoteId, quote.status, QuoteStatus.submitted, session.id);
  revalidatePath("/captain");
  revalidatePath("/my-quotes");
}

export async function confirmQuote(quoteId: string, contractorId: string) {
  const session = await requireSession();
  if (session.role !== Role.captain) throw new Error("Only a captain can confirm a quote");

  const contractor = await prisma.user.findUnique({ where: { id: contractorId } });
  if (!contractor || contractor.role !== Role.contractor) throw new Error("contractorId must reference a contractor");

  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new Error("Quote not found");
  if (quote.status !== QuoteStatus.submitted) throw new Error("Quote must be submitted before it can be confirmed");

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      status: QuoteStatus.captain_confirmed,
      captainId: session.id,
      contractorId,
      confirmedAt: new Date(),
    },
  });
  await recordHistory(quoteId, quote.status, QuoteStatus.captain_confirmed, session.id);
  revalidatePath("/captain");
  revalidatePath("/admin");
}

export async function approveQuote(quoteId: string) {
  const session = await requireSession();
  if (session.role !== Role.admin) throw new Error("Only an admin can approve a quote");

  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new Error("Quote not found");
  if (quote.status !== QuoteStatus.captain_confirmed) throw new Error("Quote must be captain-confirmed before approval");

  await prisma.quote.update({
    where: { id: quoteId },
    data: { status: QuoteStatus.admin_approved, approvedAt: new Date() },
  });
  await recordHistory(quoteId, quote.status, QuoteStatus.admin_approved, session.id);
  revalidatePath("/admin");
}

export async function markQuotePaid(quoteId: string) {
  const session = await requireSession();
  if (session.role !== Role.admin) throw new Error("Only an admin can mark a quote as paid");

  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new Error("Quote not found");
  if (quote.status !== QuoteStatus.admin_approved) throw new Error("Quote must be admin-approved before it can be marked paid");

  await prisma.quote.update({
    where: { id: quoteId },
    data: { status: QuoteStatus.paid, paidAt: new Date() },
  });
  await recordHistory(quoteId, quote.status, QuoteStatus.paid, session.id);
  revalidatePath("/admin");
  revalidatePath("/contractor");
}
