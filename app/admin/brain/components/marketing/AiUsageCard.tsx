"use client";

import { useEffect, useState } from "react";
import { getUsageSummaryAction } from "@/app/actions/marketingAi";
import type { BudgetConfig } from "@/lib/marketingBudget";
import { ProgressBar } from "../ui";

type Summary = { budget: BudgetConfig; todaySpendUsd: number; monthSpendUsd: number };

// This app's own AI spend visibility - not OpenAI's dashboard, which lags
// and doesn't enforce a hard stop. See lib/marketingBudget.ts for the cap
// enforcement itself (checked before every OpenAI call); this card just
// shows where things stand.
export default function AiUsageCard() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    getUsageSummaryAction().then(setSummary);
  }, []);

  if (!summary) return null;
  const dayPct = summary.budget.dailyCapUsd > 0 ? Math.min(100, (summary.todaySpendUsd / summary.budget.dailyCapUsd) * 100) : 0;
  const monthPct = summary.budget.monthlyCapUsd > 0 ? Math.min(100, (summary.monthSpendUsd / summary.budget.monthlyCapUsd) * 100) : 0;

  return (
    <div className="brain-card brain-usage-strip">
      <div className="brain-usage-item">
        <div className="brain-usage-label">
          AI cost today <span className="brain-usage-value">${summary.todaySpendUsd.toFixed(2)} / ${summary.budget.dailyCapUsd.toFixed(2)}</span>
        </div>
        <ProgressBar pct={dayPct} />
      </div>
      <div className="brain-usage-item">
        <div className="brain-usage-label">
          This month <span className="brain-usage-value">${summary.monthSpendUsd.toFixed(2)} / ${summary.budget.monthlyCapUsd.toFixed(2)}</span>
        </div>
        <ProgressBar pct={monthPct} />
      </div>
    </div>
  );
}
