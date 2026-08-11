"use client";

import { MOCKUPS, type Mockup } from "../../data";
import { RowList, Pill } from "../ui";

const STAGE_TONE: Record<Mockup["stage"], "green" | "gold" | "grey"> = {
  Shipped: "green",
  Ready: "gold",
  Concept: "grey",
};

export default function MockupLibraryPanel() {
  return (
    <RowList>
      {MOCKUPS.map((m) => (
        <div className="brain-row-list-item brain-row-list-item--compact" key={m.name}>
          <span>{m.icon}</span>
          <span className="brain-row-list-name brain-row-list-name--flex">{m.name}</span>
          <Pill label={m.stage} tone={STAGE_TONE[m.stage]} />
        </div>
      ))}
    </RowList>
  );
}
