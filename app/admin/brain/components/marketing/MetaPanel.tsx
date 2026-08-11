"use client";

import { useState } from "react";
import { META_KPIS, META_CONTENT, META_FILTERS, META_FILTER_TYPE_MAP } from "../../data";
import { KpiGrid, DataTable, Chip } from "../ui";
import ChannelInsights from "./ChannelInsights";

export default function MetaPanel() {
  const [filter, setFilter] = useState<(typeof META_FILTERS)[number]>("All");
  const filtered = filter === "All" ? META_CONTENT : META_CONTENT.filter((c) => c.type === META_FILTER_TYPE_MAP[filter]);

  return (
    <>
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
