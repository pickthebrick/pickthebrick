"use client";

import { useEffect, useState } from "react";
import { AUTONOMY_LEVELS, AUTONOMY_DESCRIPTIONS, TOOL_PERMISSIONS } from "../../data";
import {
  getMarketingWorkspaceState,
  setAutonomyLevelAction,
  setToolPermissionAction,
  getBudgetAction,
  setBudgetAction,
} from "@/app/actions/marketingAi";
import type { BudgetConfig } from "@/lib/marketingBudget";
import { SectionCard } from "../ui";

const BUDGET_FIELDS: { key: keyof BudgetConfig; label: string }[] = [
  { key: "dailyCapUsd", label: "Daily budget (USD)" },
  { key: "monthlyCapUsd", label: "Monthly budget (USD)" },
  { key: "maxSingleCallUsd", label: "Max per single call (USD)" },
  { key: "warningThresholdUsd", label: "Warning threshold (USD)" },
  { key: "criticalThresholdUsd", label: "Critical warning (USD)" },
];

export default function ApprovalsPanel() {
  const [autonomy, setAutonomy] = useState<number | null>(null);
  const [perms, setPerms] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [budget, setBudgetState] = useState<BudgetConfig | null>(null);
  const [budgetSaving, setBudgetSaving] = useState(false);

  useEffect(() => {
    getMarketingWorkspaceState().then((state) => {
      setAutonomy(state.autonomyLevel);
      setPerms(state.permissions);
      setLoading(false);
    });
    getBudgetAction().then(setBudgetState);
  }, []);

  function selectAutonomy(level: number) {
    setAutonomy(level);
    setAutonomyLevelAction(level);
  }

  function togglePerm(tool: string, perm: string) {
    const cur = perms[tool] ?? [];
    const enabled = !cur.includes(perm);
    const active = enabled ? [...cur, perm] : cur.filter((p) => p !== perm);
    setPerms((s) => ({ ...s, [tool]: active }));
    setToolPermissionAction(tool, perm, enabled);
  }

  function updateBudgetField(key: keyof BudgetConfig, value: string) {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    setBudgetState((b) => (b ? { ...b, [key]: num } : b));
  }

  function saveBudget() {
    if (!budget) return;
    setBudgetSaving(true);
    setBudgetAction(budget).finally(() => setBudgetSaving(false));
  }

  if (loading || autonomy === null) return <div className="brain-empty-note">Loading…</div>;

  return (
    <>
      <div className="brain-card brain-card--accent-blue brain-autonomy-card">
        <div className="brain-section-label">AI Autonomy (global)</div>
        <div className="brain-autonomy-row">
          {AUTONOMY_LEVELS.map((label, i) => (
            <div
              key={label}
              className={`brain-autonomy-pill ${autonomy === i ? "brain-autonomy-pill--active" : ""}`}
              onClick={() => selectAutonomy(i)}
            >
              {label}
            </div>
          ))}
        </div>
        <div className="brain-autonomy-desc">{AUTONOMY_DESCRIPTIONS[autonomy]}</div>
      </div>

      <div className="brain-section-label">Per-tool permissions</div>
      {TOOL_PERMISSIONS.map((tp) => {
        const active = perms[tp.name] ?? [];
        return (
          <div className="brain-card brain-perm-row" key={tp.name}>
            <div className="brain-perm-name">{tp.name}</div>
            <div className="brain-perm-chips">
              {tp.options.map((p) => (
                <div
                  key={p}
                  className={`brain-perm-chip ${active.includes(p) ? "brain-perm-chip--active" : ""}`}
                  onClick={() => togglePerm(tp.name, p)}
                >
                  {p}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <div className="brain-modal-note">Changes here take effect immediately for the chat agent too - it reads this same state.</div>

      <div className="brain-section-label" style={{ marginTop: 20 }}>
        AI Budget - this app&apos;s hard stop
      </div>
      <SectionCard>
        {!budget && <div className="brain-empty-note">Loading…</div>}
        {budget && (
          <>
            <div className="brain-budget-grid">
              {BUDGET_FIELDS.map((f) => (
                <div key={f.key} className="brain-budget-field">
                  <label className="brain-budget-label">{f.label}</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    className="brain-checklist-input"
                    value={budget[f.key]}
                    onChange={(e) => updateBudgetField(f.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="brain-btn brain-btn--primary" style={{ marginTop: 12 }} onClick={saveBudget}>
              {budgetSaving ? "Saving…" : "Save budget"}
            </div>
            <div className="brain-modal-note">
              Enforced by this app before every OpenAI call - once today&apos;s or this month&apos;s recorded spend hits its cap, requests
              are refused rather than relying on OpenAI&apos;s own (soft) project budget.
            </div>
          </>
        )}
      </SectionCard>
    </>
  );
}
