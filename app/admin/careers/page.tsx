import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME, isAdminRole } from "@/lib/roles";
import AdminShell from "../AdminShell";
import CareersClient from "./CareersClient";
import "../../dashboard.css";

export default async function AdminCareersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminRole(session.role)) redirect(ROLE_HOME[session.role]);

  const postings = await prisma.jobPosting.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <AdminShell active="careers" isSuperAdmin={session.role === Role.super_admin}>
      <h1>Careers</h1>
      <p className="sub">Vacancies shown publicly on /careers. Turn a posting off to hide it without deleting it.</p>
      <CareersClient postings={postings} />
    </AdminShell>
  );
}
