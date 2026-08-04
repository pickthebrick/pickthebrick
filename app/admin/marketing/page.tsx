import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import AdminShell from "../AdminShell";
import MarketingClient from "./MarketingClient";
import "../../dashboard.css";

export default async function MarketingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.admin) redirect(ROLE_HOME[session.role]);

  const banners = await prisma.banner.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <AdminShell active="marketing">
      <h1>Marketing banners</h1>
      <p className="sub">Manage the promotional banners shown to clients on the build page.</p>
      <MarketingClient banners={banners} />
    </AdminShell>
  );
}
