"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, createSession, destroySession } from "@/lib/auth";
import { getAnonSessionId, clearAnonSessionId } from "@/lib/anonSession";
import { Role, QuoteStatus } from "@/app/generated/prisma/enums";

// Not exported - deliberately NOT reusing app/actions/quotes.ts's own
// recalcTotals, since exporting a helper from a "use server" file turns it
// into a directly callable server action with none of that file's
// ownership checks. Same two-line calc, kept private to this file instead.
async function recalcQuoteTotals(quoteId: string) {
  const items = await prisma.quoteItem.findMany({ where: { quoteId } });
  const materialsTotal = items.reduce((s, i) => s + i.rate * i.qty, 0);
  await prisma.quote.update({ where: { id: quoteId }, data: { materialsTotal, installTotal: 0, grandTotal: materialsTotal } });
}

export type AuthResult = { success: true } | { error: string };

// Re-parents every Quote/DesignRequest tagged with this browser's ptb_anon
// cookie onto a just-authenticated client account, so signing up or signing
// in mid-Build/Design never loses what was already built anonymously - see
// lib/actor.ts. A no-op if there's no anon cookie (the common case for a
// normal login unrelated to Build/Design). Only wired for client accounts:
// a contractor/designer applicant signing up has no reason to inherit an
// unrelated anonymous quote. Exported (not just used internally by
// signUp/signIn below) so the Google OAuth callback route
// (app/api/auth/google/callback/route.ts) can call the same logic after
// completing its own sign-in.
export async function reparentAnonymousSession(clientId: string) {
  const anonId = await getAnonSessionId();
  if (!anonId) return;

  // A blind updateMany here used to blow past a client account that already
  // had its own draft quote (e.g. seeded before this browser ever signed
  // in, or built on another device) - reassigning the anonymous draft on
  // top of it left the client with two simultaneous draft quotes, and
  // getOrCreateDraftQuote()'s unordered findFirst could then hand back
  // either one on a later /build load: the one the client's cart UI was
  // just showing, or a different (possibly empty) one - an inconsistency
  // that surfaced as "the quote is submitted but the page is lost" /
  // "Cannot submit an empty quote" reports. Only one draft is ever meant to
  // exist per client, so merge into the existing one instead of overwriting.
  const anonDraft = await prisma.quote.findFirst({
    where: { anonymousSessionId: anonId, status: QuoteStatus.draft },
    include: { items: true },
  });
  if (anonDraft) {
    const clientDraft = await prisma.quote.findFirst({ where: { clientId, status: QuoteStatus.draft } });
    if (clientDraft) {
      const existingProductIds = new Set(
        (await prisma.quoteItem.findMany({ where: { quoteId: clientDraft.id }, select: { productId: true } })).map(
          (i) => i.productId,
        ),
      );
      for (const item of anonDraft.items) {
        // The client's own line wins on a collision - it's the one they
        // were already looking at when they signed in.
        if (existingProductIds.has(item.productId)) continue;
        await prisma.quoteItem.update({ where: { id: item.id }, data: { quoteId: clientDraft.id } });
      }
      if (!clientDraft.location && !clientDraft.officeSize) {
        await prisma.quote.update({
          where: { id: clientDraft.id },
          data: { location: anonDraft.location, officeSize: anonDraft.officeSize },
        });
      }
      await recalcQuoteTotals(clientDraft.id);
      await prisma.quote.delete({ where: { id: anonDraft.id } });
    } else {
      await prisma.quote.update({ where: { id: anonDraft.id }, data: { clientId, anonymousSessionId: null } });
    }
  }

  // Non-draft quotes can't actually be anonymous today (submitQuote
  // requires a signed-in actor - see app/actions/quotes.ts), but reassign
  // defensively in case that ever changes; there's no "existing" draft
  // concept to collide with once a quote is past draft status.
  await prisma.quote.updateMany({
    where: { anonymousSessionId: anonId, status: { not: QuoteStatus.draft } },
    data: { clientId, anonymousSessionId: null },
  });

  await prisma.designRequest.updateMany({
    where: { anonymousSessionId: anonId },
    data: { clientId, anonymousSessionId: null },
  });

  // StyleFinderResult is one-per-actor (@unique on both clientId and
  // anonymousSessionId - see schema.prisma), so a plain updateMany could
  // collide if this account already has its own result from a previous
  // session. Keep whichever is more recent, same "retaking overwrites" rule
  // submitStyleFinderResult() itself uses, rather than merging the two.
  const anonStyleResult = await prisma.styleFinderResult.findUnique({ where: { anonymousSessionId: anonId } });
  if (anonStyleResult) {
    const existingClientResult = await prisma.styleFinderResult.findUnique({ where: { clientId } });
    if (existingClientResult) {
      if (anonStyleResult.completedAt > existingClientResult.completedAt) {
        await prisma.styleFinderResult.delete({ where: { id: existingClientResult.id } });
        await prisma.styleFinderResult.update({
          where: { id: anonStyleResult.id },
          data: { clientId, anonymousSessionId: null },
        });
      } else {
        await prisma.styleFinderResult.delete({ where: { id: anonStyleResult.id } });
      }
    } else {
      await prisma.styleFinderResult.update({
        where: { id: anonStyleResult.id },
        data: { clientId, anonymousSessionId: null },
      });
    }
  }

  await clearAnonSessionId();
}

export async function signUp(input: {
  email: string;
  password: string;
  fullName?: string;
  // Optional, only ever collected on the plain client-signup form - a
  // contractor/designer gives that on their apply form instead.
  company?: string;
  // Only "contractor"/"designer" are ever honored here (the "Partner with
  // us" signup flows) - any other value, or omitting it, always falls back
  // to client. This is the sole carve-out from self-signup always creating a
  // client; captain/admin/marketing accounts remain admin-provisioned only
  // (see app/actions/team.ts).
  role?: "contractor" | "designer";
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password || input.password.length < 6) {
    return { error: "Enter a valid email and a password of at least 6 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists - try signing in instead." };
  }

  const role = input.role === "contractor" ? Role.contractor : input.role === "designer" ? Role.designer : Role.client;
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { email, passwordHash, fullName: input.fullName || null, company: input.company?.trim() || null, role },
  });
  // A brand-new contractor/designer applicant needs to land on their own
  // apply page (under /contractor or /designer) right after signup, so this
  // session can't be client-only - see the isPendingApplicant note in
  // signIn() below for the matching rule on subsequent sign-ins.
  await createSession(user.id, role !== Role.client);
  if (role === Role.client) await reparentAnonymousSession(user.id);
  return { success: true as const };
}

export async function signIn(input: { email: string; password: string; viaStaffLogin?: boolean }): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      contractorApplication: { select: { status: true } },
      designerApplication: { select: { status: true } },
    },
  });
  if (!user) return { error: "Invalid email or password." };
  if (!user.passwordHash) {
    return {
      error: user.googleId
        ? "This account signs in with Google - use the \"Continue with Google\" button, or set a password from your Profile page first."
        : "This account doesn't have a password set yet - use the link from your welcome or password-reset email to choose one.",
    };
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) return { error: "Invalid email or password." };

  // A contractor/designer whose application isn't approved yet still needs
  // to reach their own apply/status page through the plain public /login -
  // the client-only-via-/login rule only kicks in once they're an active
  // staff member with a real dashboard to protect behind /staff-login.
  const isPendingApplicant =
    (user.role === Role.contractor && user.contractorApplication?.status !== "approved") ||
    (user.role === Role.designer && user.designerApplication?.status !== "approved");

  await createSession(user.id, input.viaStaffLogin === true || isPendingApplicant);
  if (user.role === Role.client) await reparentAnonymousSession(user.id);
  return { success: true as const };
}

export async function signOutAction() {
  await destroySession();
}
