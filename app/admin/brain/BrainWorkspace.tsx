"use client";

import { useState } from "react";
import Sidebar from "./components/Sidebar";
import BrainToolModal from "./components/BrainToolModal";
import FloatingAssistant from "./components/FloatingAssistant";
import OverviewPanel, { type ChecklistItem } from "./components/brain/OverviewPanel";
import ToolsPanel from "./components/brain/ToolsPanel";
import WorkstreamsPanel from "./components/brain/WorkstreamsPanel";
import ChecklistPanel from "./components/brain/ChecklistPanel";
import MockupLibraryPanel from "./components/brain/MockupLibraryPanel";
import MarketingOverviewPanel from "./components/marketing/OverviewPanel";
import ChatPanel from "./components/marketing/ChatPanel";
import AiManagerPanel from "./components/marketing/AiManagerPanel";
import ApprovalsPanel from "./components/marketing/ApprovalsPanel";
import UsagePanel from "./components/marketing/UsagePanel";
import GoogleAdsPanel from "./components/marketing/GoogleAdsPanel";
import MetaPanel from "./components/marketing/MetaPanel";
import ContentStudioPanel from "./components/marketing/ContentStudioPanel";
import LeadsPanel from "./components/marketing/LeadsPanel";
import WebsitePanel from "./components/marketing/WebsitePanel";
import CalculatorPanel from "./components/marketing/CalculatorPanel";
import ReportingManagerPanel from "./components/marketing/ReportingManagerPanel";
import KnowledgeBasePanel from "./components/marketing/KnowledgeBasePanel";
import ComingSoonPanel from "./components/marketing/ComingSoonPanel";
import { BRAIN_TABS, MARKETING_TABS, COMING_SOON, type BrainTab, type MarketingTab } from "./data";

type Employee = "brain" | "marketing";
const PERIODS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
];

const BRAIN_TITLES = Object.fromEntries(BRAIN_TABS.map((t) => [t.key, t.label])) as Record<BrainTab, string>;
const MARKETING_TITLES = Object.fromEntries(MARKETING_TABS.map((t) => [t.key, t.label])) as Record<MarketingTab, string>;

export default function BrainWorkspace({ initialChecklist }: { initialChecklist: ChecklistItem[] }) {
  const [activeEmployee, setActiveEmployee] = useState<Employee>("brain");
  const [activeTab, setActiveTab] = useState<BrainTab | MarketingTab>("b-overview");
  const [period, setPeriod] = useState("30d");
  const [brainModalKey, setBrainModalKey] = useState<string | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);

  function selectEmployee(employee: Employee) {
    setActiveEmployee(employee);
    setActiveTab(employee === "brain" ? "b-overview" : "overview");
  }

  const isBrainActive = activeEmployee === "brain";
  const isComingSoon = !isBrainActive && activeTab in COMING_SOON;
  const pageTitle = isBrainActive ? BRAIN_TITLES[activeTab as BrainTab] : MARKETING_TITLES[activeTab as MarketingTab];

  return (
    <div className="ptb-brain">
      <div className="brain-shell">
        <Sidebar activeEmployee={activeEmployee} activeTab={activeTab} onSelectEmployee={selectEmployee} onSelectTab={setActiveTab} />

        <div className="brain-main">
          <div className="brain-header">
            <div>
              <div className={`brain-header-label brain-header-label--${isBrainActive ? "brain" : "marketing"}`}>
                {isBrainActive ? "THE BRAIN" : "MARKETING"}
              </div>
              <div className="brain-header-title">{pageTitle}</div>
            </div>
            {!isBrainActive && !isComingSoon && (
              <div className="brain-period-row">
                {PERIODS.map((p) => (
                  <div key={p.key} className={`brain-period-pill ${period === p.key ? "brain-period-pill--active" : ""}`} onClick={() => setPeriod(p.key)}>
                    {p.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="brain-content">
            {isBrainActive && activeTab === "b-overview" && (
              <OverviewPanel checklist={initialChecklist} onGoToChecklist={() => setActiveTab("b-checklist")} />
            )}
            {isBrainActive && activeTab === "b-tools" && <ToolsPanel onOpenTool={setBrainModalKey} />}
            {isBrainActive && activeTab === "b-workstreams" && <WorkstreamsPanel />}
            {isBrainActive && activeTab === "b-checklist" && <ChecklistPanel checklist={initialChecklist} />}
            {isBrainActive && activeTab === "b-library" && <MockupLibraryPanel />}

            {!isBrainActive && activeTab === "overview" && <MarketingOverviewPanel onAskAssistant={() => setActiveTab("chat")} />}
            {!isBrainActive && activeTab === "chat" && <ChatPanel />}
            {!isBrainActive && activeTab === "ai-manager" && <AiManagerPanel />}
            {!isBrainActive && activeTab === "approvals" && <ApprovalsPanel />}
            {!isBrainActive && activeTab === "usage" && <UsagePanel />}
            {!isBrainActive && activeTab === "google-ads" && <GoogleAdsPanel />}
            {!isBrainActive && activeTab === "meta" && <MetaPanel />}
            {!isBrainActive && activeTab === "content" && <ContentStudioPanel />}
            {!isBrainActive && activeTab === "leads" && <LeadsPanel />}
            {!isBrainActive && activeTab === "website" && <WebsitePanel />}
            {!isBrainActive && activeTab === "calculator" && <CalculatorPanel />}
            {!isBrainActive && activeTab === "reports" && <ReportingManagerPanel />}
            {!isBrainActive && activeTab === "knowledge" && <KnowledgeBasePanel />}
            {isComingSoon && (
              <ComingSoonPanel title={pageTitle} description={COMING_SOON[activeTab as MarketingTab] ?? ""} />
            )}
          </div>
        </div>
      </div>

      <FloatingAssistant open={assistantOpen} onOpenChange={setAssistantOpen} />
      {brainModalKey && <BrainToolModal toolKey={brainModalKey} onClose={() => setBrainModalKey(null)} />}
    </div>
  );
}
