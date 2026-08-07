"use client";

import { useState, type ReactNode } from "react";

// Shared collapsible section card used across admin pages so dense screens
// (Projects, Approvals, Quotes, ...) read as scannable summaries rather than
// one long stack of always-expanded tables.
export default function AdminPanel({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: ReactNode;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="admin-panel">
      <div className="admin-panel-header" onClick={() => setOpen((o) => !o)}>
        <div className="admin-panel-title-group">
          <span className="admin-panel-title">{title}</span>
          {count !== undefined && <span className="admin-panel-count">{count}</span>}
        </div>
        <span className={`admin-panel-chevron ${open ? "open" : ""}`}>&#9656;</span>
      </div>
      {open && <div className="admin-panel-body">{children}</div>}
    </div>
  );
}
