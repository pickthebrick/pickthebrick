import type { Role } from "@/app/generated/prisma/enums";

// Where each role lands after signing in, and where a role gets bounced back
// to if it tries to visit another role's area.
export const ROLE_HOME: Record<Role, string> = {
  client: "/build",
  captain: "/captain",
  contractor: "/contractor",
  admin: "/admin",
  designer: "/designer",
};
