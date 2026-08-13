import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_HOME } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/enums";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      email: true,
      fullName: true,
      company: true,
      phone: true,
      whatsappNumber: true,
      whatsappVerifiedAt: true,
      passwordHash: true,
      googleId: true,
      role: true,
      logoUrl: true,
    },
  });
  if (!user) redirect("/login");

  // The real account role (not the session's viaStaffLogin-adjusted
  // effectiveRole) - a client-mode staff session should still see their real
  // role's info here, same reasoning as ROLE_HOME below.
  const dashboardHref = session.role === Role.client ? "/my-quotes" : ROLE_HOME[session.role];

  return (
    <ProfileClient
      email={user.email}
      fullName={user.fullName}
      company={user.company}
      phone={user.phone}
      whatsappNumber={user.whatsappNumber}
      whatsappVerifiedAt={user.whatsappVerifiedAt}
      hasPassword={!!user.passwordHash}
      hasGoogle={!!user.googleId}
      role={user.role}
      dashboardHref={dashboardHref}
      logoUrl={user.logoUrl}
    />
  );
}
