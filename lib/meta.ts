import "server-only";

// Real Meta (Facebook Page) data for the Marketing AI's Meta tab, read via
// a System User token for the "PTB Metabot" System User in the "Pick the
// Brick" Business Manager. Mirrors lib/googleAds.ts: returns null rather
// than throwing whenever not configured, so callers render an honest empty
// state instead of fake numbers.
//
// Scope note: this only covers organic Page metadata (name, followers) -
// the ad-spend metrics shown elsewhere in the Meta tab (Spend, CPM, CTR,
// Leads, CPL) come from the separate Meta Marketing API, which isn't wired
// up yet. Page-level content/insights (posts, likes, comments) need Meta's
// "Page Public Content Access" App Review approval, and classic Page
// Insights metrics (page_impressions, page_fans, etc.) were deprecated by
// Meta in 2023 and no longer work at all - real access is capped at basic
// Page fields until that review is done.
const API_VERSION = "v21.0";

export type MetaPageInfo = {
  name: string;
  followers: number;
};

export async function getMetaPageInfo(): Promise<MetaPageInfo | null> {
  const token = process.env.META_SYSTEM_USER_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  if (!token || !pageId) return null;

  const res = await fetch(
    `https://graph.facebook.com/${API_VERSION}/${pageId}?fields=name,followers_count&access_token=${token}`
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { name?: string; followers_count?: number };
  if (typeof data.followers_count !== "number") return null;

  return { name: data.name ?? "Pick the Brick", followers: data.followers_count };
}

export type InstagramAccountInfo = {
  id: string;
  username: string;
  followers: number;
  mediaCount: number;
  profilePictureUrl?: string;
};

// The System User token already carries instagram_basic + instagram_manage_
// insights (confirmed via /debug_token), so this works the moment an
// Instagram account is actually linked to the Page in Meta Business Suite
// (Settings -> Accounts -> Instagram accounts -> Connect account) - until
// then the Page simply has no instagram_business_account connection and
// this correctly returns null, same graceful-fallback contract as
// getMetaPageInfo. Posting/publishing (lib/ai/actionTools.ts's createPost/
// publishPost) is separately blocked either way - the token doesn't have
// instagram_content_publish yet, which needs to be granted in Meta Business
// Suite's System User token settings.
export async function getInstagramAccountInfo(): Promise<InstagramAccountInfo | null> {
  const token = process.env.META_SYSTEM_USER_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  if (!token || !pageId) return null;

  const params = new URLSearchParams({
    fields: "instagram_business_account{id,username,followers_count,media_count,profile_picture_url}",
    access_token: token,
  });
  const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${pageId}?${params}`);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    instagram_business_account?: {
      id: string;
      username?: string;
      followers_count?: number;
      media_count?: number;
      profile_picture_url?: string;
    };
  };
  const ig = data.instagram_business_account;
  if (!ig) return null;

  return {
    id: ig.id,
    username: ig.username ?? "",
    followers: ig.followers_count ?? 0,
    mediaCount: ig.media_count ?? 0,
    profilePictureUrl: ig.profile_picture_url,
  };
}
