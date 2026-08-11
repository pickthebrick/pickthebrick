"use client";

import { GOOGLE_KPIS, GOOGLE_CAMPAIGNS, GOOGLE_INSIGHTS, type GoogleCampaign } from "../../data";
import { KpiGrid, DataTable, InsightList, Pill } from "../ui";

const STATUS_TONE: Record<GoogleCampaign["status"], "green" | "gold" | "red" | "grey"> = {
  SCALE: "green",
  MONITOR: "gold",
  FIX: "red",
  LEARNING: "grey",
};

export default function GoogleAdsPanel() {
  return (
    <>
      <KpiGrid kpis={GOOGLE_KPIS} cols={6} />
      <DataTable
        columns={["Campaign", "Spend", "Leads", "Qualified", "CPL", "Revenue", "ROAS", "AI Status"]}
        rows={GOOGLE_CAMPAIGNS.map((c) => [
          c.name,
          c.spend,
          c.leads,
          c.qualified,
          c.cpl,
          c.revenue,
          <span className="brain-roas" key="roas">
            {c.roas}
          </span>,
          <Pill key="status" label={c.status} tone={STATUS_TONE[c.status]} />,
        ])}
      />
      <InsightList title="What is Google Ads telling us?" items={GOOGLE_INSIGHTS} />
    </>
  );
}
