import "server-only";

// Real Google Ads campaign performance for the Marketing AI's "Google Ads"
// tab and channel context, replacing hardcoded sample numbers. Needs
// GOOGLE_ADS_DEVELOPER_TOKEN + GOOGLE_ADS_CLIENT_ID/SECRET/REFRESH_TOKEN
// (OAuth app authorized against husainqn@gmail.com, which owns the
// PickTheBrick Google Ads manager account) + GOOGLE_ADS_LOGIN_CUSTOMER_ID
// (the manager account) + GOOGLE_ADS_CUSTOMER_ID (the actual ads account,
// linked under the manager). Mirrors lib/ga4.ts: returns null rather than
// throwing whenever not configured or no spend has been recorded yet -
// callers render an honest empty state instead of fake numbers.

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API_VERSION = "v18";

async function getAccessToken(): Promise<string | null> {
  const client_id = process.env.GOOGLE_ADS_CLIENT_ID;
  const client_secret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const refresh_token = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  if (!client_id || !client_secret || !refresh_token) return null;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id, client_secret, refresh_token, grant_type: "refresh_token" }),
  });
  if (!res.ok) return null;
  const { access_token } = (await res.json()) as { access_token: string };
  return access_token;
}

type GoogleAdsRow = {
  campaign?: { id: string; name: string };
  metrics?: { clicks?: string; impressions?: string; costMicros?: string; conversions?: string };
};

async function searchGoogleAds(query: string): Promise<GoogleAdsRow[] | null> {
  const accessToken = await getAccessToken();
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  if (!accessToken || !developerToken || !loginCustomerId || !customerId) return null;

  const res = await fetch(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": developerToken,
      "login-customer-id": loginCustomerId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { results?: GoogleAdsRow[] };
  return data.results ?? [];
}

export type GoogleAdsKpi = { clicks: number; impressions: number; costAed: number; conversions: number };
export type GoogleAdsCampaign = { name: string; clicks: number; impressions: number; costAed: number; conversions: number };
export type GoogleAdsPerformance = { kpis: GoogleAdsKpi; topCampaigns: GoogleAdsCampaign[] };

export async function getGoogleAdsPerformance(days = 30): Promise<GoogleAdsPerformance | null> {
  const dateFilter = days <= 7 ? "LAST_7_DAYS" : days <= 30 ? "LAST_30_DAYS" : "LAST_90_DAYS";

  const [totalsRows, campaignRows] = await Promise.all([
    searchGoogleAds(
      `SELECT metrics.clicks, metrics.impressions, metrics.cost_micros, metrics.conversions FROM customer WHERE segments.date DURING ${dateFilter}`
    ),
    searchGoogleAds(
      `SELECT campaign.id, campaign.name, metrics.clicks, metrics.impressions, metrics.cost_micros, metrics.conversions FROM campaign WHERE segments.date DURING ${dateFilter} ORDER BY metrics.cost_micros DESC LIMIT 5`
    ),
  ]);
  if (!totalsRows) return null; // not configured

  const totals = totalsRows[0]?.metrics;
  const clicks = Number(totals?.clicks ?? 0);
  const impressions = Number(totals?.impressions ?? 0);
  if (clicks === 0 && impressions === 0) return null; // no spend recorded yet

  const kpis: GoogleAdsKpi = {
    clicks,
    impressions,
    costAed: Number(totals?.costMicros ?? 0) / 1_000_000,
    conversions: Number(totals?.conversions ?? 0),
  };

  const topCampaigns: GoogleAdsCampaign[] = (campaignRows ?? []).map((row) => ({
    name: row.campaign?.name ?? "(unknown)",
    clicks: Number(row.metrics?.clicks ?? 0),
    impressions: Number(row.metrics?.impressions ?? 0),
    costAed: Number(row.metrics?.costMicros ?? 0) / 1_000_000,
    conversions: Number(row.metrics?.conversions ?? 0),
  }));

  return { kpis, topCampaigns };
}
