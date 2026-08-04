"use client";

import { useState } from "react";
import { TERMS_AND_CONDITIONS } from "@/lib/terms";

export default function TermsSection({ agreed, onAgreedChange }: { agreed: boolean; onAgreedChange: (v: boolean) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="terms-section">
      <div className="terms-toggle" onClick={() => setOpen((v) => !v)}>
        <span>Terms &amp; Conditions for standard fitout</span>
        <span>{open ? "Hide −" : "Show +"}</span>
      </div>
      {open && (
        <div className="terms-body">
          {TERMS_AND_CONDITIONS.map((section) => (
            <div key={section.heading} className="terms-clause">
              <div className="terms-clause-heading">{section.heading}</div>
              <p>{section.body}</p>
            </div>
          ))}
        </div>
      )}
      <label className="terms-checkbox-row">
        <input type="checkbox" checked={agreed} onChange={(e) => onAgreedChange(e.target.checked)} />
        <span>I have read and agree to the Terms &amp; Conditions above.</span>
      </label>
    </div>
  );
}
