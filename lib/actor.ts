import "server-only";
import { getSession } from "@/lib/auth";
import { getAnonSessionId, getOrCreateAnonSessionId } from "@/lib/anonSession";
import { Role } from "@/app/generated/prisma/enums";

// Whoever is currently building a quote or design request - a signed-in
// client, or an anonymous visitor identified by their ptb_anon cookie.
// Build/Design mutations resolve one of these once per request instead of
// hard-requiring a session, so both flows work identically for either case.
export type Actor =
  | {
      clientId: string;
      // The ptb_anon cookie still present on this request, if any - a
      // visitor who just signed in/up mid-flow already had their anonymous
      // rows reparented onto clientId (see reparentAnonymousSession in
      // app/actions/auth.ts), but that write and this read can land on
      // different pooled connections against Neon's serverless driver and
      // race. Carrying the still-present anon cookie here lets actorOwns()
      // recognize "same visitor, reparent just hasn't become visible on
      // this read yet" instead of a false ownership failure that bounces
      // them out of the survey/quote they were mid-way through.
      recentAnonymousSessionId?: string;
    }
  | { anonymousSessionId: string };

export async function resolveActor(): Promise<Actor> {
  const session = await getSession();
  if (session && session.role === Role.client) {
    return { clientId: session.id, recentAnonymousSessionId: (await getAnonSessionId()) ?? undefined };
  }
  return { anonymousSessionId: await getOrCreateAnonSessionId() };
}

// True when the given row (already fetched) belongs to this actor - checks
// whichever field the row actually has set, since a row has exactly one of
// clientId/anonymousSessionId populated until it's claimed onto an account.
// See the recentAnonymousSessionId comment above for why the clientId branch
// also accepts a not-yet-reparented anonymousSessionId match.
export function actorOwns(actor: Actor, row: { clientId: string | null; anonymousSessionId: string | null }): boolean {
  if ("clientId" in actor) {
    return row.clientId === actor.clientId || (!!actor.recentAnonymousSessionId && row.anonymousSessionId === actor.recentAnonymousSessionId);
  }
  return row.anonymousSessionId === actor.anonymousSessionId;
}
