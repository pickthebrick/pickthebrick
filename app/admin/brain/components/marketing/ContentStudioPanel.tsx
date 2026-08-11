"use client";

import { useState } from "react";
import { CONTENT_IDEAS, GEN_PLATFORMS, GEN_FORMATS, CALENDAR_DAY_NAMES, CALENDAR_PLAN, type CalendarStatus } from "../../data";
import { generateContentConcept, proposeContentConceptAction } from "@/app/actions/marketingAi";
import type { ContentConcept } from "@/lib/ai/marketingProvider";
import { SectionCard, Chip, Pill } from "../ui";

const CALENDAR_TONE: Record<CalendarStatus, "grey" | "gold" | "green" | "blue" | "coral"> = {
  Draft: "grey",
  Review: "gold",
  Approved: "green",
  Scheduled: "blue",
  Published: "coral",
};

export default function ContentStudioPanel() {
  const [platform, setPlatform] = useState<(typeof GEN_PLATFORMS)[number]>("Instagram");
  const [format, setFormat] = useState<(typeof GEN_FORMATS)[number]>("Reel");
  const [idea, setIdea] = useState<string | undefined>(undefined);
  const [output, setOutput] = useState<ContentConcept | null>(null);
  const [loading, setLoading] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [proposedId, setProposedId] = useState<string | null>(null);

  function generate(seedIdea?: string) {
    setLoading(true);
    setProposedId(null);
    generateContentConcept({ platform, format, idea: seedIdea ?? idea })
      .then(setOutput)
      .finally(() => setLoading(false));
  }

  function propose() {
    if (!output || proposedId || proposing) return;
    setProposing(true);
    proposeContentConceptAction({ platform, format, concept: output })
      .then((rec) => setProposedId(rec.id))
      .finally(() => setProposing(false));
  }

  return (
    <>
      <div className="brain-section-label">Content ideas</div>
      <div className="brain-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 22 }}>
        {CONTENT_IDEAS.map((c) => (
          <SectionCard key={c.idea}>
            <div className="brain-idea-source">{c.source}</div>
            <div className="brain-idea-text">{c.idea}</div>
            <div
              className="brain-btn brain-btn--small"
              onClick={() => {
                setIdea(c.idea);
                generate(c.idea);
              }}
            >
              Generate
            </div>
          </SectionCard>
        ))}
      </div>

      <div className="brain-grid" style={{ gridTemplateColumns: "1fr 1.4fr", marginBottom: 24 }}>
        <SectionCard title="Content Generator">
          <div className="brain-gen-label">Platform</div>
          <div className="brain-chip-row">
            {GEN_PLATFORMS.map((p) => (
              <Chip key={p} label={p} active={platform === p} onClick={() => setPlatform(p)} />
            ))}
          </div>
          <div className="brain-gen-label">Format</div>
          <div className="brain-chip-row">
            {GEN_FORMATS.map((f) => (
              <Chip key={f} label={f} active={format === f} onClick={() => setFormat(f)} />
            ))}
          </div>
          <div className="brain-btn brain-btn--primary brain-btn--block" onClick={() => generate()}>
            {loading ? "Generating…" : "Generate concept"}
          </div>
        </SectionCard>
        <SectionCard title={`${platform} · ${format} — generated concept`}>
          {!output && !loading && <div className="brain-empty-note">Pick a platform/format and generate a concept.</div>}
          {output && (
            <>
              {output.imageUrl && (
                <div className="brain-rec-image-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={output.imageUrl} alt="Generated concept visual" className="brain-rec-image" />
                </div>
              )}
              <div className="brain-gen-output-line">
                <b>Hook —</b> {output.hook}
              </div>
              <div className="brain-gen-output-line">
                <b>Visual —</b> {output.visual}
              </div>
              <div className="brain-gen-output-line">
                <b>Caption —</b> {output.caption}
              </div>
              <div className="brain-gen-output-line">
                <b>CTA —</b> {output.cta}
              </div>
              <div className="brain-modal-note">
                {output.fallback
                  ? "Live AI unavailable right now — showing example output. Ask Marketing in the Chat tab why, or check server logs."
                  : !output.imageUrl
                    ? "AI-generated — image generation unavailable right now, text only. Review before publishing."
                    : "AI-generated — review before publishing."}
              </div>
              {!output.fallback && (
                <div className="brain-btn brain-btn--primary brain-btn--small" style={{ marginTop: 10 }} onClick={propose}>
                  {proposing ? "Queuing…" : proposedId ? "Queued for approval ✓" : "Propose for approval"}
                </div>
              )}
            </>
          )}
        </SectionCard>
      </div>

      <div className="brain-section-label">Content calendar — this week</div>
      <div className="brain-grid" style={{ gridTemplateColumns: "repeat(7,1fr)" }}>
        {CALENDAR_DAY_NAMES.map((day, i) => (
          <div className="brain-card brain-calendar-cell" key={day}>
            <div className="brain-calendar-day">{day}</div>
            {CALENDAR_PLAN[i].map((status) => (
              <Pill key={status} label={status} tone={CALENDAR_TONE[status]} />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
