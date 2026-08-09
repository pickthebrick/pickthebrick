"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { resolveActor } from "@/lib/actor";
import { STYLE_FINDER_STYLES, MIN_SHOWN_FOR_CONFIDENT_PICK } from "@/lib/styleFinder";

function revalidateStyleFinder() {
  revalidatePath("/my-quotes");
  revalidatePath("/designer");
  revalidatePath("/design");
}

// Same ranking/confidence logic as the reference mockup's showResult() -
// duplicated server-side rather than trusting a client-supplied winner.
function computeTopStyle(stats: { styleKey: string; shown: number; liked: number }[]): string | null {
  const ranked = stats
    .filter((s) => s.shown > 0)
    .map((s) => ({ ...s, pct: Math.round((s.liked / s.shown) * 100) }))
    .sort((a, b) => b.pct - a.pct || b.liked - a.liked);
  const confident = ranked.filter((s) => s.shown >= MIN_SHOWN_FOR_CONFIDENT_PICK && s.pct > 0);
  return confident.length ? confident[0].styleKey : null;
}

// Keyed on the actor (clientId or anonymousSessionId), not any one
// DesignRequest - a client's style preference doesn't change per survey, so
// there's one profile per person, retaken/overwritten in place (see the
// @unique constraints on StyleFinderResult in schema.prisma). Works whether
// or not the actor has ever started a design request.
export async function submitStyleFinderResult(stats: { styleKey: string; shown: number; liked: number }[]) {
  const actor = await resolveActor();
  const where = "clientId" in actor ? { clientId: actor.clientId } : { anonymousSessionId: actor.anonymousSessionId };

  const validKeys = new Set(STYLE_FINDER_STYLES.map((s) => s.key));
  const cleanStats = stats.filter((s) => validKeys.has(s.styleKey) && s.shown > 0);
  const topStyle = computeTopStyle(cleanStats);

  await prisma.styleFinderResult.upsert({
    where,
    create: {
      ...actor,
      topStyle,
      stats: { create: cleanStats.map((s) => ({ styleKey: s.styleKey, shown: s.shown, liked: s.liked })) },
    },
    update: {
      topStyle,
      completedAt: new Date(),
      stats: { deleteMany: {}, create: cleanStats.map((s) => ({ styleKey: s.styleKey, shown: s.shown, liked: s.liked })) },
    },
  });

  revalidateStyleFinder();
}

// Read-only lookup for the client dashboard / handover entry card - null
// means the actor hasn't taken the quiz yet.
export async function getStyleFinderResultForCurrentActor() {
  const actor = await resolveActor();
  const where = "clientId" in actor ? { clientId: actor.clientId } : { anonymousSessionId: actor.anonymousSessionId };
  return prisma.styleFinderResult.findUnique({
    where,
    select: { topStyle: true, stats: { select: { styleKey: true, shown: true, liked: true } } },
  });
}
