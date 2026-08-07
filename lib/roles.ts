import { Role } from "@/app/generated/prisma/enums";

// Where each role lands after signing in, and where a role gets bounced back
// to if it tries to visit another role's area.
export const ROLE_HOME: Record<Role, string> = {
  client: "/build",
  captain: "/captain",
  contractor: "/contractor",
  admin: "/admin",
  super_admin: "/admin",
  designer: "/designer",
  marketing: "/admin/marketing",
};

// super_admin can do everything a regular admin can, plus manage admin
// accounts and see job applicants (see app/admin/team) - every admin-only
// gate (proxy.ts, admin/*/page.tsx, app/actions/*.ts) checks this instead of
// `role === Role.admin` directly, so the two roles never drift apart.
export const ADMIN_ROLES: Role[] = [Role.admin, Role.super_admin];
export function isAdminRole(role: Role): boolean {
  return ADMIN_ROLES.includes(role);
}
