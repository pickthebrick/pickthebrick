import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getAnonSessionId } from "@/lib/anonSession";
import { DesignRequestStatus } from "@/app/generated/prisma/enums";
import DesignPageClient from "./DesignPageClient";

export default async function DesignPage() {
  const session = await getSession();
  // Read-only actor lookup for the AI Designer banner's deep-link (see
  // DesignPageClient) - deliberately does NOT create an anon session cookie
  // here (that requires a Server Action/Route Handler, not a page render);
  // a first-time anonymous visitor has no existing request anyway, so this
  // just resolves to null for them and the banner falls back to starting
  // the normal flow.
  const actorWhere = session ? { clientId: session.id } : null;
  const anonId = session ? null : await getAnonSessionId();

  const [banner, categories, featureItems, continueRequest] = await Promise.all([
    prisma.aiDesignerBanner.upsert({
      where: { id: "ai-designer-banner" },
      create: { id: "ai-designer-banner" },
      update: {},
    }),
    prisma.category.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" }, select: { key: true, label: true } }),
    prisma.packageFeatureItem.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, label: true, description: true, minTier: true, sampleImageUrl: true },
    }),
    actorWhere || anonId
      ? prisma.designRequest.findFirst({
          where: {
            ...(actorWhere ?? { anonymousSessionId: anonId }),
            status: { in: [DesignRequestStatus.draft, DesignRequestStatus.submitted] },
          },
          orderBy: { createdAt: "desc" },
          select: { id: true, status: true },
        })
      : null,
  ]);

  return (
    <DesignPageClient
      banner={banner}
      categories={categories}
      featureItems={featureItems}
      isAnonymous={!session}
      continueRequest={continueRequest}
    />
  );
}
