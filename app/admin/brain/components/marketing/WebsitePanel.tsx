"use client";

import { WEBSITE_KPIS, TOP_PAGES, CONVERSION_INSIGHTS } from "../../data";
import { KpiGrid, DataTable, InsightList } from "../ui";

export default function WebsitePanel() {
  return (
    <>
      <KpiGrid kpis={WEBSITE_KPIS} cols={5} />
      <DataTable
        columns={["Page", "Sessions", "Conv. rate", "Bounce"]}
        rows={TOP_PAGES.map((p) => [
          p.page,
          p.sessions,
          <span key="cvr" className="brain-roas">
            {p.cvr}
          </span>,
          p.bounce,
        ])}
      />
      <InsightList title="Why aren't visitors converting?" items={CONVERSION_INSIGHTS} />
    </>
  );
}
