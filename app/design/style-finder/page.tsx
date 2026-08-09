import StyleFinderClient from "./StyleFinderClient";
import { resolveActor } from "@/lib/actor";

// No ?id= needed - the quiz result is keyed on the actor (client/anon
// session), not any one DesignRequest, so it's reachable standalone (e.g.
// from the packages page) as well as from mid-survey. proxy.ts already
// treats every /design/* route as anonymous-ok, same as the rest of the flow.
// Optional ?return= sends "Continue" back into an in-progress survey (see
// HandoverClient.tsx's entry card) instead of the standalone
// signup/package-selection pitch.
export default async function StyleFinderPage({ searchParams }: { searchParams: Promise<{ return?: string }> }) {
  const { return: returnParam } = await searchParams;
  const actor = await resolveActor();
  const returnTo = returnParam && returnParam.startsWith("/") && !returnParam.startsWith("//") ? returnParam : null;
  return <StyleFinderClient isAnonymous={!("clientId" in actor)} returnTo={returnTo} />;
}
