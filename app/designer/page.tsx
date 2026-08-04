import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role, DesignRequestStatus } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import SignOutButton from "@/app/components/SignOutButton";
import BrandMark from "@/app/components/BrandMark";
import DesignerClient from "./DesignerClient";
import "../dashboard.css";

export default async function DesignerPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.designer) redirect(ROLE_HOME[session.role]);

  const requests = await prisma.designRequest.findMany({
    where: {
      OR: [
        { status: DesignRequestStatus.submitted },
        { status: DesignRequestStatus.in_progress, designerId: session.id },
      ],
    },
    select: {
      id: true,
      packageKey: true,
      sqft: true,
      spaces: true,
      status: true,
      submittedAt: true,
      client: { select: { fullName: true, email: true, company: true } },
      files: { orderBy: { sortOrder: "asc" }, select: { id: true, label: true, filePath: true } },
    },
    orderBy: { submittedAt: "asc" },
  });

  return (
    <div className="ptb-dash">
      <header>
        <BrandMark role="Designer" />
        <SignOutButton className="signout" />
      </header>
      <main>
        <h1>Design requests</h1>
        <p className="sub">Claim new requests and deliver design submittals to clients.</p>
        <DesignerClient requests={requests} />
      </main>
    </div>
  );
}
