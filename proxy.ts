import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ROLE_HOME } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/enums";

const SESSION_COOKIE = "ptb_session";
// Duplicated from lib/anonSession.ts (which is server-only, same reasoning
// as SESSION_COOKIE above) - minted here rather than lazily inside a Server
// Action, since Next.js only allows cookies().set() from a real Server
// Action/Route Handler, not from a Server Component's render, and
// getOrCreateDraftQuote()/startDesignRequest() are called directly from
// page.tsx renders. Middleware is the one place that can both set the
// cookie for future requests AND make it visible to *this* request's render
// (by rewriting the forwarded request's Cookie header below).
const ANON_COOKIE = "ptb_anon";
const ANON_DAYS = 180;

const ROLE_AREAS: Record<Role, string[]> = {
  client: ["build", "my-quotes"],
  captain: ["captain"],
  contractor: ["contractor"],
  admin: ["admin"],
  super_admin: ["admin"],
  designer: ["designer"],
  // Passes the area-level check below; narrowed to /admin/marketing only
  // by the marketing-specific gate further down.
  marketing: ["admin"],
};

// Viewable with no session at all, redirecting any other signed-in role
// away to their own dashboard (same as every other client-only area).
const PUBLIC_ROUTES = ["/"];
// Pure marketing pages (ad/social landing targets, see app/landing/[category])
// - viewable by literally anyone regardless of role or session, no redirect,
// and no further role checks ever apply to them. /api is here too - Route
// Handlers under app/api/** have no browser session to redirect (they're
// hit by scripts/webhooks, e.g. app/api/admin/products/import), so each one
// enforces its own auth (API key, etc.) instead of relying on this gate.
const PUBLIC_NO_REDIRECT_PREFIXES = [
  "/landing/",
  "/ask-ai",
  "/careers",
  "/api/",
  "/forgot-password",
  "/reset-password",
  "/sitemap.xml",
  "/robots.txt",
];
// Build and Design used to force login before a visitor could even start;
// now both work fully anonymously (see lib/anonSession.ts / lib/actor.ts)
// and only ask for contact info at the end of the flow. Unlike the prefixes
// above, this only skips the *login redirect* below - once a session does
// exist, the normal ROLE_AREAS check further down still applies as before,
// so a signed-in non-client role hitting bare /build still bounces to their
// own dashboard, and the captain ?editQuote= exception is unaffected.
// Matched exactly/by "/" boundary (not a bare startsWith) so this can never
// accidentally swallow /designer, the unrelated staff dashboard route.
const ANONYMOUS_OK_PREFIXES = ["/build", "/design"];
function isAnonymousOkRoute(pathname: string) {
  return ANONYMOUS_OK_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

// Ensures ptb_anon is set - both on the outgoing response (so the browser
// carries it on future requests) and, if it didn't already exist, on the
// forwarded request's Cookie header too, so the Server Component rendering
// *this* request already sees it via cookies() instead of getting nothing
// on the very first anonymous visit.
function withAnonSessionCookie(request: NextRequest) {
  const existing = request.cookies.get(ANON_COOKIE)?.value;
  if (existing) return NextResponse.next();

  const anonId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  const existingCookieHeader = requestHeaders.get("cookie");
  requestHeaders.set(
    "cookie",
    existingCookieHeader ? `${existingCookieHeader}; ${ANON_COOKIE}=${anonId}` : `${ANON_COOKIE}=${anonId}`,
  );

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.cookies.set(ANON_COOKIE, anonId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ANON_DAYS * 24 * 60 * 60,
  });
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/staff-login");
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isPublicNoRedirect = PUBLIC_NO_REDIRECT_PREFIXES.some((p) => pathname.startsWith(p));

  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  const session = sessionId
    ? await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          user: {
            include: {
              contractorApplication: { select: { status: true } },
              designerApplication: { select: { status: true } },
            },
          },
        },
      })
    : null;
  const validSession = session && session.expiresAt > new Date() ? session : null;

  if (!validSession) {
    if (isAuthRoute || isPublicRoute || isPublicNoRedirect) return NextResponse.next();
    if (isAnonymousOkRoute(pathname)) return withAnonSessionCookie(request);
    // Send the visitor to log in, then straight back to whatever they were
    // trying to reach instead of a generic role home.
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  // A staff-capable account that signed in via the public /login form is
  // just a client for this session - the same credentials only unlock its
  // real dashboard through /staff-login. See Session.viaStaffLogin and
  // lib/auth.ts's effectiveRole() (duplicated here rather than imported,
  // since lib/auth.ts is "server-only" and proxy.ts already inlines its own
  // session lookup instead of calling getSession()).
  const role: Role = validSession.viaStaffLogin ? validSession.user.role : Role.client;

  if (isAuthRoute) {
    const next = request.nextUrl.searchParams.get("next");
    const url = request.nextUrl.clone();
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      const [nextPath, nextQuery] = next.split("?");
      url.pathname = nextPath;
      url.search = nextQuery ? `?${nextQuery}` : "";
    } else {
      url.pathname = ROLE_HOME[role];
      url.search = "";
    }
    return NextResponse.redirect(url);
  }

  if (isPublicNoRedirect) return NextResponse.next();

  if (isPublicRoute) {
    // "/" is the client's Design/Build chooser - every other signed-in role
    // has its own dashboard and never needs to see it.
    if (role !== "client") {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_HOME[role];
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Narrow exception: a Captain may reach /build, but only when editing a
  // specific client quote on their behalf (see CaptainClient.tsx's "Edit
  // client's quote" link and app/build/page.tsx's editQuote handling) -
  // never the bare /build the client-only area check below still blocks.
  const isCaptainEditingQuote =
    role === "captain" && pathname === "/build" && request.nextUrl.searchParams.has("editQuote");

  const areaMatch = pathname.match(/^\/(build|my-quotes|captain|contractor|admin|designer)(\/|$)/);
  if (areaMatch && !isCaptainEditingQuote && !ROLE_AREAS[role].includes(areaMatch[1])) {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[role];
    return NextResponse.redirect(url);
  }

  // Marketing is scoped to the banners screen only - not the rest of admin.
  if (role === "marketing" && !pathname.startsWith("/admin/marketing")) {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[role];
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Contractors can't reach their dashboard until an admin approves their
  // partner application - everything under /contractor bounces to the
  // application page until then.
  if (
    role === "contractor" &&
    pathname.startsWith("/contractor") &&
    !pathname.startsWith("/contractor/apply") &&
    validSession.user.contractorApplication?.status !== "approved"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/contractor/apply";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Same gate as contractors above, for designers.
  if (
    role === "designer" &&
    pathname.startsWith("/designer") &&
    !pathname.startsWith("/designer/apply") &&
    validSession.user.designerApplication?.status !== "approved"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/designer/apply";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
