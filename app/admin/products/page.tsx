import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME, isAdminRole } from "@/lib/roles";
import { fetchCatalog } from "@/lib/catalog";
import AdminShell from "../AdminShell";
import ProductsClient from "./ProductsClient";
import "../../dashboard.css";

export default async function ProductsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminRole(session.role)) redirect(ROLE_HOME[session.role]);

  const catalog = await fetchCatalog();

  return (
    <AdminShell active="products" isSuperAdmin={session.role === Role.super_admin}>
      <ProductsClient catalog={catalog} />
    </AdminShell>
  );
}
