"use client";

import { GOOGLE_KPIS, GOOGLE_CAMPAIGNS, type GoogleCampaign } from "../../data";
import { KpiGrid, DataTable, Pill } from "../ui";
import ChannelInsights from "./ChannelInsights";

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
      <ChannelInsights channel="google" />
    </>
  );
}
