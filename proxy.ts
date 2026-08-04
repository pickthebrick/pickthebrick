import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ROLE_HOME } from "@/lib/roles";
import type { Role } from "@/app/generated/prisma/enums";

const SESSION_COOKIE = "ptb_session";

const ROLE_AREAS: Record<Role, string[]> = {
  client: ["build", "my-quotes"],
  captain: ["captain"],
  contractor: ["contractor"],
  admin: ["admin"],
  designer: ["designer"],
};

// The only page viewable with no session at all - Design and Build both
// require login, but only once the visitor actually heads into one of those
// flows from here (see the ?next= handling below), not before.
const PUBLIC_ROUTES = ["/"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAuthRoute = pathname.startsWith("/login");
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  const session = sessionId
    ? await prisma.session.findUnique({ where: { id: sessionId }, include: { user: true } })
    : null;
  const validSession = session && session.expiresAt > new Date() ? session : null;

  if (!validSession) {
    if (isAuthRoute || isPublicRoute) return NextResponse.next();
    // Send the visitor to log in, then straight back to whatever they were
    // trying to reach (Design or Build) instead of a generic role home.
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  const role = validSession.user.role;

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

  if (isPublicRoute) return NextResponse.next();

  const areaMatch = pathname.match(/^\/(build|my-quotes|captain|contractor|admin|designer)(\/|$)/);
  if (areaMatch && !ROLE_AREAS[role].includes(areaMatch[1])) {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[role];
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
