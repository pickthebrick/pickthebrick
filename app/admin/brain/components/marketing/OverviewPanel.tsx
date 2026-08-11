"use client";

import { useEffect, useState } from "react";
import { MARKETING_KPIS } from "../../data";
import { MARKETING_ROLE_LIST } from "@/lib/ai/marketingRoles";
import {
  getMarketingAnalysis,
  refreshMarketingAnalysis,
  setRecommendationStatusAction,
  executeActionAction,
  getMarketingWorkspaceState,
  getOpportunitiesAction,
  refreshOpportunitiesAction,
} from "@/app/actions/marketingAi";
import type { MarketingAnalysis } from "@/lib/ai/marketingProvider";
import type { MarketingOpportunity } from "@/lib/marketingState";
import { KpiGrid, SectionCard } from "../ui";
import AiUsageCard from "./AiUsageCard";
import RecommendationCard from "./RecommendationCard";

export default function OverviewPanel({ onAskAssistant }: { onAskAssistant: () => void }) {
  const [analysis, setAnalysis] = useState<MarketingAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [executing, setExecuting] = useState<Record<string, boolean>>({});
  const [opportunities, setOpportunities] = useState<MarketingOpportunity[]>([]);
  const [opportunitiesFallback, setOpportunitiesFallback] = useState(true);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(true);

  function fetchAll() {
    Promise.all([getMarketingAnalysis(), getMarketingWorkspaceState()])
      .then(([a, state]) => {
        setAnalysis(a);
        setPermissions(state.permissions);
      })
      .finally(() => setLoading(false));
    getOpportunitiesAction()
      .then((r) => {
        setOpportunities(r.opportunities);
        setOpportunitiesFallback(r.fallback);
      })
      .finally(() => setOpportunitiesLoading(false));
  }

  function refresh() {
    setLoading(true);
    refreshMarketingAnalysis()
      .then(setAnalysis)
      .finally(() => setLoading(false));
  }

  function refreshOpportunities() {
    setOpportunitiesLoading(true);
    refreshOpportunitiesAction()
      .then((r) => {
        setOpportunities(r.opportunities);
        setOpportunitiesFallback(r.fallback);
      })
      .finally(() => setOpportunitiesLoading(false));
  }

  useEffect(() => {
    fetchAll();
  }, []);

  function setRecStatus(id: string, status: "APPROVED" | "REJECTED") {
    setAnalysis((cur) => (cur ? { ...cur, recommendations: cur.recommendations.map((r) => (r.id === id ? { ...r, status } : r)) } : cur));
    setRecommendationStatusAction(id, status);
  }

  function execute(id: string) {
    setExecuting((s) => ({ ...s, [id]: true }));
    executeActionAction(id)
      .then(() => getMarketingAnalysis())
      .then((a) => setAnalysis(a))
      .finally(() => setExecuting((s) => ({ ...s, [id]: false })));
  }

  return (
    <>
      <div className="brain-team-strip">
        {MARKETING_ROLE_LIST.map((role) => (
          <div className="brain-team-card" key={role.id}>
            <div className="brain-team-icon">{role.icon}</div>
            <div>
              <div className="brain-team-name">{role.name}</div>
              <div className="brain-team-mission">{role.mission}</div>
            </div>
          </div>
        ))}
      </div>

      <AiUsageCard />

      <KpiGrid kpis={MARKETING_KPIS} />

      <div className="brain-grid" style={{ gridTemplateColumns: "1.55fr 1fr", marginTop: 14 }}>
        <SectionCard accent="gold">
          <div className="brain-ai-manager-head">
            <span className="brain-status-dot brain-status-dot--gold" />
            <div className="brain-ai-manager-title">AI Marketing Manager</div>
            <div className="brain-ai-manager-refresh" onClick={refresh}>
              {loading ? "Thinking…" : "Refresh analysis"}
            </div>
          </div>
          <div className="brain-ai-manager-intro">Good morning. Here&apos;s what changed this week.</div>

          {analysis?.fallback && <div className="brain-modal-note">{"Live AI unavailable right now — showing example output below. Ask Marketing in the Chat tab why, or check server logs."}</div>}

          <div className="brain-ai-manager-section-label brain-ai-manager-section-label--green">Things working</div>
          {(analysis?.working ?? []).map((line, i) => (
            <div className="brain-insight-item brain-insight-item--green" key={i}>
              {line}
            </div>
          ))}

          <div className="brain-ai-manager-section-label brain-ai-manager-section-label--red">Problems need attention</div>
          {(analysis?.problems ?? []).map((line, i) => (
            <div className="brain-insight-item brain-insight-item--red" key={i}>
              {line}
            </div>
          ))}

          <div className="brain-ai-manager-section-label brain-ai-manager-section-label--gold">Recommendations</div>
          {(analysis?.recommendations ?? []).map((r) => (
            <RecommendationCard
              key={r.id}
              recommendation={r}
              permissions={permissions}
              onApprove={(id) => setRecStatus(id, "APPROVED")}
              onReject={(id) => setRecStatus(id, "REJECTED")}
              onExecute={execute}
              onAskAssistant={onAskAssistant}
              executing={!!executing[r.id]}
            />
          ))}
          {!loading && (analysis?.recommendations.length ?? 0) === 0 && <div className="brain-empty-note">No recommendations right now.</div>}
        </SectionCard>
      </div>

      <SectionCard accent="gold" className="brain-opportunities-card">
        <div className="brain-ai-manager-head">
          <span className="brain-status-dot brain-status-dot--gold" />
          <div className="brain-ai-manager-title">Growth Opportunities</div>
          <div className="brain-ai-manager-refresh" onClick={refreshOpportunities}>
            {opportunitiesLoading ? "Thinking…" : "Refresh"}
          </div>
        </div>
        {opportunitiesFallback && <div className="brain-modal-note">{"Live AI unavailable right now — showing example output below. Ask Marketing in the Chat tab why, or check server logs."}</div>}
        <div className="brain-opportunities-grid">
          {opportunities.map((o, i) => (
            <div className="brain-rec-card" key={i}>
              <div className="brain-rec-title">{o.title}</div>
              <div className="brain-opportunity-why">{o.why}</div>
              <div className="brain-opportunity-action">
                <b>Suggested action</b> {o.action}
              </div>
            </div>
          ))}
        </div>
        {!opportunitiesLoading && opportunities.length === 0 && <div className="brain-empty-note">No opportunities found right now.</div>}
      </SectionCard>
    </>
  );
}
