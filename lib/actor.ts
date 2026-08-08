import "server-only";
import { getSession } from "@/lib/auth";
import { getOrCreateAnonSessionId } from "@/lib/anonSession";
import { Role } from "@/app/generated/prisma/enums";

// Whoever is currently building a quote or design request - a signed-in
// client, or an anonymous visitor identified by their ptb_anon cookie.
// Build/Design mutations resolve one of these once per request instead of
// hard-requiring a session, so both flows work identically for either case.
export type Actor = { clientId: string } | { anonymousSessionId: string };

export async function resolveActor(): Promise<Actor> {
  const session = await getSession();
  if (session && session.role === Role.client) return { clientId: session.id };
  return { anonymousSessionId: await getOrCreateAnonSessionId() };
}

// True when the given row (already fetched) belongs to this actor - checks
// whichever field the row actually has set, since a row has exactly one of
// clientId/anonymousSessionId populated until it's claimed onto an account.
export function actorOwns(actor: Actor, row: { clientId: string | null; anonymousSessionId: string | null }): boolean {
  if ("clientId" in actor) return row.clientId === actor.clientId;
  return row.anonymousSessionId === actor.anonymousSessionId;
}
