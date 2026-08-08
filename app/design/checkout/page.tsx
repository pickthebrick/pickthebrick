import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveActor, actorOwns } from "@/lib/actor";
import { PACKAGE_LABELS } from "@/lib/spaces";
import CheckoutClient from "./CheckoutClient";

export default async function DesignCheckoutPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const actor = await resolveActor();
  if (!id) redirect("/design");

  const request = await prisma.designRequest.findUnique({
    where: { id },
    select: {
      clientId: true,
      anonymousSessionId: true,
      packageKey: true,
      packagePrice: true,
      siteVisitRequested: true,
      siteVisitFee: true,
      paymentMethod: true,
    },
  });
  if (!request || !actorOwns(actor, request)) redirect("/design");

  return (
    <CheckoutClient
      designRequestId={id}
      packageLabel={PACKAGE_LABELS[request.packageKey] ?? request.packageKey}
      packagePrice={request.packagePrice ?? 0}
      siteVisitRequested={request.siteVisitRequested}
      siteVisitFee={request.siteVisitFee}
      initialMethod={request.paymentMethod}
      isAnonymous={!("clientId" in actor)}
    />
  );
}
