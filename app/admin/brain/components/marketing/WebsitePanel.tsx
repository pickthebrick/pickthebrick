"use client";

import { useEffect, useState } from "react";
import { getWebsiteAnalyticsAction } from "@/app/actions/marketingAi";
import type { WebsiteAnalytics } from "@/lib/ga4";
import { KpiGrid, DataTable } from "../ui";
import ChannelInsights from "./ChannelInsights";

function fmtPct(n: number) {
  return `${n.toFixed(1)}%`;
}

// Real GA4 numbers (last 30 days) - replaces the WEBSITE_KPIS/TOP_PAGES
// sample arrays that used to live in ../../data.ts. `analytics` is null
// both while loading and, indistinguishably, once GA4 has genuinely
// recorded zero sessions (new properties take up to 48h to start
// collecting) - either way there's nothing real to show yet.
export default function WebsitePanel() {
  const [analytics, setAnalytics] = useState<WebsiteAnalytics | null | undefined>(undefined);

  useEffect(() => {
    getWebsiteAnalyticsAction().then(setAnalytics);
  }, []);

  if (analytics === undefined) return <div className="brain-empty-note">Loading…</div>;

  if (analytics === null) {
    return (
      <div className="brain-empty-note">
        No Google Analytics data yet. GA4 is connected, but a freshly connected property can take up to 48 hours to
        start recording real visitor data - check back once traffic starts landing.
      </div>
    );
  }

  const { kpis, topPages } = analytics;

  return (
    <>
      <KpiGrid
        cols={4}
        kpis={[
          { label: "Sessions (30d)", value: kpis.sessions.toLocaleString() },
          { label: "Users (30d)", value: kpis.totalUsers.toLocaleString() },
          { label: "Bounce rate", value: fmtPct(kpis.bounceRate * 100) },
          { label: "Key events", value: kpis.keyEvents.toLocaleString() },
        ]}
      />
      {topPages.length > 0 && (
        <DataTable
          columns={["Page", "Sessions", "Bounce"]}
          rows={topPages.map((p) => [p.page, p.sessions.toLocaleString(), fmtPct(p.bounceRate * 100)])}
        />
      )}
      <ChannelInsights channel="website" />
    </>
  );
}
