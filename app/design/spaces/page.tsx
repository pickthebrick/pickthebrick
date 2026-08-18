import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveActor, actorOwns } from "@/lib/actor";
import { DesignRequestStatus } from "@/app/generated/prisma/enums";
import { buttonSlot } from "@/lib/spaceLayers";
import SpacesSurvey from "./SpacesSurvey";

export default async function DesignSpacesPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const actor = await resolveActor();
  if (!id) redirect("/design");

  const request = await prisma.designRequest.findUnique({
    where: { id },
    include: { spaceEntries: { orderBy: { sortOrder: "asc" }, select: { spaceKey: true } } },
  });
  if (!request || !actorOwns(actor, request)) redirect("/design");
  if (request.status !== DesignRequestStatus.draft) redirect(`/design/features?id=${id}`);

  const initialQuantities: Record<string, number> = {};
  for (const entry of request.spaceEntries) {
    initialQuantities[entry.spaceKey] = (initialQuantities[entry.spaceKey] ?? 0) + 1;
  }

  const buttonImageRows = await prisma.spaceLayerImage.findMany({
    where: { slot: buttonSlot() },
    select: { spaceKey: true, imageUrl: true },
  });
  const buttonImages = Object.fromEntries(buttonImageRows.map((r) => [r.spaceKey, r.imageUrl]));

  return (
    <SpacesSurvey
      id={id}
      packageKey={request.packageKey}
      sqft={request.sqft}
      initialQuantities={initialQuantities}
      buttonImages={buttonImages}
    />
  );
}
