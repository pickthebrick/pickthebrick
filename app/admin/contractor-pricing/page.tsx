import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import AdminShell from "../AdminShell";
import ContractorPricingClient from "./ContractorPricingClient";
import "../../dashboard.css";

export default async function AdminContractorPricingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.super_admin) redirect(ROLE_HOME[session.role]);

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, label: true, contractorReductionPercent: true },
  });

  return (
    <AdminShell active="contractorPricing" isSuperAdmin>
      <h1>Contractor pricing</h1>
      <p className="sub">
        What a contractor is paid is always less than what PickTheBrick sells for - that gap is the business&apos;s
        margin. Set the reduction per category here; it applies to open job values and payment claims a contractor
        sees. Default is 15% across every category.
      </p>
      <ContractorPricingClient categories={categories} />
    </AdminShell>
  );
}
