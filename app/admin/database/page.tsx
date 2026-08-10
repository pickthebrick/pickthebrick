import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME, isAdminRole } from "@/lib/roles";
import AdminShell from "../AdminShell";
import AdminDatabaseClient from "./AdminDatabaseClient";
import "../../dashboard.css";

export default async function AdminDatabasePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminRole(session.role)) redirect(ROLE_HOME[session.role]);

  const [clients, captains, contractors, designers, marketers] = await Promise.all([
    prisma.user.findMany({
      where: { role: Role.client },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        whatsappNumber: true,
        company: true,
        createdAt: true,
        _count: { select: { quotesAsClient: true, designRequestsAsClient: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: Role.captain },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        whatsappNumber: true,
        createdAt: true,
        _count: { select: { quotesAsCaptain: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: Role.contractor },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        whatsappNumber: true,
        createdAt: true,
        contractorApplication: {
          select: {
            status: true,
            companyName: true,
            officeLocation: true,
            categories: { select: { category: { select: { id: true, label: true } } } },
            types: { select: { type: { select: { categoryId: true, label: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: Role.designer },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        whatsappNumber: true,
        createdAt: true,
        _count: { select: { designRequestsAsDesigner: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: Role.marketing },
      select: { id: true, fullName: true, email: true, phone: true, whatsappNumber: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <AdminShell active="database" isSuperAdmin={session.role === Role.super_admin}>
      <h1>Database</h1>
      <p className="sub">Every account across every role, searchable and exportable, with WhatsApp numbers.</p>
      <AdminDatabaseClient
        clients={clients}
        captains={captains}
        contractors={contractors.map((c) => ({
          id: c.id,
          fullName: c.fullName,
          email: c.email,
          phone: c.phone,
          whatsappNumber: c.whatsappNumber,
          createdAt: c.createdAt,
          status: c.contractorApplication?.status ?? null,
          companyName: c.contractorApplication?.companyName ?? null,
          officeLocation: c.contractorApplication?.officeLocation ?? null,
          categories:
            c.contractorApplication?.categories.map((cat) => ({
              label: cat.category.label,
              types:
                c.contractorApplication?.types
                  .filter((t) => t.type.categoryId === cat.category.id)
                  .map((t) => t.type.label) ?? [],
            })) ?? [],
        }))}
        designers={designers}
        marketers={marketers}
        isSuperAdmin={session.role === Role.super_admin}
      />
    </AdminShell>
  );
}
