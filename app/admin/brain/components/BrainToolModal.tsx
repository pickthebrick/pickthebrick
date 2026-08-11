"use client";

import { useEffect } from "react";
import { TOOL_MODALS } from "../data";

const POWERSHELL_SNIPPET = `New-Item -Path "HKCU:\\Software\\Classes\\powershell" -Force
Set-ItemProperty -Path "HKCU:\\Software\\Classes\\powershell" -Name "(Default)" -Value "URL:PowerShell"
Set-ItemProperty -Path "HKCU:\\Software\\Classes\\powershell" -Name "URL Protocol" -Value ""
New-Item -Path "HKCU:\\Software\\Classes\\powershell\\shell\\open\\command" -Force -Value 'powershell.exe -NoExit'`;

export default function BrainToolModal({ toolKey, onClose }: { toolKey: string; onClose: () => void }) {
  const modal = TOOL_MODALS[toolKey];

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!modal) return null;

  return (
    <div
      className="brain-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="brain-modal">
        <div className="brain-modal-header">
          <div className="brain-modal-title">{modal.title}</div>
          <div className="brain-modal-close" onClick={onClose}>
            ✕
          </div>
        </div>

        {modal.custom ? (
          <>
            <p className="brain-modal-body-text">
              Browsers can&apos;t launch local apps directly. One-time fix: register a <b>powershell://</b> handler, then this
              button works forever.
            </p>
            <div className="brain-modal-step">STEP 1 — run once in an Admin PowerShell:</div>
            <pre className="brain-modal-code">{POWERSHELL_SNIPPET}</pre>
            <div className="brain-modal-step">STEP 2 — then this button launches it:</div>
            <div className="brain-modal-actions">
              <a href="powershell://open" className="brain-btn brain-btn--primary brain-btn--block">
                Launch PowerShell
              </a>
              <div className="brain-btn brain-btn--block" onClick={onClose}>
                Close
              </div>
            </div>
            <div className="brain-modal-note">Registers the handler for your user only (HKCU); does not allow websites to run commands.</div>
          </>
        ) : (
          <>
            {modal.rows.map((row) => (
              <div className="brain-modal-row" key={row.k}>
                <span className="brain-modal-row-key">{row.k}</span>
                <span className={`brain-modal-row-val brain-modal-row-val--${row.tone}`}>{row.v}</span>
              </div>
            ))}
            <div className="brain-modal-actions">
              <a href={modal.link} target="_blank" rel="noreferrer" className="brain-btn brain-btn--primary brain-btn--block">
                {modal.linkLabel}
              </a>
              <div className="brain-btn brain-btn--block" onClick={onClose}>
                Close
              </div>
            </div>
            {modal.sample && <div className="brain-modal-note">⚠ SAMPLE DATA — real status needs a small API proxy wiring the Vercel/Neon/GitHub/Cloudflare APIs.</div>}
          </>
        )}
      </div>
    </div>
  );
}
