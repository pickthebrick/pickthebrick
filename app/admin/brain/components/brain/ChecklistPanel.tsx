"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrainChecklistItem, toggleBrainChecklistItem, deleteBrainChecklistItem } from "@/app/actions/brainChecklist";
import type { ChecklistItem } from "./OverviewPanel";

export default function ChecklistPanel({ checklist }: { checklist: ChecklistItem[] }) {
  const router = useRouter();
  const [newText, setNewText] = useState("");
  const [pending, startTransition] = useTransition();

  function add() {
    const text = newText.trim();
    if (!text) return;
    setNewText("");
    startTransition(async () => {
      await createBrainChecklistItem(text);
      router.refresh();
    });
  }

  function toggle(id: string) {
    startTransition(async () => {
      await toggleBrainChecklistItem(id);
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteBrainChecklistItem(id);
      router.refresh();
    });
  }

  return (
    <>
      <div className="brain-checklist-input-row">
        <input
          className="brain-checklist-input"
          value={newText}
          placeholder="Add a task…"
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
        />
        <div className="brain-btn brain-btn--primary" onClick={add}>
          Add
        </div>
      </div>
      <div className="brain-card brain-checklist-list">
        {checklist.map((c) => (
          <div className={`brain-checklist-row ${pending ? "brain-checklist-row--pending" : ""}`} key={c.id}>
            <div className={`brain-checklist-box ${c.done ? "brain-checklist-box--done" : ""}`} onClick={() => toggle(c.id)}>
              {c.done ? "✓" : ""}
            </div>
            <div className={`brain-checklist-text ${c.done ? "brain-checklist-text--done" : ""}`} onClick={() => toggle(c.id)}>
              {c.text}
            </div>
            <div className="brain-checklist-delete" onClick={() => remove(c.id)}>
              ✕
            </div>
          </div>
        ))}
        {checklist.length === 0 && <div className="brain-empty-note">No tasks yet — add one above.</div>}
      </div>
    </>
  );
}
