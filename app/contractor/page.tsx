import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import SignOutButton from "@/app/components/SignOutButton";
import BrandMark from "@/app/components/BrandMark";
import ContractorClient from "./ContractorClient";
import "../dashboard.css";

export default async function ContractorPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.contractor) redirect(ROLE_HOME[session.role]);

  const quotes = await prisma.quote.findMany({
    where: { contractorId: session.id },
    include: { items: true },
    orderBy: { confirmedAt: "desc" },
  });

  return (
    <div className="ptb-dash">
      <header>
        <BrandMark role="Contractor" />
        <SignOutButton className="signout" />
      </header>
      <main>
        <h1>My assigned jobs</h1>
        <p className="sub">Jobs a Captain has assigned to you (read-only for now).</p>
        <ContractorClient quotes={quotes} />
      </main>
    </div>
  );
}
