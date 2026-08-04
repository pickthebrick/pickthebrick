"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DesignStepper from "./DesignStepper";
import { startDesignRequest } from "@/app/actions/design";
import "../marketing.css";

type PackageKey = "essential" | "advanced" | "premium";

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

// Pricing slabs are intentionally not shown to the client - only the
// resulting price for their entered size + chosen package.
function essentialPrice(sqft: number): number | null {
  if (!Number.isFinite(sqft) || sqft <= 0) return null;
  if (sqft <= 1000) return 400;
  if (sqft <= 2000) return 800;
  if (sqft <= 3000) return 1200;
  if (sqft <= 10000) return 2000;
  return null;
}

function priceFor(key: PackageKey, sqft: number): number | null {
  const base = essentialPrice(sqft);
  if (base === null) return null;
  if (key === "essential") return base;
  if (key === "advanced") return base + 300;
  return base + 300 + 800;
}

export default function DesignPage() {
  const router = useRouter();
  const [sqftInput, setSqftInput] = useState("");
  const [selected, setSelected] = useState<PackageKey | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const sqft = parseFloat(sqftInput);
  const sqftValid = Number.isFinite(sqft) && sqft > 0 && sqft <= 10000;
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
        <DesignStepper current={0} />
        <div className="hero">
          <span className="hero-eyebrow">Design Packages</span>
          <h1>Design your office, the easy way</h1>
          <p>Tell us your office size, pick a package, and see your price instantly.</p>
        </div>

        <div className="sqft-input-card">
          <div className="sqft-input-row">
            <label htmlFor="sqft">
              <span className="sqft-icon">📏</span> Office size (sqft)
            </label>
            <input
              id="sqft"
              type="number"
              min={1}
              max={10000}
              placeholder="e.g. 1500"
              value={sqftInput}
              onChange={(e) => {
                setSqftInput(e.target.value);
              }}
            />
            {sqftInput.trim() !== "" && !sqftValid && (
              <span className="sqft-hint">Please enter a size between 1 and 10,000 sqft.</span>
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
    </div>
  );
}
