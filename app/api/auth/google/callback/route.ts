import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { reparentAnonymousSession } from "@/app/actions/auth";
import { exchangeCodeForGoogleProfile } from "@/lib/googleAuth";
import { Role } from "@/app/generated/prisma/enums";

const STATE_COOKIE = "ptb_google_state";
const NEXT_COOKIE = "ptb_google_next";

// Finishes the flow started by app/api/auth/google/route.ts: verifies the
// CSRF state cookie, exchanges the code for the person's Google profile,
// finds-or-creates the matching User, signs them in, and (for clients) folds
// in any anonymous quote/design-request work-in-progress the same way
// signUp/signIn already do.
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  const next = cookieStore.get(NEXT_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);
  cookieStore.delete(NEXT_COOKIE);

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/login?error=google_auth_failed", request.url));
  }

  try {
    const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`;
    const profile = await exchangeCodeForGoogleProfile(code, redirectUri);

    let user = await prisma.user.findUnique({ where: { googleId: profile.googleId } });
    // True only when this call creates a brand-new User row - an existing
    // account (found by googleId or linked by matching email) never gets
    // funneled through the mandatory verify-phone step below, same as
    // signIn() never re-asks an existing password account.
    let isNewAccount = false;
    if (!user) {
      // Link to an existing password account with the same email if there is
      // one, rather than creating a second User row for the same person.
      const existingByEmail = await prisma.user.findUnique({ where: { email: profile.email } });
      if (existingByEmail) {
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { googleId: profile.googleId },
        });
      } else {
        user = await prisma.user.create({
          data: {
            email: profile.email,
            googleId: profile.googleId,
            fullName: profile.name,
            role: Role.client,
          },
        });
        isNewAccount = true;
      }
    }

    await createSession(user.id, user.role !== Role.client);
    if (user.role === Role.client) await reparentAnonymousSession(user.id);

    const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/my-quotes";
    // A brand-new client account isn't done signing up until its WhatsApp
    // number is verified - see app/verify-phone/page.tsx and the matching
    // step in LoginForm.tsx/AuthGate.tsx for the email/password signup path.
    if (isNewAccount) {
      return NextResponse.redirect(new URL(`/verify-phone?next=${encodeURIComponent(dest)}`, request.url));
    }
    return NextResponse.redirect(new URL(dest, request.url));
  } catch {
    return NextResponse.redirect(new URL("/login?error=google_auth_failed", request.url));
  }
}
