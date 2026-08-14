"use client";

import { useEffect, useState } from "react";
import { META_KPIS, META_CONTENT, META_FILTERS, META_FILTER_TYPE_MAP } from "../../data";
import { getMetaPageInfoAction, getInstagramAccountInfoAction } from "@/app/actions/marketingAi";
import type { MetaPageInfo, InstagramAccountInfo } from "@/lib/meta";
import { KpiGrid, DataTable, Chip } from "../ui";
import ChannelInsights from "./ChannelInsights";

export default function MetaPanel() {
  const [filter, setFilter] = useState<(typeof META_FILTERS)[number]>("All");
  const filtered = filter === "All" ? META_CONTENT : META_CONTENT.filter((c) => c.type === META_FILTER_TYPE_MAP[filter]);
  const [pageInfo, setPageInfo] = useState<MetaPageInfo | null | undefined>(undefined);
  const [igInfo, setIgInfo] = useState<InstagramAccountInfo | null | undefined>(undefined);

  useEffect(() => {
    getMetaPageInfoAction().then(setPageInfo);
    getInstagramAccountInfoAction().then(setIgInfo);
  }, []);

  return (
    <>
      {pageInfo && (
        <div className="brain-modal-note" style={{ marginBottom: 12 }}>
          Live from Facebook: <strong>{pageInfo.name}</strong> has <strong>{pageInfo.followers.toLocaleString()}</strong> followers.
          The KPIs below are sample ad-spend data - the Meta Ads Marketing API isn&apos;t connected yet.
        </div>
      )}
      {igInfo && (
        <div className="brain-modal-note" style={{ marginBottom: 12 }}>
          Live from Instagram: <strong>@{igInfo.username}</strong> has <strong>{igInfo.followers.toLocaleString()}</strong> followers
          and <strong>{igInfo.mediaCount.toLocaleString()}</strong> posts. Aiman can see this too, but can&apos;t post yet - the
          System User token needs the <code>instagram_content_publish</code> permission first.
        </div>
      )}
      {igInfo === null && (
        <div className="brain-modal-note" style={{ marginBottom: 12 }}>
          Instagram isn&apos;t connected yet - link the @pickthebrick Instagram account to the Facebook Page in Meta
          Business Suite (Settings → Accounts → Instagram accounts → Connect account), then this tab and Aiman will
          both pick it up automatically.
        </div>
      )}
      <KpiGrid kpis={META_KPIS} cols={6} />
      <div className="brain-chip-row">
        {META_FILTERS.map((f) => (
          <Chip key={f} label={f} active={filter === f} onClick={() => setFilter(f)} />
        ))}
      </div>
      <DataTable
        columns={["Post / Reel", "Type", "Reach", "Engagement", "Clicks", "Leads", "Revenue"]}
        rows={filtered.map((c) => [c.name, c.type, c.reach, c.engagement, c.clicks, c.leads, <span key="rev" className="brain-roas">{c.revenue}</span>])}
      />
      <ChannelInsights channel="meta" />
    </>
  );
}
