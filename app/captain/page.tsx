import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { QuoteStatus, Role } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import SignOutButton from "@/app/components/SignOutButton";
import BrandMark from "@/app/components/BrandMark";
import CaptainClient from "./CaptainClient";
import "../dashboard.css";

export default async function CaptainPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.captain) redirect(ROLE_HOME[session.role]);

  const [quotes, contractors] = await Promise.all([
    prisma.quote.findMany({
      where: { status: QuoteStatus.submitted },
      include: { items: true },
      orderBy: { submittedAt: "asc" },
    }),
    prisma.user.findMany({ where: { role: Role.contractor } }),
  ]);

  return (
    <div className="ptb-dash">
      <header>
        <BrandMark role="Captain" />
        <SignOutButton className="signout" />
      </header>
      <main>
        <h1>Submitted quotes</h1>
        <p className="sub">Confirm a quote and assign a contractor to move it forward.</p>
        <CaptainClient quotes={quotes} contractors={contractors} />
      </main>
    </div>
  );
}
