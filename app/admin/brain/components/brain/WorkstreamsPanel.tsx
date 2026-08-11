"use client";

import { WORKSTREAMS, type Workstream } from "../../data";
import { RowList, Pill } from "../ui";

const STATUS_TONE: Record<Workstream["status"], "green" | "gold" | "grey" | "red"> = {
  Live: "green",
  "In progress": "gold",
  Deciding: "gold",
  Next: "grey",
  Urgent: "red",
};

export default function WorkstreamsPanel() {
  return (
    <RowList>
      {WORKSTREAMS.map((w) => (
        <div className="brain-row-list-item" key={w.name}>
          <div className="brain-row-list-name">{w.name}</div>
          <div className="brain-row-list-note">{w.note}</div>
          <Pill label={w.status} tone={STATUS_TONE[w.status]} />
        </div>
      ))}
    </RowList>
  );
}
