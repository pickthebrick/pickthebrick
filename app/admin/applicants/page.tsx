import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import AdminShell from "../AdminShell";
import ApplicantsClient from "./ApplicantsClient";
import "../../dashboard.css";

export default async function AdminApplicantsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.super_admin) redirect(ROLE_HOME[session.role]);

  const applications = await prisma.jobApplication.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell active="applicants" isSuperAdmin>
      <h1>Applicants</h1>
      <p className="sub">Every careers application submitted from the public /careers page, newest first.</p>
      <ApplicantsClient applications={applications} />
    </AdminShell>
  );
}
