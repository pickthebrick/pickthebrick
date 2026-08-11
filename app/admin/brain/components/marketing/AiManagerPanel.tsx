"use client";

import { ACTIVITY_LOG } from "../../data";
import { Pill } from "../ui";

const STATUS_TONE = {
  "Awaiting approval": "gold",
  Approved: "green",
  Open: "red",
} as const;

export default function AiManagerPanel() {
  return (
    <>
      <div className="brain-section-label">AI Activity Log</div>
      {ACTIVITY_LOG.map((a, i) => (
        <div className="brain-card brain-activity-card" key={i}>
          <div className="brain-activity-head">
            <div className="brain-activity-time">{a.time}</div>
            <Pill label={a.status} tone={STATUS_TONE[a.status]} />
          </div>
          <div className="brain-activity-line">
            <b>Saw:</b> {a.saw}
          </div>
          <div className="brain-activity-line">
            <b>Decided:</b> {a.decided}
          </div>
          <div className="brain-activity-line brain-activity-line--muted">
            <b>Why:</b> {a.why}
          </div>
        </div>
      ))}
    </>
  );
}
