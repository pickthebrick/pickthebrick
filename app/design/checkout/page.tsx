import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PACKAGE_LABELS } from "@/lib/spaces";
import CheckoutClient from "./CheckoutClient";

export default async function DesignCheckoutPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");
  if (!id) redirect("/design");

  const request = await prisma.designRequest.findUnique({
    where: { id },
    select: {
      clientId: true,
      packageKey: true,
      packagePrice: true,
      siteVisitRequested: true,
      siteVisitFee: true,
      paymentMethod: true,
    },
  });
  if (!request || request.clientId !== session.id) redirect("/design");

  return (
    <CheckoutClient
      designRequestId={id}
      packageLabel={PACKAGE_LABELS[request.packageKey] ?? request.packageKey}
      packagePrice={request.packagePrice ?? 0}
      siteVisitRequested={request.siteVisitRequested}
      siteVisitFee={request.siteVisitFee}
      initialMethod={request.paymentMethod}
    />
  );
}
