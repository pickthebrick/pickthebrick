import "server-only";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

// Real Google Analytics 4 data for the Website & Analytics tab and the
// Marketing AI's website-channel context, replacing the WEBSITE_KPIS/
// TOP_PAGES sample arrays that used to live in app/admin/brain/data.ts.
// Needs GA4_PROPERTY_ID + GA4_CLIENT_EMAIL + GA4_PRIVATE_KEY (a GCP service
// account with Viewer access on the GA4 property - see
// scripts/imports/... precedent for the general "one-off setup, document it"
// pattern this follows). Returns null rather than throwing whenever GA4
// isn't configured or the property has no data yet (a brand-new property
// can take up to 48h to start collecting) - callers render an honest empty
// state instead of fake numbers.

function getClient(): BetaAnalyticsDataClient | null {
  const client_email = process.env.GA4_CLIENT_EMAIL;
  const rawKey = process.env.GA4_PRIVATE_KEY;
  if (!client_email || !rawKey) return null;
  const private_key = rawKey.replace(/^"|"$/g, "").replace(/\\n/g, "\n");
  return new BetaAnalyticsDataClient({ credentials: { client_email, private_key } });
}

export type WebsiteKpi = { sessions: number; totalUsers: number; bounceRate: number; keyEvents: number };
export type TopPage = { page: string; sessions: number; bounceRate: number };
export type WebsiteAnalytics = { kpis: WebsiteKpi; topPages: TopPage[] };

export async function getWebsiteAnalytics(days = 30): Promise<WebsiteAnalytics | null> {
  const client = getClient();
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!client || !propertyId) return null;
  const property = `properties/${propertyId}`;
  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: "today" }];

  const [[kpiResponse], [pagesResponse]] = await Promise.all([
    client.runReport({
      property,
      dateRanges,
      metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "bounceRate" }, { name: "keyEvents" }],
    }),
    client.runReport({
      property,
      dateRanges,
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "sessions" }, { name: "bounceRate" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 5,
    }),
  ]);

  const kpiRow = kpiResponse.rows?.[0];
  const sessions = Number(kpiRow?.metricValues?.[0]?.value ?? 0);
  if (!kpiRow || sessions === 0) return null; // no traffic recorded yet

  const kpis: WebsiteKpi = {
    sessions,
    totalUsers: Number(kpiRow.metricValues?.[1]?.value ?? 0),
    bounceRate: Number(kpiRow.metricValues?.[2]?.value ?? 0),
    keyEvents: Number(kpiRow.metricValues?.[3]?.value ?? 0),
  };

  const topPages: TopPage[] = (pagesResponse.rows ?? []).map((row) => ({
    page: row.dimensionValues?.[0]?.value ?? "(unknown)",
    sessions: Number(row.metricValues?.[0]?.value ?? 0),
    bounceRate: Number(row.metricValues?.[1]?.value ?? 0),
  }));

  return { kpis, topPages };
}
