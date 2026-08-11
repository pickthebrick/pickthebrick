// Which permission (from lib/marketingState.ts's per-tool permissions,
// DEFAULT_PERMISSIONS in app/admin/brain/data.ts) executing a given
// MarketingRecommendation.type requires, and under which tool name. No
// "server-only" here (unlike lib/ai/actionTools.ts) - OverviewPanel.tsx
// needs this client-side to grey out the Execute button when the
// permission is off, without pulling in the real Google Ads API client.
export const ACTION_PERMISSIONS: Record<string, { tool: string; permission: string }> = {
  "google_ads.create_campaign": { tool: "Google Ads", permission: "Execute" },
  "google_ads.create_ad_group": { tool: "Google Ads", permission: "Execute" },
  "google_ads.create_ad": { tool: "Google Ads", permission: "Execute" },
  "google_ads.add_keywords": { tool: "Google Ads", permission: "Execute" },
  "google_ads.set_budget": { tool: "Google Ads", permission: "Execute" },
  "google_ads.pause_campaign": { tool: "Google Ads", permission: "Execute" },
  "google_ads.enable_campaign": { tool: "Google Ads", permission: "Execute" },
  "meta.create_post": { tool: "Meta Ads", permission: "Execute" },
  "meta.publish_post": { tool: "Instagram", permission: "Publish" },
};
