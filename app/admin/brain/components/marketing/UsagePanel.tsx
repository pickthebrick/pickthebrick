"use client";

import { useEffect, useState } from "react";
import { getUsageDetailAction } from "@/app/actions/marketingAi";
import type { RoleUsage, RecentCall, UsageTotals } from "@/lib/marketingBudget";
import type { BudgetConfig } from "@/lib/marketingBudget";
import { SectionCard, KpiGrid, DataTable, ProgressBar } from "../ui";
import { MARKETING_ROLES } from "@/lib/ai/marketingRoles";

type Detail = {
  budget: BudgetConfig;
  today: UsageTotals;
  month: UsageTotals;
  roleBreakdown: RoleUsage[];
  recentCalls: RecentCall[];
};

function fmtTokens(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function fmtCost(n: number) {
  return `$${n.toFixed(2)}`;
}

function fmtTime(d: Date) {
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function roleName(role: string) {
  return MARKETING_ROLES[role as keyof typeof MARKETING_ROLES]?.name ?? role;
}

// Dedicated token/cost visibility for the OpenAI-backed Marketing AI - the
// Overview page's AiUsageCard only shows the two spend-vs-cap bars; this tab
// adds actual token counts, a per-role breakdown, and the recent call log,
// so "how much are we actually using" has a real home instead of living
// only in raw DB rows.
export default function UsagePanel() {
  const [detail, setDetail] = useState<Detail | null>(null);

  useEffect(() => {
    getUsageDetailAction().then(setDetail);
  }, []);

  if (!detail) return <div className="brain-empty-note">Loading…</div>;

  const { budget, today, month, roleBreakdown, recentCalls } = detail;
  const dayPct = budget.dailyCapUsd > 0 ? Math.min(100, (today.costUsd / budget.dailyCapUsd) * 100) : 0;
  const monthPct = budget.monthlyCapUsd > 0 ? Math.min(100, (month.costUsd / budget.monthlyCapUsd) * 100) : 0;

  return (
    <>
      <KpiGrid
        cols={4}
        kpis={[
          { label: "Tokens today", value: fmtTokens(today.inputTokens + today.outputTokens) },
          { label: "Tokens this month", value: fmtTokens(month.inputTokens + month.outputTokens) },
          { label: "Calls today", value: String(today.calls) },
          { label: "Calls this month", value: String(month.calls) },
        ]}
      />

      <div className="brain-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <SectionCard title="Spend today">
          <div className="brain-usage-label">
            <span className="brain-usage-value">
              {fmtCost(today.costUsd)} / {fmtCost(budget.dailyCapUsd)}
            </span>
          </div>
          <ProgressBar pct={dayPct} />
          <div className="brain-empty-note" style={{ marginTop: 8 }}>
            {fmtTokens(today.inputTokens)} in · {fmtTokens(today.outputTokens)} out
          </div>
        </SectionCard>
        <SectionCard title="Spend this month">
          <div className="brain-usage-label">
            <span className="brain-usage-value">
              {fmtCost(month.costUsd)} / {fmtCost(budget.monthlyCapUsd)}
            </span>
          </div>
          <ProgressBar pct={monthPct} />
          <div className="brain-empty-note" style={{ marginTop: 8 }}>
            {fmtTokens(month.inputTokens)} in · {fmtTokens(month.outputTokens)} out
          </div>
        </SectionCard>
      </div>

      <SectionCard title="By role (this month)">
        {roleBreakdown.length === 0 ? (
          <div className="brain-empty-note">No AI calls recorded yet this month.</div>
        ) : (
          <DataTable
            columns={["Role", "Calls", "Input tokens", "Output tokens", "Est. cost"]}
            rows={roleBreakdown.map((r) => [
              roleName(r.role),
              String(r.calls),
              fmtTokens(r.inputTokens),
              fmtTokens(r.outputTokens),
              fmtCost(r.costUsd),
            ])}
          />
        )}
      </SectionCard>

      <SectionCard title="Recent calls">
        {recentCalls.length === 0 ? (
          <div className="brain-empty-note">No AI calls recorded yet.</div>
        ) : (
          <DataTable
            columns={["When", "Role", "Model", "Input", "Output", "Cost"]}
            rows={recentCalls.map((c) => [
              fmtTime(c.createdAt),
              roleName(c.role),
              c.model,
              fmtTokens(c.inputTokens),
              fmtTokens(c.outputTokens),
              fmtCost(c.costUsd),
            ])}
          />
        )}
      </SectionCard>
    </>
  );
}
