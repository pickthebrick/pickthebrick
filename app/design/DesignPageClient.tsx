"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { startDesignRequest } from "@/app/actions/design";
import { priceFor, type PackageKey } from "@/lib/designPricing";
import SiteFooter from "@/app/components/SiteFooter";
import "../marketing.css";
import "../home.css";

const ESSENTIAL_FEATURES = [
  "Concept layout",
  "Revisions for final layout",
  "Furniture arrangement layout",
  "Full measurement & area statements (quantities)",
  "Electrical layout",
  "Reflected ceiling plan",
  "Color scheme mood board",
];
const ADVANCED_FEATURES = [...ESSENTIAL_FEATURES, "3D sketch"];
const PREMIUM_FEATURES = [
  ...ADVANCED_FEATURES,
  "Pre-approved discount on PTB Build",
  "Access to the Design Station",
  "3D photorealistic views for selected areas",
];

const PACKAGE_ORDER: PackageKey[] = ["essential", "advanced", "premium"];

const PACKAGES: {
  key: PackageKey;
  name: string;
  icon: string;
  tagline: string;
  features: string[];
  badge?: string;
}[] = [
  {
    key: "essential",
    name: "Essential",
    icon: "📐",
    tagline: "A solid, professional layout to get your space design-ready.",
    features: ESSENTIAL_FEATURES,
  },
  {
    key: "advanced",
    name: "Advanced",
    icon: "🧊",
    tagline: "Everything in Essential, plus a 3D sketch to help you visualize the space.",
    features: ADVANCED_FEATURES,
    badge: "Best seller",
  },
  {
    key: "premium",
    name: "Premium",
    icon: "✨",
    tagline: "Our full-service package - photorealistic views and a head start on Build.",
    features: PREMIUM_FEATURES,
  },
];

const SQM_TO_SQFT = 10.7639;
const MAX_SQFT = 10000;

export type AiDesignerBannerData = {
  headline: string;
  subText: string;
  popupMessage: string;
  backgroundColor: string;
  enabled: boolean;
};

export default function DesignPageClient({
  banner,
  categories,
}: {
  banner: AiDesignerBannerData;
  categories: { key: string; label: string }[];
}) {
  const router = useRouter();
  const [displayUnit, setDisplayUnit] = useState<"sqft" | "sqm">("sqft");
  const [sizeInput, setSizeInput] = useState("");
  const [selected, setSelected] = useState<PackageKey | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const sizeValue = parseFloat(sizeInput);
  const sqft = displayUnit === "sqft" ? sizeValue : sizeValue * SQM_TO_SQFT;
  const sqftValid = Number.isFinite(sqft) && sqft > 0 && sqft <= MAX_SQFT;
  const maxForUnit = displayUnit === "sqft" ? MAX_SQFT : Math.round(MAX_SQFT / SQM_TO_SQFT);

  function handleUnitChange(unit: "sqft" | "sqm") {
    if (unit === displayUnit) return;
    const current = parseFloat(sizeInput);
    if (Number.isFinite(current) && current > 0) {
      const converted = unit === "sqm" ? current / SQM_TO_SQFT : current * SQM_TO_SQFT;
      setSizeInput(String(Math.round(converted * 100) / 100));
    }
    setDisplayUnit(unit);
  }
  const selectedPrice = selected && sqftValid ? priceFor(selected, sqft) : null;
  const selectedPackage = PACKAGES.find((p) => p.key === selected) ?? null;

  const selectedIndex = selected ? PACKAGE_ORDER.indexOf(selected) : -1;
  const nextTierKey = selectedIndex >= 0 && selectedIndex < PACKAGE_ORDER.length - 1 ? PACKAGE_ORDER[selectedIndex + 1] : null;
  const nextTierPackage = nextTierKey ? PACKAGES.find((p) => p.key === nextTierKey) ?? null : null;
  const upsellDiff =
    nextTierKey && sqftValid && selectedPrice !== null ? (priceFor(nextTierKey, sqft) ?? 0) - selectedPrice : null;

  async function handleStart() {
    if (!selected || !sqftValid || starting) return;
    setStarting(true);
    setStartError(null);
    try {
      const id = await startDesignRequest(selected, Math.round(sqft));
      router.push(`/design/spaces?id=${id}`);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : "Could not start your design request");
      setStarting(false);
    }
  }

  return (
    <div className="ptb-marketing">
      <header>
        <Link href="/" className="brand-mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PickTheBrick" />
        </Link>
        <nav>
          <Link href="/">Home</Link>
          <a href="/build">Build</a>
        </nav>
      </header>
      <main>
        <div className="hero">
          <span className="hero-eyebrow">Design Packages</span>
          <h1>Design your office, the easy way</h1>
          <p>Tell us your office size, pick a package, and see your price instantly.</p>
        </div>

        <div className="sqft-input-card compact">
          <div className="sqft-input-row">
            <label htmlFor="sqft">
              <span className="sqft-icon">📏</span> Office size
            </label>
            <div className="sqft-input-with-unit">
              <input
                id="sqft"
                type="number"
                inputMode="decimal"
                min={1}
                max={maxForUnit}
                placeholder={displayUnit === "sqft" ? "e.g. 1500" : "e.g. 140"}
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
              />
              <div className="sqft-unit-toggle">
                {(["sqft", "sqm"] as const).map((u) => (
                  <button key={u} type="button" className={displayUnit === u ? "selected" : ""} onClick={() => handleUnitChange(u)}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
            {sizeInput.trim() !== "" && !sqftValid && (
              <span className="sqft-hint">Please enter a size between 1 and {maxForUnit.toLocaleString()} {displayUnit}.</span>
            )}
          </div>
        </div>

        <div className="package-grid">
          {PACKAGES.map((pkg) => {
            const isSelected = selected === pkg.key;
            const price = sqftValid ? priceFor(pkg.key, sqft) : null;
            return (
              <div
                key={pkg.key}
                className={`package-card tier-${pkg.key} ${isSelected ? "selected" : ""} ${pkg.badge ? "featured" : ""}`}
              >
                {pkg.badge && <span className="package-badge">{pkg.badge}</span>}
                <div className="package-icon">{pkg.icon}</div>
                <h3>{pkg.name}</h3>
                <p className="package-tagline">{pkg.tagline}</p>
                <ul className="package-features">
                  {pkg.features.map((f) => (
                    <li key={f}>
                      <span className="check">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="package-price-slot">
                  {price !== null ? (
                    <div className="package-price">
                      AED {price.toLocaleString()}
                      <span>total</span>
                    </div>
                  ) : (
                    <div className="package-price-hint">Enter your office size above to see pricing</div>
                  )}
                </div>
                <button
                  type="button"
                  className={`package-cta ${isSelected ? "selected" : ""}`}
                  disabled={!sqftValid}
                  title={!sqftValid ? "Enter your office size above first" : undefined}
                  onClick={() => setSelected(pkg.key)}
                >
                  {isSelected ? "Selected ✓" : `Select ${pkg.name}`}
                </button>
              </div>
            );
          })}

          {/* Not a real package - a joke banner, no PackageKey/pricing behind it.
              Clicking it never selects anything, just pokes fun at the idea.
              Copy is editable from the admin Marketing tab (AiDesignerBanner). */}
          {banner.enabled && (
            <div
              className="package-card ai-design-banner"
              role="button"
              tabIndex={0}
              aria-disabled="true"
              style={{ background: banner.backgroundColor }}
              onClick={() => alert(banner.popupMessage)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") alert(banner.popupMessage);
              }}
            >
              <span className="ai-design-graffiti">{banner.headline}</span>
              <span className="ai-design-sub">{banner.subText}</span>
            </div>
          )}
        </div>

        {selectedPackage && selectedPrice !== null && (
          <>
            {nextTierPackage && upsellDiff !== null && upsellDiff > 0 && (
              <div className="design-upsell">
                💡 For just <b>AED {upsellDiff.toLocaleString()}</b> more, upgrade to the{" "}
                <b>{nextTierPackage.name}</b> package
                <button type="button" className="design-upsell-btn" onClick={() => setSelected(nextTierKey)}>
                  Upgrade
                </button>
              </div>
            )}
            <div className="design-summary">
              <div>
                <div className="design-summary-label">
                  {selectedPackage.name} package &middot; {Math.round(sqft).toLocaleString()} sqft
                </div>
                <div className="design-summary-price">AED {selectedPrice.toLocaleString()}</div>
              </div>
              <button className="design-start-btn" onClick={handleStart} disabled={starting}>
                {starting ? "Starting…" : "Start Design →"}
              </button>
            </div>
            {startError && <p className="sqft-hint" style={{ textAlign: "right" }}>{startError}</p>}
          </>
        )}
      </main>

      <SiteFooter categories={categories} />
    </div>
  );
}
