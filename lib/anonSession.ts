import "server-only";
import { cookies } from "next/headers";

// Identifies an anonymous visitor building a quote or design request with no
// account - just a random id in a long-lived cookie, following the same
// cookie conventions as the real session (lib/auth.ts), but under its own
// name so a signed-in staff member browsing around never collides with a
// client's anonymous id. No DB table backs this - the id is only ever read
// back off Quote.anonymousSessionId / DesignRequest.anonymousSessionId.
const ANON_COOKIE = "ptb_anon";
const ANON_DAYS = 180;

export async function getAnonSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ANON_COOKIE)?.value ?? null;
}

export async function getOrCreateAnonSessionId(): Promise<string> {
  const existing = await getAnonSessionId();
  if (existing) return existing;

  const id = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(ANON_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + ANON_DAYS * 24 * 60 * 60 * 1000),
  });
  return id;
}

export async function clearAnonSessionId() {
  const cookieStore = await cookies();
  cookieStore.delete(ANON_COOKIE);
}
