import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { buildGoogleAuthorizeUrl } from "@/lib/googleAuth";

const STATE_COOKIE = "ptb_google_state";
const NEXT_COOKIE = "ptb_google_next";

// Kicks off Google's OAuth flow - linked from the "Continue with Google"
// button on app/login/LoginForm.tsx and app/components/AuthGate.tsx. The
// redirect URI is this same route's own callback, derived from the request's
// origin so dev/prod both work without an env var - both origins need
// registering as authorized redirect URIs in Google Cloud Console.
export async function GET(request: NextRequest) {
  const state = crypto.randomBytes(24).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  // AuthGate is opened mid-Build/Design-flow, so a plain redirect to
  // /my-quotes after Google sign-in would strand the client away from the
  // page they were on - carry the page they started from (via ?next=) so the
  // callback can send them back instead. LoginForm passes its own ?next=
  // through the same mechanism for consistency, though it usually has none.
  const next = request.nextUrl.searchParams.get("next");
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    cookieStore.set(NEXT_COOKIE, next, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
  } else {
    cookieStore.delete(NEXT_COOKIE);
  }

  const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`;
  return NextResponse.redirect(buildGoogleAuthorizeUrl(redirectUri, state));
}
