import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME, isAdminRole } from "@/lib/roles";
import AdminShell from "../AdminShell";
import NotificationsClient from "./NotificationsClient";
import "../../dashboard.css";

export default async function AdminNotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminRole(session.role)) redirect(ROLE_HOME[session.role]);

  const templates = await prisma.notificationTemplate.findMany({ orderBy: { key: "asc" } });

  return (
    <AdminShell active="notifications" isSuperAdmin={session.role === Role.super_admin}>
      <h1>Notifications</h1>
      <p className="sub">
        Every email and WhatsApp message the app sends, editable here - changes take effect immediately, and WhatsApp
        sends the moment a provider is connected (see lib/whatsapp.ts).
      </p>
      <NotificationsClient templates={templates} />
    </AdminShell>
  );
}
