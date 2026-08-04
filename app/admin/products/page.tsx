import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import { fetchCatalog } from "@/lib/catalog";
import AdminShell from "../AdminShell";
import ProductsClient from "./ProductsClient";
import "../../dashboard.css";

export default async function ProductsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.admin) redirect(ROLE_HOME[session.role]);

  const catalog = await fetchCatalog();

  return (
    <AdminShell active="products">
      <ProductsClient catalog={catalog} />
    </AdminShell>
  );
}
