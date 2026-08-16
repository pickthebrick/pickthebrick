import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveActor, actorOwns } from "@/lib/actor";
import { DesignRequestStatus } from "@/app/generated/prisma/enums";
import DrawBoardClient from "./DrawBoardClient";

// Opened in its own browser tab from the Handover step's "Generate a
// starting layout" card (see HandoverClient.tsx) - the client can spend a
// while on the drawing board without losing their place in the main flow.
export default async function DrawBoardPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const actor = await resolveActor();
  if (!id) redirect("/design");

  const request = await prisma.designRequest.findUnique({
    where: { id },
    select: { clientId: true, anonymousSessionId: true, status: true },
  });
  if (!request || !actorOwns(actor, request)) redirect("/design");
  if (request.status !== DesignRequestStatus.submitted) redirect("clientId" in actor ? "/my-quotes" : "/");

  return <DrawBoardClient designRequestId={id} />;
}
