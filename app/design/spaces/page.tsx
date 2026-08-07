import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DesignRequestStatus } from "@/app/generated/prisma/enums";
import SpacesSurvey from "./SpacesSurvey";

export default async function DesignSpacesPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");
  if (!id) redirect("/design");

  const request = await prisma.designRequest.findUnique({
    where: { id },
    include: { spaceEntries: { select: { spaceKey: true } } },
  });
  if (!request || request.clientId !== session.id) redirect("/design");
  if (request.status !== DesignRequestStatus.draft) redirect(`/design/features?id=${id}`);

  const initialQuantities: Record<string, number> = {};
  for (const entry of request.spaceEntries) {
    initialQuantities[entry.spaceKey] = (initialQuantities[entry.spaceKey] ?? 0) + 1;
  }

  return <SpacesSurvey id={id} packageKey={request.packageKey} sqft={request.sqft} initialQuantities={initialQuantities} />;
}
