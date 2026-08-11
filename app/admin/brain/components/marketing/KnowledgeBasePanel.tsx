"use client";

import { useEffect, useState } from "react";
import { getConstitutionAction, setConstitutionAction } from "@/app/actions/marketingAi";
import type { MarketingConstitutionFields } from "@/lib/marketingState";
import { SectionCard } from "../ui";

// The "Marketing Constitution" - permanent business knowledge every AI role
// reads before doing anything (folded into buildBusinessContext() in
// lib/ai/marketingProvider.ts), editable here instead of requiring a code
// change every time a fact changes.
const SECTIONS: { key: keyof MarketingConstitutionFields; label: string; hint: string }[] = [
  { key: "business", label: "Business", hint: "What PickTheBrick is, what you sell, geographic market, business model." },
  { key: "customers", label: "Customers", hint: "ICP, customer types, company sizes, decision makers, pain points, objections." },
  { key: "products", label: "Products", hint: "Packages, prices, formulas, services." },
  { key: "objectives", label: "Marketing objectives", hint: "What the marketing team is actually trying to achieve, in priority order." },
  { key: "brandRules", label: "Brand rules", hint: "Tone, visual identity, claims allowed, claims prohibited, terminology." },
  { key: "commercialRules", label: "Commercial rules", hint: "Hard constraints every role must never violate - e.g. never invent a price." },
];

export default function KnowledgeBasePanel() {
  const [fields, setFields] = useState<MarketingConstitutionFields | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    getConstitutionAction().then(setFields);
  }, []);

  function update(key: keyof MarketingConstitutionFields, value: string) {
    setFields((f) => (f ? { ...f, [key]: value } : f));
  }

  function save() {
    if (!fields) return;
    setSaving(true);
    setConstitutionAction(fields)
      .then(() => setSavedAt(new Date()))
      .finally(() => setSaving(false));
  }

  if (!fields) return <div className="brain-empty-note">Loading…</div>;

  return (
    <>
      <div className="brain-modal-note brain-constitution-intro">
        This is the Marketing Constitution - permanent business knowledge every AI role reads before doing anything. Edit it here
        instead of re-explaining things one chat message at a time.
      </div>
      {SECTIONS.map((s) => (
        <SectionCard key={s.key} title={s.label}>
          <div className="brain-constitution-hint">{s.hint}</div>
          <textarea className="brain-constitution-textarea" value={fields[s.key]} onChange={(e) => update(s.key, e.target.value)} rows={3} />
        </SectionCard>
      ))}
      <div className="brain-constitution-actions">
        <div className="brain-btn brain-btn--primary" onClick={save}>
          {saving ? "Saving…" : "Save Constitution"}
        </div>
        {savedAt && <span className="brain-constitution-saved">Saved {savedAt.toLocaleTimeString()}</span>}
      </div>
    </>
  );
}
