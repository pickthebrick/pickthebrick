"use client";

import type { MarketingRecommendation } from "@/lib/ai/marketingProvider";
import { ACTION_PERMISSIONS } from "@/lib/ai/actionPermissions";
import { Pill } from "../ui";

// Nicer labels for the payload/result fields callers actually use (see
// lib/ai/actionTools.ts's per-type payload shapes) - falls back to a
// camelCase-split guess for anything not listed here, so a new action type
// never renders as raw, unlabeled JSON.
const LABEL_OVERRIDES: Record<string, string> = {
  cta: "CTA",
  imageUrl: "Image",
  budgetAed: "Budget (AED/day)",
  dailyBudgetAed: "Daily budget (AED)",
  campaignId: "Campaign ID",
  adGroupId: "Ad group ID",
  postId: "Post ID",
  externalId: "External ID",
};

function formatKey(key: string): string {
  if (LABEL_OVERRIDES[key]) return LABEL_OVERRIDES[key];
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

// Renders every field of a payload/result JSON blob as a labeled row -
// "exactly what you're approving," not a summary. imageUrl is rendered
// separately as an actual <img> above this, so it's skipped here.
function PayloadFields({ json }: { json: string }) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return <div className="brain-rec-kv-row">{json}</div>;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const entries = Object.entries(parsed as Record<string, unknown>).filter(([k]) => k !== "imageUrl");
  if (!entries.length) return null;
  return (
    <>
      {entries.map(([k, v]) => (
        <div className="brain-rec-kv-row" key={k}>
          <span className="brain-rec-kv-key">{formatKey(k)}</span>
          <span className="brain-rec-kv-value">{formatValue(v)}</span>
        </div>
      ))}
    </>
  );
}

export default function RecommendationCard({
  recommendation: r,
  permissions,
  onApprove,
  onReject,
  onExecute,
  onAskAssistant,
  executing,
}: {
  recommendation: MarketingRecommendation;
  permissions: Record<string, string[]>;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onExecute: (id: string) => void;
  onAskAssistant?: () => void;
  executing?: boolean;
}) {
  const isAdvisory = r.type === "advisory";
  const requiredPermission = ACTION_PERMISSIONS[r.type];
  const permissionGranted = requiredPermission ? permissions[requiredPermission.tool]?.includes(requiredPermission.permission) : true;

  let imageUrl: string | null = null;
  if (r.requestPayloadJson) {
    try {
      const payload = JSON.parse(r.requestPayloadJson) as Record<string, unknown>;
      if (typeof payload.imageUrl === "string") imageUrl = payload.imageUrl;
    } catch {
      // malformed payload JSON - PayloadFields below shows the raw string
    }
  }

  return (
    <div className="brain-rec-card">
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

      {imageUrl && (
        <div className="brain-rec-image-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Generated concept visual" className="brain-rec-image" />
        </div>
      )}

      {r.requestPayloadJson && (
        <div className="brain-rec-kv">
          <div className="brain-rec-kv-label">What this will do</div>
          <PayloadFields json={r.requestPayloadJson} />
        </div>
      )}

      {r.resultJson && (
        <div className="brain-rec-kv brain-rec-kv--result">
          <div className="brain-rec-kv-label">Result</div>
          <PayloadFields json={r.resultJson} />
        </div>
      )}
      {r.error && <div className="brain-rec-error">{r.error}</div>}

      <div className="brain-rec-actions">
        {r.status === "RECOMMENDED" && (
          <>
            <div className="brain-btn brain-btn--primary brain-btn--small" onClick={() => onApprove(r.id)}>
              Approve
            </div>
            <div className="brain-btn brain-btn--small" onClick={() => onReject(r.id)}>
              Reject
            </div>
          </>
        )}
        {(r.status === "APPROVED" || r.status === "FAILED") && !isAdvisory && (
          <div
            className="brain-btn brain-btn--primary brain-btn--small"
            onClick={() => onExecute(r.id)}
            style={!permissionGranted ? { opacity: 0.6 } : undefined}
            title={!permissionGranted ? `Execute permission is off for ${requiredPermission?.tool} - this will fail until you turn it on in Approvals.` : undefined}
          >
            {executing ? "Executing…" : r.status === "FAILED" ? "Retry" : "Execute"}
          </div>
        )}
        {onAskAssistant && (
          <div className="brain-btn brain-btn--small" onClick={onAskAssistant}>
            Ask AI
          </div>
        )}
        {r.mock && (r.status === "EXECUTING" || r.status === "EXECUTED") && <Pill label="MOCK" tone="gold" />}
        <div className={`brain-rec-status ${r.status !== "RECOMMENDED" ? `brain-rec-status--${r.status.toLowerCase()}` : ""}`}>{r.status}</div>
      </div>
    </div>
  );
}
