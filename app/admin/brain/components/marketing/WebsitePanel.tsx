"use client";

import { WEBSITE_KPIS, TOP_PAGES } from "../../data";
import { KpiGrid, DataTable } from "../ui";
import ChannelInsights from "./ChannelInsights";

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
      <ChannelInsights channel="website" />
    </>
  );
}
