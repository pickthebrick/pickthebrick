"use client";

import { useEffect, useState } from "react";
import { getChannelInsightsAction, refreshChannelInsightsAction } from "@/app/actions/marketingAi";
import type { MarketingChannel } from "@/lib/marketingState";
import { SectionCard } from "../ui";

// The Performance Analyst's per-channel take - used by Google Ads, Meta, and
// Website & Analytics, each just passing their own channel key. Replaces
// what used to be a static GOOGLE_INSIGHTS/META_INSIGHTS/CONVERSION_INSIGHTS
// array with a live (or graceful-fallback) analysis, refreshable on demand.
const TITLES: Record<MarketingChannel, string> = {
  google: "What is Google Ads telling us?",
  meta: "Content patterns",
  website: "Why aren't visitors converting?",
};

export default function ChannelInsights({ channel }: { channel: MarketingChannel }) {
  const [insights, setInsights] = useState<string[]>([]);
  const [fallback, setFallback] = useState(true);
  const [loading, setLoading] = useState(true);

  function apply(r: { insights: string[]; fallback: boolean }) {
    setInsights(r.insights);
    setFallback(r.fallback);
  }

  useEffect(() => {
    getChannelInsightsAction(channel)
      .then(apply)
      .finally(() => setLoading(false));
  }, [channel]);

  function refresh() {
    setLoading(true);
    refreshChannelInsightsAction(channel)
      .then(apply)
      .finally(() => setLoading(false));
  }

  return (
    <SectionCard accent="gold">
      <div className="brain-ai-manager-head">
        <span className="brain-status-dot brain-status-dot--gold" />
        <div className="brain-insight-title brain-insight-title--flush">{TITLES[channel]}</div>
        <div className="brain-ai-manager-refresh" onClick={refresh}>
          {loading ? "Thinking…" : "Refresh (Performance Analyst)"}
        </div>
      </div>
      {fallback && <div className="brain-modal-note">{"OPENAI_API_KEY isn't set yet — showing example output below."}</div>}
      <div className="brain-insight-list">
        {insights.map((line, i) => (
          <div className="brain-insight-item" key={i}>
            {line}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
