"use client";

import { PINNED, TOOL_TILES } from "../../data";
import { SectionCard } from "../ui";

export type ChecklistItem = { id: string; text: string; done: boolean };

export default function OverviewPanel({ checklist, onGoToChecklist }: { checklist: ChecklistItem[]; onGoToChecklist: () => void }) {
  const openCount = checklist.filter((c) => !c.done).length;
  const doneCount = checklist.length - openCount;
  const healthyCount = TOOL_TILES.filter((t) => t.dotColor === "green").length;
  const attentionCount = TOOL_TILES.length - healthyCount;
  const openPreview = checklist.filter((c) => !c.done).slice(0, 5);

  return (
    <>
      <SectionCard accent="blue" className="brain-banner">
        <div className="brain-banner-title">Good morning. Ops snapshot.</div>
        <div className="brain-banner-text">
          Tools: {healthyCount} healthy · {attentionCount} need attention · Checklist: {openCount} open · {doneCount} done
        </div>
      </SectionCard>

      <div className="brain-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <SectionCard title="Pinned">
          {PINNED.map((pin) => (
            <div className="brain-pinned-row" key={pin.label}>
              <div className="brain-pinned-label">{pin.label}</div>
              <div className={`brain-pinned-value ${pin.accent ? "brain-pinned-value--accent" : ""}`}>{pin.value}</div>
            </div>
          ))}
        </SectionCard>
        <SectionCard title="Open checklist items">
          {openPreview.length === 0 && <div className="brain-empty-note">Nothing open — nice.</div>}
          {openPreview.map((c) => (
            <div className="brain-checklist-preview-row" key={c.id}>
              {c.text}
            </div>
          ))}
          <div className="brain-link-more" onClick={onGoToChecklist}>
            Open checklist →
          </div>
        </SectionCard>
      </div>
    </>
  );
}
