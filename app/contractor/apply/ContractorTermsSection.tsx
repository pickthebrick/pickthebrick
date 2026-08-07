"use client";

import { useState } from "react";
import { CONTRACTOR_TERMS_AND_CONDITIONS } from "@/lib/contractorTerms";

// Same accordion + required-checkbox pattern as app/build/TermsSection.tsx,
// styled under .ptb-dash instead of .ptb-build (see the .terms-* rules in
// dashboard.css) so this drops into the contractor apply page without
// importing build.css.
export default function ContractorTermsSection({ agreed, onAgreedChange }: { agreed: boolean; onAgreedChange: (v: boolean) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="terms-section">
      <div className="terms-toggle" onClick={() => setOpen((v) => !v)}>
        <span>Partner Terms &amp; Conditions</span>
        <span>{open ? "Hide −" : "Show +"}</span>
      </div>
      {open && (
        <div className="terms-body">
          {CONTRACTOR_TERMS_AND_CONDITIONS.map((section) => (
            <div key={section.heading} className="terms-clause">
              <div className="terms-clause-heading">{section.heading}</div>
              <p>{section.body}</p>
            </div>
          ))}
        </div>
      )}
      <label className="terms-checkbox-row">
        <input type="checkbox" checked={agreed} onChange={(e) => onAgreedChange(e.target.checked)} />
        <span>I have read and agree to the Partner Terms &amp; Conditions above.</span>
      </label>
    </div>
  );
}
