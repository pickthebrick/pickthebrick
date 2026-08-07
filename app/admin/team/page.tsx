import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import AdminShell from "../AdminShell";
import TeamClient from "./TeamClient";
import "../../dashboard.css";

export default async function AdminTeamPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.super_admin) redirect(ROLE_HOME[session.role]);

  const admins = await prisma.user.findMany({
    where: { role: { in: [Role.admin, Role.super_admin, Role.marketing, Role.captain] } },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, fullName: true, role: true, createdAt: true },
  });

  return (
    <AdminShell active="team" isSuperAdmin>
      <h1>Team</h1>
      <p className="sub">Admin, marketing, and captain accounts. Only a super admin can add or remove accounts here.</p>
      <TeamClient admins={admins} currentUserId={session.id} />
    </AdminShell>
  );
}
