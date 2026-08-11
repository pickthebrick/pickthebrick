"use client";

import { useEffect, useState } from "react";
import { getReportsAction, generateReportAction } from "@/app/actions/marketingAi";
import { SectionCard, Pill } from "../ui";

type ReportRow = { id: string; period: string; content: string; fallback: boolean; createdAt: Date };

export default function ReportingManagerPanel() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<"daily" | "weekly" | null>(null);

  function load() {
    getReportsAction()
      .then(setReports)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function generate(period: "daily" | "weekly") {
    setGenerating(period);
    generateReportAction(period).finally(() => {
      setGenerating(null);
      load();
    });
  }

  return (
    <>
      <div className="brain-rec-actions" style={{ marginBottom: 16 }}>
        <div className="brain-btn brain-btn--primary" onClick={() => generate("daily")}>
          {generating === "daily" ? "Writing…" : "Generate daily report"}
        </div>
        <div className="brain-btn" onClick={() => generate("weekly")}>
          {generating === "weekly" ? "Writing…" : "Generate weekly report"}
        </div>
      </div>

      {loading && <div className="brain-empty-note">Loading…</div>}
      {!loading && reports.length === 0 && <div className="brain-empty-note">No reports yet - generate one above.</div>}

      {reports.map((r) => (
        <SectionCard key={r.id} className="brain-report-card">
          <div className="brain-report-head">
            <Pill label={r.period === "daily" ? "Daily" : "Weekly"} tone="gold" />
            <span className="brain-report-date">{new Date(r.createdAt).toLocaleString()}</span>
          </div>
          <div className="brain-report-content">{r.content}</div>
          {r.fallback && <div className="brain-modal-note">{"OPENAI_API_KEY isn't set yet — this is example output."}</div>}
        </SectionCard>
      ))}
    </>
  );
}
