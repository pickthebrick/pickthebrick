"use client";

import { useEffect, useState } from "react";
import { MARKETING_KPIS, QUEUE_ITEMS } from "../../data";
import {
  getMarketingAnalysis,
  refreshMarketingAnalysis,
  setRecommendationStatusAction,
  getMarketingWorkspaceState,
  approveQueueItemAction,
} from "@/app/actions/marketingAi";
import type { MarketingAnalysis } from "@/lib/ai/marketingProvider";
import { KpiGrid, SectionCard } from "../ui";

export default function OverviewPanel({ onAskAssistant }: { onAskAssistant: () => void }) {
  const [analysis, setAnalysis] = useState<MarketingAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [queueApprovals, setQueueApprovals] = useState<Record<string, "Approved">>({});

  function fetchAll() {
    Promise.all([getMarketingAnalysis(), getMarketingWorkspaceState()])
      .then(([a, state]) => {
        setAnalysis(a);
        setQueueApprovals(state.queueApprovals);
      })
      .finally(() => setLoading(false));
  }

  function refresh() {
    setLoading(true);
    refreshMarketingAnalysis()
      .then(setAnalysis)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchAll();
  }, []);

  function setRecStatus(id: string, status: "Approved" | "Rejected") {
    setAnalysis((cur) => (cur ? { ...cur, recommendations: cur.recommendations.map((r) => (r.id === id ? { ...r, status } : r)) } : cur));
    setRecommendationStatusAction(id, status);
  }

  function approveQueue(id: string) {
    setQueueApprovals((s) => ({ ...s, [id]: "Approved" }));
    approveQueueItemAction(id);
  }

  return (
    <>
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

          {analysis?.fallback && <div className="brain-modal-note">{"OPENAI_API_KEY isn't set yet — showing example output below."}</div>}

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
            <div className="brain-rec-card" key={r.id}>
              <div className="brain-rec-title">{r.title}</div>
              <div className="brain-rec-tags">
                <div>
                  <b>Why</b> {r.why}
                </div>
                <div>
                  <b>Impact</b> {r.impact}
                </div>
                <div>
                  <b>Risk</b> {r.risk}
                </div>
              </div>
              <div className="brain-rec-actions">
                <div className="brain-btn brain-btn--primary brain-btn--small" onClick={() => setRecStatus(r.id, "Approved")}>
                  Approve
                </div>
                <div className="brain-btn brain-btn--small" onClick={() => setRecStatus(r.id, "Rejected")}>
                  Reject
                </div>
                <div className="brain-btn brain-btn--small">Modify</div>
                <div className="brain-btn brain-btn--small" onClick={onAskAssistant}>
                  Ask AI
                </div>
                <div className={`brain-rec-status ${r.status !== "Awaiting review" ? `brain-rec-status--${r.status.toLowerCase()}` : ""}`}>
                  {r.status}
                </div>
              </div>
            </div>
          ))}
          {!loading && (analysis?.recommendations.length ?? 0) === 0 && <div className="brain-empty-note">No recommendations right now.</div>}
        </SectionCard>

        <SectionCard title="AI Action Queue — Today">
          {QUEUE_ITEMS.map((q) => {
            const approved = queueApprovals[q.id] === "Approved";
            const priorityTone = q.priority === "HIGH" ? "red" : q.priority === "MEDIUM" ? "gold" : "green";
            return (
              <div className="brain-queue-card" key={q.id}>
                <div className="brain-queue-head">
                  <span className={`brain-status-dot brain-status-dot--${priorityTone}`} />
                  <span className={`brain-queue-priority brain-queue-priority--${priorityTone}`}>{q.priority}</span>
                  <span className="brain-queue-channel">{q.channel}</span>
                </div>
                <div className="brain-queue-title">{q.title}</div>
                <div className="brain-queue-metric">{q.metric}</div>
                <div className="brain-queue-actions">
                  <div className="brain-btn brain-btn--small">Review</div>
                  <div
                    className={`brain-btn brain-btn--small ${approved ? "" : "brain-btn--primary"}`}
                    onClick={() => approveQueue(q.id)}
                  >
                    {approved ? "Approved" : "Approve"}
                  </div>
                </div>
              </div>
            );
          })}
        </SectionCard>
      </div>
    </>
  );
}
