"use client";

import { useEffect, useState } from "react";
import { getGoogleAdsPerformanceAction } from "@/app/actions/marketingAi";
import type { GoogleAdsPerformance } from "@/lib/googleAds";
import { KpiGrid, DataTable } from "../ui";
import ChannelInsights from "./ChannelInsights";

function fmtAed(n: number) {
  return `AED ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

// Real Google Ads numbers (last 30 days) - replaces the GOOGLE_KPIS/
// GOOGLE_CAMPAIGNS sample arrays that used to live in ../../data.ts.
// `performance` is null both while loading and, indistinguishably, once the
// account has genuinely recorded zero clicks/impressions (no campaigns
// running yet) - either way there's nothing real to show.
export default function GoogleAdsPanel() {
  const [performance, setPerformance] = useState<GoogleAdsPerformance | null | undefined>(undefined);

  useEffect(() => {
    getGoogleAdsPerformanceAction().then(setPerformance);
  }, []);

  if (performance === undefined) return <div className="brain-empty-note">Loading…</div>;

  if (performance === null) {
    return (
      <div className="brain-empty-note">
        No Google Ads data yet. The integration is connected, but no campaigns have run yet - check back once ads
        start spending, or set up a campaign in Google Ads.
      </div>
    );
  }

  const { kpis, topCampaigns } = performance;

  return (
    <>
      <KpiGrid
        cols={4}
        kpis={[
          { label: "Clicks (30d)", value: kpis.clicks.toLocaleString() },
          { label: "Impressions (30d)", value: kpis.impressions.toLocaleString() },
          { label: "Spend (30d)", value: fmtAed(kpis.costAed) },
          { label: "Conversions (30d)", value: kpis.conversions.toLocaleString() },
        ]}
      />
      {topCampaigns.length > 0 && (
        <DataTable
          columns={["Campaign", "Clicks", "Impressions", "Spend", "Conversions"]}
          rows={topCampaigns.map((c) => [
            c.name,
            c.clicks.toLocaleString(),
            c.impressions.toLocaleString(),
            fmtAed(c.costAed),
            c.conversions.toLocaleString(),
          ])}
        />
      )}
      <ChannelInsights channel="google" />
    </>
  );
}
