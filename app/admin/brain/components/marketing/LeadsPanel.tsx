"use client";

import { PIPELINE_STAGES, LEADS, CHANNEL_REVENUE, type LeadStatus } from "../../data";
import { DataTable, InsightList, Pill } from "../ui";

const STATUS_TONE: Record<LeadStatus, "green" | "gold" | "grey" | "blue" | "red"> = {
  New: "grey",
  Contacted: "grey",
  Qualified: "green",
  Quotation: "gold",
  Negotiation: "blue",
  Won: "green",
  Lost: "red",
};

export default function LeadsPanel() {
  return (
    <>
      <div className="brain-grid" style={{ gridTemplateColumns: "repeat(6,1fr)", marginBottom: 18 }}>
        {PIPELINE_STAGES.map((s) => (
          <div className="brain-card brain-pipeline-tile" key={s.name}>
            <div className="brain-pipeline-count">{s.count}</div>
            <div className="brain-pipeline-name">{s.name}</div>
          </div>
        ))}
      </div>
      <DataTable
        columns={["Lead", "Source", "Campaign", "Est. budget", "Status"]}
        rows={LEADS.map((l) => [
          l.name,
          l.source,
          l.campaign,
          l.budget,
          <Pill key="status" label={l.status} tone={STATUS_TONE[l.status]} />,
        ])}
      />
      <InsightList title="Marketing → Revenue" items={CHANNEL_REVENUE} />
    </>
  );
}
