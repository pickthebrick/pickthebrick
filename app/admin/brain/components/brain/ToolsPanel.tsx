"use client";

import { TOOL_TILES } from "../../data";
import { StatusDot } from "../ui";

export default function ToolsPanel({ onOpenTool }: { onOpenTool: (key: string) => void }) {
  return (
    <div className="brain-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
      {TOOL_TILES.map((t) => (
        <div className="brain-card brain-tool-tile" key={t.key} onClick={() => onOpenTool(t.key)}>
          <div className="brain-tool-tile-top">
            <div className="brain-tool-tile-icon">{t.icon}</div>
            <div className="brain-tool-tile-status">
              <StatusDot tone={t.dotColor} />
              <span className={`brain-tool-tile-status-label brain-tool-tile-status-label--${t.dotColor}`}>{t.status}</span>
            </div>
          </div>
          <div className="brain-tool-tile-name">{t.name}</div>
          <div className="brain-tool-tile-desc">{t.desc}</div>
        </div>
      ))}
    </div>
  );
}
