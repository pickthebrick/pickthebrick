"use client";

import { useEffect, useState } from "react";
import { AUTONOMY_LEVELS, AUTONOMY_DESCRIPTIONS, TOOL_PERMISSIONS } from "../../data";
import { getMarketingWorkspaceState, setAutonomyLevelAction, setToolPermissionAction } from "@/app/actions/marketingAi";

export default function ApprovalsPanel() {
  const [autonomy, setAutonomy] = useState<number | null>(null);
  const [perms, setPerms] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarketingWorkspaceState().then((state) => {
      setAutonomy(state.autonomyLevel);
      setPerms(state.permissions);
      setLoading(false);
    });
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
    </>
  );
}
