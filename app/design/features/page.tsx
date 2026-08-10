import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { resolveActor, actorOwns } from "@/lib/actor";
import { DesignRequestStatus } from "@/app/generated/prisma/enums";
import { PACKAGE_LABELS, labelSpaceInstances } from "@/lib/spaces";
import DesignStepper from "../DesignStepper";
import FeaturesWizard from "./FeaturesWizard";
import "../../marketing.css";

export default async function DesignFeaturesPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const actor = await resolveActor();
  if (!id) redirect("/design");

  const request = await prisma.designRequest.findUnique({
    where: { id },
    select: {
      clientId: true,
      anonymousSessionId: true,
      status: true,
      packageKey: true,
      sqft: true,
      spaceEntries: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, spaceKey: true, notes: true, answers: { select: { questionKey: true, value: true } } },
      },
    },
  });
  if (!request || !actorOwns(actor, request)) redirect("/design");
  if (request.spaceEntries.length === 0) redirect(`/design/spaces?id=${id}`);

  const clientPhoneRow =
    "clientId" in actor
      ? await prisma.user.findUnique({
          where: { id: actor.clientId },
          select: { whatsappVerifiedAt: true, whatsappSkippedAt: true, phone: true, whatsappNumber: true },
        })
      : null;
  const hasVerifiedWhatsapp = "clientId" in actor ? Boolean(clientPhoneRow?.whatsappVerifiedAt) : true;
  const hasSkippedWhatsapp = "clientId" in actor ? Boolean(clientPhoneRow?.whatsappSkippedAt) : true;
  const initialPhone = clientPhoneRow?.whatsappNumber ?? clientPhoneRow?.phone ?? undefined;

  if (request.status !== DesignRequestStatus.draft) {
    return (
      <div className="ptb-marketing">
        <header>
          <Link href="/" className="brand-mark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="PickTheBrick" />
          </Link>
          <nav>
            <Link href="/">Home</Link>
            <Link href="/design">Design</Link>
          </nav>
        </header>
        <main>
          <DesignStepper current={3} />
          <div className="hero">
            <span className="hero-eyebrow">Features</span>
            <h1>Request submitted</h1>
            <p>Your designer has this on their queue - you can track progress from your dashboard.</p>
          </div>
          <div className="sqft-input-card" style={{ textAlign: "center" }}>
            <p>
              {PACKAGE_LABELS[request.packageKey] ?? request.packageKey} package &middot;{" "}
              {Number(request.sqft).toLocaleString()} sqft
            </p>
          </div>
          <div className="design-summary" style={{ justifyContent: "center" }}>
            <Link href={`/design/handover?id=${id}`} className="design-start-btn">
              Continue →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const instances = labelSpaceInstances(request.spaceEntries).map((e) => ({
    id: e.id,
    spaceKey: e.spaceKey,
    label: e.label,
    notes: e.notes ?? "",
    answers: Object.fromEntries(e.answers.map((a) => [a.questionKey, a.value])),
  }));

  const spaceKeys = [...new Set(instances.map((i) => i.spaceKey))];
  const layerRows = await prisma.spaceLayerImage.findMany({
    where: { spaceKey: { in: spaceKeys } },
    select: { spaceKey: true, slot: true, imageUrl: true },
  });
  const layerImages: Record<string, Record<string, string>> = {};
  for (const row of layerRows) {
    (layerImages[row.spaceKey] ??= {})[row.slot] = row.imageUrl;
  }

  return (
    <FeaturesWizard
      designRequestId={id}
      instances={instances}
      isAnonymous={!("clientId" in actor)}
      hasVerifiedWhatsapp={hasVerifiedWhatsapp}
      hasSkippedWhatsapp={hasSkippedWhatsapp}
      initialPhone={initialPhone}
      layerImages={layerImages}
    />
  );
}
