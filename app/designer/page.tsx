import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role, DesignRequestStatus } from "@/app/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/roles";
import DesignerShell from "./DesignerShell";
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
        { status: DesignRequestStatus.delivered, designerId: session.id },
      ],
    },
    select: {
      id: true,
      packageKey: true,
      sqft: true,
      status: true,
      submittedAt: true,
      claimDeadline: true,
      siteVisitRequested: true,
      revisionsUsed: true,
      lastRevisionAt: true,
      client: { select: { fullName: true, email: true, company: true } },
      files: { orderBy: { sortOrder: "asc" }, select: { id: true, label: true, filePath: true, createdAt: true } },
      spaceEntries: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, spaceKey: true, notes: true, answers: { select: { questionKey: true, value: true } } },
      },
      revisionComments: {
        orderBy: { createdAt: "asc" },
        select: { id: true, authorRole: true, body: true, channel: true, createdAt: true },
      },
    },
    orderBy: { submittedAt: "asc" },
  });

  return (
    <DesignerShell active="requests">
      <h1>Design requests</h1>
      <p className="sub">Claim new requests and deliver design submittals to clients.</p>
      <DesignerClient requests={requests} />
    </DesignerShell>
  );
}
