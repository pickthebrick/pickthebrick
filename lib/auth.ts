import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/enums";

const SESSION_COOKIE = "ptb_session";
const SESSION_DAYS = 30;

export type SessionUser = {
  id: string;
  email: string;
  // Effective role for this session, not necessarily the account's real
  // `User.role` - see effectiveRole() below. Every existing role-gating check
  // (proxy.ts, page.tsx redirects, requireAdmin()-style action guards) reads
  // this field, so the client/staff-login split needed no changes anywhere
  // else.
  role: Role;
  fullName: string | null;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// A staff-capable account (designer/contractor/marketing/captain/admin/
// super_admin) that signed in through the public /login form is treated as a
// plain client for the whole lifetime of that session - the same email and
// password only unlock the role's real dashboard when authenticated via the
// hidden /staff-login route. A `client` account behaves identically either
// way, since "client" is already its effective role. See Session.viaStaffLogin.
export function effectiveRole(realRole: Role, viaStaffLogin: boolean): Role {
  return viaStaffLogin ? realRole : Role.client;
}

export async function createSession(userId: string, viaStaffLogin: boolean) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const session = await prisma.session.create({ data: { userId, expiresAt, viaStaffLogin } });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    role: effectiveRole(session.user.role, session.viaStaffLogin),
    fullName: session.user.fullName,
  };
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
  }
  cookieStore.delete(SESSION_COOKIE);
}
