import type { MetadataRoute } from "next";
import { getAllLandingUrlParts } from "@/lib/landingCatalog";

const SITE_URL = "https://www.pickthebrick.com";

// Every category/type/style SEO landing page, generated from the live
// catalog (see lib/landingCatalog.ts) so new categories/types/subtypes are
// picked up automatically rather than needing this list kept in sync by
// hand. Static top-level pages are listed alongside them.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const parts = await getAllLandingUrlParts();

  const landingUrls: MetadataRoute.Sitemap = parts.map(({ category, type, subtype }) => {
    const path = subtype ? `/landing/${category}/${type}/${subtype}` : type ? `/landing/${category}/${type}` : `/landing/${category}`;
    return {
      url: `${SITE_URL}${path}`,
      changeFrequency: "weekly",
      priority: subtype ? 0.6 : type ? 0.7 : 0.8,
    };
  });

  const staticUrls: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/design`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/build`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/ask-ai`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/careers`, changeFrequency: "monthly", priority: 0.3 },
  ];

  return [...staticUrls, ...landingUrls];
}
