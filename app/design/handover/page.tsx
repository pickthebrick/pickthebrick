import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveActor, actorOwns } from "@/lib/actor";
import { DesignRequestStatus } from "@/app/generated/prisma/enums";
import HandoverClient from "./HandoverClient";

const CLIENT_UPLOAD_PREFIX = "Client layout upload:";

export default async function DesignHandoverPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const actor = await resolveActor();
  if (!id) redirect("/design");

  const request = await prisma.designRequest.findUnique({
    where: { id },
    select: {
      clientId: true,
      anonymousSessionId: true,
      status: true,
      siteVisitRequested: true,
      siteVisitPreferredDate: true,
      files: { select: { id: true, label: true, filePath: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!request || !actorOwns(actor, request)) redirect("/design");
  if (request.status !== DesignRequestStatus.submitted) redirect("clientId" in actor ? "/my-quotes" : "/");

  const layoutFiles = request.files
    .filter((f) => f.label.startsWith(CLIENT_UPLOAD_PREFIX))
    .map((f) => ({ id: f.id, label: f.label.replace(`${CLIENT_UPLOAD_PREFIX} `, ""), filePath: f.filePath }));

  return (
    <HandoverClient
      designRequestId={id}
      layoutFiles={layoutFiles}
      siteVisitRequested={request.siteVisitRequested}
      siteVisitPreferredDate={request.siteVisitPreferredDate ? request.siteVisitPreferredDate.toISOString().slice(0, 10) : null}
    />
  );
}
