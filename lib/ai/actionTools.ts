import "server-only";
import { getAccessToken, searchGoogleAds } from "@/lib/googleAds";

// Tool functions the action-execution layer (lib/ai/actionExecutor.ts) maps
// a MarketingRecommendation's `type` onto. Reads hit the real Google Ads API
// (same auth/customer plumbing as lib/googleAds.ts's KPI reads). Writes are
// mocked - GOOGLE_ADS_MOCK_EXECUTION is the only supported value ("true")
// until real write execution is built as a follow-up. A mocked call never
// reaches Google's servers; it just fabricates a MOCK-* id after a short
// delay, so the UI/chat can exercise the full approve -> execute -> done
// pipeline safely before any real spend-affecting call goes live.

export type ToolResult = { success: boolean; externalId?: string; status?: string; error?: string; data?: unknown };

function mockEnabled(): boolean {
  return process.env.GOOGLE_ADS_MOCK_EXECUTION !== "false";
}

function mockId(prefix: string): string {
  return `MOCK-${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function mockDelay() {
  await new Promise((r) => setTimeout(r, 300));
}

// --- Reads: real, via the Google Ads REST search API ---

export async function getAccount(): Promise<ToolResult> {
  const rows = await searchGoogleAds(
    "SELECT customer.id, customer.descriptive_name, customer.currency_code FROM customer LIMIT 1",
  );
  if (!rows) return { success: false, error: "Google Ads not configured (missing token/credentials)." };
  return { success: true, data: rows[0] ?? null };
}

export async function getCampaigns(): Promise<ToolResult> {
  const rows = await searchGoogleAds(
    "SELECT campaign.id, campaign.name, campaign.status, metrics.clicks, metrics.impressions, metrics.cost_micros FROM campaign ORDER BY campaign.name",
  );
  if (!rows) return { success: false, error: "Google Ads not configured (missing token/credentials)." };
  return { success: true, data: rows };
}

export async function getCampaign(campaignId: string): Promise<ToolResult> {
  const rows = await searchGoogleAds(
    `SELECT campaign.id, campaign.name, campaign.status, metrics.clicks, metrics.impressions, metrics.cost_micros FROM campaign WHERE campaign.id = ${Number(campaignId)}`,
  );
  if (!rows) return { success: false, error: "Google Ads not configured (missing token/credentials)." };
  if (!rows.length) return { success: false, error: `No campaign found with id ${campaignId}.` };
  return { success: true, data: rows[0] };
}

export async function getPerformance(days = 30): Promise<ToolResult> {
  const dateFilter = days <= 7 ? "LAST_7_DAYS" : days <= 30 ? "LAST_30_DAYS" : "LAST_90_DAYS";
  const rows = await searchGoogleAds(
    `SELECT metrics.clicks, metrics.impressions, metrics.cost_micros, metrics.conversions FROM customer WHERE segments.date DURING ${dateFilter}`,
  );
  if (!rows) return { success: false, error: "Google Ads not configured (missing token/credentials)." };
  return { success: true, data: rows[0] ?? null };
}

export async function getAdGroups(campaignId: string): Promise<ToolResult> {
  const rows = await searchGoogleAds(
    `SELECT ad_group.id, ad_group.name, ad_group.status, metrics.clicks, metrics.impressions FROM ad_group WHERE campaign.id = ${Number(campaignId)}`,
  );
  if (!rows) return { success: false, error: "Google Ads not configured (missing token/credentials)." };
  return { success: true, data: rows };
}

export async function getKeywords(adGroupId: string): Promise<ToolResult> {
  const rows = await searchGoogleAds(
    `SELECT ad_group_criterion.criterion_id, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, metrics.clicks, metrics.cost_micros FROM keyword_view WHERE ad_group.id = ${Number(adGroupId)}`,
  );
  if (!rows) return { success: false, error: "Google Ads not configured (missing token/credentials)." };
  return { success: true, data: rows };
}

export async function getSearchTerms(campaignId: string): Promise<ToolResult> {
  const rows = await searchGoogleAds(
    `SELECT search_term_view.search_term, metrics.clicks, metrics.impressions, metrics.cost_micros FROM search_term_view WHERE campaign.id = ${Number(campaignId)} ORDER BY metrics.cost_micros DESC LIMIT 20`,
  );
  if (!rows) return { success: false, error: "Google Ads not configured (missing token/credentials)." };
  return { success: true, data: rows };
}

// --- Writes: mocked. Every one records mock:true on the caller's action row. ---

export async function createCampaign(payload: { name: string; budgetAed?: number }): Promise<ToolResult> {
  if (!mockEnabled()) return { success: false, error: "Real Google Ads write execution isn't built yet." };
  if (!(await getAccessToken())) return { success: false, error: "Google Ads not configured (missing token/credentials)." };
  await mockDelay();
  return { success: true, externalId: mockId("campaign"), status: "PAUSED", data: payload };
}

export async function createAdGroup(payload: { campaignId: string; name: string }): Promise<ToolResult> {
  if (!mockEnabled()) return { success: false, error: "Real Google Ads write execution isn't built yet." };
  await mockDelay();
  return { success: true, externalId: mockId("adgroup"), status: "PAUSED", data: payload };
}

export async function createAd(payload: { adGroupId: string; headlines: string[]; descriptions: string[] }): Promise<ToolResult> {
  if (!mockEnabled()) return { success: false, error: "Real Google Ads write execution isn't built yet." };
  await mockDelay();
  return { success: true, externalId: mockId("ad"), status: "PAUSED", data: payload };
}

export async function addKeywords(payload: { adGroupId: string; keywords: string[] }): Promise<ToolResult> {
  if (!mockEnabled()) return { success: false, error: "Real Google Ads write execution isn't built yet." };
  await mockDelay();
  return { success: true, externalId: mockId("keywords"), status: "ENABLED", data: payload };
}

export async function setBudget(payload: { campaignId: string; dailyBudgetAed: number }): Promise<ToolResult> {
  if (!mockEnabled()) return { success: false, error: "Real Google Ads write execution isn't built yet." };
  await mockDelay();
  return { success: true, externalId: payload.campaignId, status: "UPDATED", data: payload };
}

export async function pauseCampaign(payload: { campaignId: string }): Promise<ToolResult> {
  if (!mockEnabled()) return { success: false, error: "Real Google Ads write execution isn't built yet." };
  await mockDelay();
  return { success: true, externalId: payload.campaignId, status: "PAUSED", data: payload };
}

export async function enableCampaign(payload: { campaignId: string }): Promise<ToolResult> {
  if (!mockEnabled()) return { success: false, error: "Real Google Ads write execution isn't built yet." };
  await mockDelay();
  return { success: true, externalId: payload.campaignId, status: "ENABLED", data: payload };
}

// --- Meta/Instagram: mocked stubs for symmetry with the existing Meta Ads / ---
// --- Instagram permission rows - no real Meta Graph API integration yet.   ---

export async function createPost(payload: {
  platform: string;
  caption: string;
  hook?: string;
  visual?: string;
  cta?: string;
  imageUrl?: string | null;
}): Promise<ToolResult> {
  await mockDelay();
  return { success: true, externalId: mockId("post"), status: "DRAFT", data: payload };
}

export async function publishPost(payload: { postId: string }): Promise<ToolResult> {
  await mockDelay();
  return { success: true, externalId: payload.postId, status: "PUBLISHED", data: payload };
}

// Maps a MarketingRecommendation.type to its executing function - the single
// place actionExecutor.ts needs to look up "what does this action row do."
// Payload is `never` here (each function's real signature is typed above) -
// actionExecutor.ts parses a JSON blob it never itself constructs, so there's
// no static payload type to preserve past this lookup table; it casts its
// parsed payload at the one call site instead of widening this to `any`.
export const ACTION_TOOLS: Record<string, (payload: never) => Promise<ToolResult>> = {
  "google_ads.create_campaign": createCampaign,
  "google_ads.create_ad_group": createAdGroup,
  "google_ads.create_ad": createAd,
  "google_ads.add_keywords": addKeywords,
  "google_ads.set_budget": setBudget,
  "google_ads.pause_campaign": pauseCampaign,
  "google_ads.enable_campaign": enableCampaign,
  "meta.create_post": createPost,
  "meta.publish_post": publishPost,
};
