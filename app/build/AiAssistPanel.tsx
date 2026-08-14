"use client";

import { useState } from "react";
import {
  generateAiAssistSuggestions,
  getAiAssistDesignSurveyDefaults,
  recordAiAssistAcceptance,
  type AiAssistResult,
  type AiAssistSpaceInput,
  type AiAssistSuggestion,
  type AiAssistTier,
} from "@/app/actions/aiAssist";
import type { CartLine } from "@/lib/quotes";
import { SPACES, PACKAGE_LABELS } from "@/lib/spaces";
import { STYLE_FINDER_STYLES } from "@/lib/styleFinder";

type Step = "intake" | "loading" | "results";

const SQM_TO_SQFT = 10.7639;

// Same parse as QuoteDetailsModal's officeSize string ("2,500 sqft" / "500
// sqm") - kept in sync with that one so a size already saved on the quote
// shows up here in the same unit instead of silently re-interpreting it.
function parseOfficeSize(value: string): { size: string; unit: "sqft" | "sqm" } {
  const match = value.trim().match(/^([\d,]+(?:\.\d+)?)\s*(sqm|sqft)?/i);
  if (!match) return { size: "", unit: "sqft" };
  const unit = match[2]?.toLowerCase() === "sqm" ? "sqm" : "sqft";
  return { size: match[1].replace(/,/g, ""), unit };
}

export default function AiAssistPanel({
  quoteId,
  quoteLocation,
  quoteOfficeSize,
  onSaveDetails,
  onAddLines,
  onClose,
}: {
  quoteId: string;
  // The quote's own location/size (see BuildClient's location/officeSize
  // state, set via QuoteDetailsModal) - prefills this form with whatever's
  // already there, in the same unit, so the two don't ask the same question
  // twice in different units.
  quoteLocation: string;
  quoteOfficeSize: string;
  // Saves location/size back onto the quote itself (BuildClient's
  // saveQuoteDetails) - filling this in here also fills in "Add details" on
  // the main build page, instead of asking for it a second time there.
  onSaveDetails: (location: string, officeSize: string) => Promise<void>;
  onAddLines: (lines: CartLine[]) => Promise<void>;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("intake");
  const [location, setLocation] = useState(quoteLocation);
  const [sizeValue, setSizeValue] = useState(() => parseOfficeSize(quoteOfficeSize).size);
  const [sizeUnit, setSizeUnit] = useState<"sqft" | "sqm">(() => parseOfficeSize(quoteOfficeSize).unit);
  const [spaceQty, setSpaceQty] = useState<Record<string, number>>({});
  const [styleKey, setStyleKey] = useState<string>("");
  const [tier, setTier] = useState<AiAssistTier>("advanced");
  const [surveyNote, setSurveyNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<AiAssistResult | null>(null);
  const [included, setIncluded] = useState<Record<string, boolean>>({});
  const [swapped, setSwapped] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);

  async function handleUseSurvey() {
    setSurveyNote(null);
    const defaults = await getAiAssistDesignSurveyDefaults();
    if (!defaults) {
      setSurveyNote("No Design survey or Style Finder result found yet on this account - fill this in manually instead.");
      return;
    }
    // DesignRequest.sqft is always stored in sqft (see lib/designPricing.ts) -
    // switching the unit here too keeps the pulled-in value honest instead of
    // dropping a sqft number into a field the client had set to sqm.
    if (defaults.officeSize) {
      setSizeUnit("sqft");
      setSizeValue(String(Math.round(defaults.officeSize)));
    }
    if (defaults.tier) setTier(defaults.tier as AiAssistTier);
    if (defaults.styleKey) setStyleKey(defaults.styleKey);
    if (defaults.spaces.length > 0) {
      const next: Record<string, number> = {};
      for (const s of defaults.spaces) next[s.spaceKey] = s.qty;
      setSpaceQty(next);
    }
    setSurveyNote("Pulled in your Design survey and Style profile answers.");
  }

  function changeSpaceQty(key: string, delta: number) {
    setSpaceQty((prev) => ({ ...prev, [key]: Math.max(0, (prev[key] ?? 0) + delta) }));
  }

  function changeSizeUnit(next: "sqft" | "sqm") {
    if (next === sizeUnit) return;
    const current = parseFloat(sizeValue);
    if (Number.isFinite(current) && current > 0) {
      const converted = next === "sqm" ? current / SQM_TO_SQFT : current * SQM_TO_SQFT;
      setSizeValue(String(Math.round(converted * 100) / 100));
    }
    setSizeUnit(next);
  }

  async function handleGenerate() {
    setError(null);
    const spaces: AiAssistSpaceInput[] = Object.entries(spaceQty)
      .filter(([, qty]) => qty > 0)
      .map(([spaceKey, qty]) => ({ spaceKey, qty }));
    const enteredSize = parseFloat(sizeValue);
    if (!Number.isFinite(enteredSize) || enteredSize <= 0) {
      setError("Enter an office size to continue.");
      return;
    }
    if (!location.trim()) {
      setError("Enter an office location to continue.");
      return;
    }
    // The formulas in app/actions/aiAssist.ts work in sqm regardless of which
    // unit the client entered here.
    const officeSizeSqm = sizeUnit === "sqm" ? enteredSize : enteredSize / SQM_TO_SQFT;
    setStep("loading");
    try {
      // Saves onto the quote itself so "Add details" on the main build page
      // reflects it too - filling this in here shouldn't mean filling it in
      // again there.
      await onSaveDetails(location.trim(), `${enteredSize.toLocaleString()} ${sizeUnit}`);
      const res = await generateAiAssistSuggestions({
        quoteId,
        officeSize: officeSizeSqm,
        spaces,
        styleKey: styleKey || null,
        tier,
        source: surveyNote?.startsWith("Pulled") ? "designSurvey" : "manual",
      });
      setResult(res);
      const nextIncluded: Record<string, boolean> = {};
      for (const s of res.suggestions) nextIncluded[s.categoryKey] = true;
      setIncluded(nextIncluded);
      setSwapped({});
      setStep("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate suggestions");
      setStep("intake");
    }
  }

  function resolvedLine(s: AiAssistSuggestion): CartLine {
    if (swapped[s.categoryKey] && s.swap) {
      return {
        productId: s.swap.productId,
        name: s.swap.name,
        categoryLabel: s.categoryLabel,
        typeLabel: s.swap.typeLabel,
        subtypeLabel: s.swap.subtypeLabel,
        rate: s.swap.rate,
        unit: s.swap.unit,
        qty: s.qty,
      };
    }
    return {
      productId: s.productId,
      name: s.name,
      categoryLabel: s.categoryLabel,
      typeLabel: s.typeLabel,
      subtypeLabel: s.subtypeLabel,
      rate: s.rate,
      unit: s.unit,
      qty: s.qty,
    };
  }

  async function handleAdd() {
    if (!result) return;
    const lines = result.suggestions.filter((s) => included[s.categoryKey]).map(resolvedLine);
    if (lines.length === 0) return;
    setAdding(true);
    setError(null);
    try {
      recordAiAssistAcceptance(
        result.sessionId,
        // AI Assist only ever suggests real catalog products, so every line
        // here always has a productId.
        lines.map((l) => l.productId!)
      ).catch(() => {});
      // Only closes once every item is confirmed saved - see
      // handleAiAssistAddLines in BuildClient.tsx for why this must be
      // awaited rather than fired-and-forgotten. On failure the panel stays
      // open with the suggestions still checked, so re-clicking retries
      // (upsert is idempotent - already-saved items are just rewritten).
      await onAddLines(lines);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add these items to your quote - please try again.");
    } finally {
      setAdding(false);
    }
  }

  const includedCount = result ? result.suggestions.filter((s) => included[s.categoryKey]).length : 0;
  const includedTotal = result
    ? result.suggestions.filter((s) => included[s.categoryKey]).reduce((sum, s) => sum + resolvedLine(s).rate * s.qty, 0)
    : 0;

  return (
    <div className="ai-assist-overlay" onClick={onClose}>
      <div className="ai-assist-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ai-assist-modal-head">
          <div className="ai-assist-modal-title">AI Assist</div>
          <button className="ai-assist-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {step === "intake" && (
          <div className="ai-assist-body">
            <p className="ai-assist-lede">
              Tell us about the office and we&apos;ll draft a starting quote from the current catalog - review and
              adjust everything before it&apos;s added.
            </p>

            <button type="button" className="ai-assist-survey-btn" onClick={handleUseSurvey}>
              Use my Design survey + Style profile answers
            </button>
            {surveyNote && <div className="ai-assist-survey-note">{surveyNote}</div>}

            <label className="ai-assist-field">
              <span>Office location</span>
              <input
                type="text"
                placeholder="e.g. Business Bay, Dubai"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </label>

            <div className="ai-assist-field">
              <span>Office size</span>
              <div className="qty-unit-input">
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={0}
                  placeholder={sizeUnit === "sqft" ? "e.g. 2500" : "e.g. 230"}
                  value={sizeValue}
                  onChange={(e) => setSizeValue(e.target.value)}
                />
                <div className="qty-unit-toggle">
                  {(["sqft", "sqm"] as const).map((u) => (
                    <button key={u} type="button" className={sizeUnit === u ? "selected" : ""} onClick={() => changeSizeUnit(u)}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="ai-assist-field">
              <span>Spaces</span>
              <div className="ai-assist-space-grid">
                {SPACES.map((s) => (
                  <div key={s.key} className="ai-assist-space-row">
                    <span>{s.label}</span>
                    <div className="ai-assist-stepper">
                      <button type="button" onClick={() => changeSpaceQty(s.key, -1)}>
                        &minus;
                      </button>
                      <span>{spaceQty[s.key] ?? 0}</span>
                      <button type="button" onClick={() => changeSpaceQty(s.key, 1)}>
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <label className="ai-assist-field">
              <span>Preferred style (optional)</span>
              <select value={styleKey} onChange={(e) => setStyleKey(e.target.value)}>
                <option value="">No preference</option>
                {STYLE_FINDER_STYLES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="ai-assist-field">
              <span>Package tier</span>
              <select value={tier} onChange={(e) => setTier(e.target.value as AiAssistTier)}>
                {Object.entries(PACKAGE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            {error && <div className="ai-assist-error">{error}</div>}

            <button type="button" className="ai-assist-generate-btn" onClick={handleGenerate}>
              Generate my quote &rarr;
            </button>
          </div>
        )}

        {step === "loading" && (
          <div className="ai-assist-body ai-assist-loading">
            <div className="ai-assist-spinner" />
            Matching this brief against the catalog...
          </div>
        )}

        {step === "results" && result && (
          <div className="ai-assist-body">
            {!result.usedAi && (
              <div className="ai-assist-notice">
                Showing our top catalog matches per category for now - full AI styling will kick in once the
                assistant is fully configured.
              </div>
            )}
            {result.emptyCategories.length > 0 && (
              <div className="ai-assist-notice">
                Not in the catalog yet, so skipped: {result.emptyCategories.join(", ")}.
              </div>
            )}

            <div className="ai-assist-suggestion-list">
              {result.suggestions.map((s) => {
                const isOn = included[s.categoryKey];
                const isSwapped = swapped[s.categoryKey];
                const line = resolvedLine(s);
                return (
                  <div key={s.categoryKey} className={`ai-assist-suggestion ${isOn ? "" : "excluded"}`}>
                    <label className="ai-assist-suggestion-check">
                      <input
                        type="checkbox"
                        checked={isOn}
                        onChange={(e) => setIncluded((prev) => ({ ...prev, [s.categoryKey]: e.target.checked }))}
                      />
                    </label>
                    <div className="ai-assist-suggestion-main">
                      <div className="ai-assist-suggestion-top">
                        <span className="ai-assist-suggestion-cat">{s.categoryLabel}</span>
                        <span className="ai-assist-suggestion-name">{line.name}</span>
                      </div>
                      <div className="ai-assist-suggestion-meta">
                        {line.typeLabel} / {line.subtypeLabel} &middot; x{s.qty} &middot; AED{" "}
                        {(line.rate * s.qty).toLocaleString()}
                      </div>
                      <div className="ai-assist-suggestion-rationale">{isSwapped ? "Swapped alternative." : s.rationale}</div>
                    </div>
                    {s.swap && (
                      <button
                        type="button"
                        className="ai-assist-swap-btn"
                        onClick={() => setSwapped((prev) => ({ ...prev, [s.categoryKey]: !prev[s.categoryKey] }))}
                      >
                        {isSwapped ? "Use original" : `Swap → ${s.swap.name}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {error && <div className="ai-assist-error">{error}</div>}

            <div className="ai-assist-footer">
              <div className="ai-assist-footer-total">
                {includedCount} item{includedCount !== 1 ? "s" : ""} &middot; AED {includedTotal.toLocaleString()}
              </div>
              <div className="ai-assist-footer-actions">
                <button type="button" className="ai-assist-back-btn" onClick={() => setStep("intake")}>
                  &larr; Edit brief
                </button>
                <button type="button" className="ai-assist-add-btn" disabled={adding || includedCount === 0} onClick={handleAdd}>
                  {adding ? "Adding..." : `Add ${includedCount} item${includedCount !== 1 ? "s" : ""} to quote`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
