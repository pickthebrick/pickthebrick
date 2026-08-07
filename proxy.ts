import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ROLE_HOME } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/enums";

const SESSION_COOKIE = "ptb_session";

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

// The only page viewable with no session at all - Design and Build both
// require login, but only once the visitor actually heads into one of those
// flows from here (see the ?next= handling below), not before. Redirects
// any other signed-in role away, same as every other client-only area.
const PUBLIC_ROUTES = ["/"];
// Pure marketing pages (ad/social landing targets, see app/landing/[category])
// - viewable by literally anyone regardless of role or session, no redirect.
// Only the "Add to cart" links off these pages funnel into the normal
// client-only /build login wall.
const PUBLIC_NO_REDIRECT_PREFIXES = ["/landing/", "/ask-ai", "/careers"];

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
    // Send the visitor to log in, then straight back to whatever they were
    // trying to reach (Design or Build) instead of a generic role home.
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
