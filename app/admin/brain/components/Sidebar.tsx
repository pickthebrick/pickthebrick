"use client";

import Link from "next/link";
import { BRAIN_TABS, MARKETING_TABS, type BrainTab, type MarketingTab } from "../data";

type Employee = "brain" | "marketing";

export default function Sidebar({
  activeEmployee,
  activeTab,
  onSelectEmployee,
  onSelectTab,
}: {
  activeEmployee: Employee;
  activeTab: BrainTab | MarketingTab;
  onSelectEmployee: (employee: Employee) => void;
  onSelectTab: (tab: BrainTab | MarketingTab) => void;
}) {
  return (
    <aside className="brain-sidebar">
      <div className="brain-sidebar-logo">
        <div className="brain-sidebar-logo-mark">P</div>
        <div>
          <div className="brain-sidebar-logo-name">PickTheBrick</div>
          <div className="brain-sidebar-logo-sub">Workspace</div>
        </div>
      </div>

      <Link href="/admin" className="brain-sidebar-back">
        ← Back to Admin
      </Link>

      <div
        className={`brain-sidebar-section ${activeEmployee === "brain" ? "brain-sidebar-section--active-brain" : ""}`}
        onClick={() => onSelectEmployee("brain")}
      >
        <div className="brain-sidebar-avatar brain-sidebar-avatar--brain">B</div>
        <div>
          <div className="brain-sidebar-section-name">The Brain</div>
          <div className="brain-sidebar-section-sub">Operations &amp; strategy</div>
        </div>
      </div>
      {activeEmployee === "brain" && (
        <div className="brain-sidebar-nav">
          {BRAIN_TABS.map((t) => (
            <div
              key={t.key}
              className={`brain-sidebar-nav-item ${activeTab === t.key ? "brain-sidebar-nav-item--active-brain" : ""}`}
              onClick={() => onSelectTab(t.key)}
            >
              {t.label}
            </div>
          ))}
        </div>
      )}

      <div
        className={`brain-sidebar-section ${activeEmployee === "marketing" ? "brain-sidebar-section--active-marketing" : ""}`}
        onClick={() => onSelectEmployee("marketing")}
      >
        <div className="brain-sidebar-avatar brain-sidebar-avatar--marketing">M</div>
        <div>
          <div className="brain-sidebar-section-name">Marketing</div>
          <div className="brain-sidebar-section-sub">AI marketing manager</div>
        </div>
      </div>
      {activeEmployee === "marketing" && (
        <div className="brain-sidebar-nav">
          {MARKETING_TABS.map((t) => (
            <div
              key={t.key}
              className={`brain-sidebar-nav-item ${activeTab === t.key ? "brain-sidebar-nav-item--active-marketing" : ""}`}
              onClick={() => onSelectTab(t.key)}
            >
              {t.label}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
