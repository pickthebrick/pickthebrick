"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { startDesignRequest } from "@/app/actions/design";
import { priceFor, type PackageKey } from "@/lib/designPricing";
import { featureItemsForTier } from "@/lib/packageFeatures";
import SiteFooter from "@/app/components/SiteFooter";
import SignInBar from "@/app/components/SignInBar";
import "../marketing.css";
import "../home.css";

const PACKAGE_ORDER: PackageKey[] = ["essential", "advanced", "premium"];

const PACKAGES: {
  key: PackageKey;
  name: string;
  icon: string;
  tagline: string;
  badge?: string;
}[] = [
  {
    key: "essential",
    name: "Essential",
    icon: "📐",
    tagline: "A solid, professional layout to get your space design-ready.",
  },
  {
    key: "advanced",
    name: "Advanced",
    icon: "🧊",
    tagline: "Everything in Essential, plus a 3D sketch to help you visualize the space.",
    badge: "Best seller",
  },
  {
    key: "premium",
    name: "Premium",
    icon: "✨",
    tagline: "Our full-service package - photorealistic views and a head start on Build.",
  },
];

export type PackageFeatureItemData = {
  id: string;
  label: string;
  description: string | null;
  minTier: PackageKey;
  sampleImageUrl: string | null;
};

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
  featureItems,
  isAnonymous,
  continueRequest,
}: {
  banner: AiDesignerBannerData;
  categories: { key: string; label: string }[];
  featureItems: PackageFeatureItemData[];
  isAnonymous: boolean;
  // Most recent draft/submitted DesignRequest for this actor, if any - the
  // banner deep-links into it instead of starting over. A submitted request
  // has already passed Spaces, so it goes straight to the layout generator
  // on Handover; a draft resumes at Spaces, same as MyQuotesClient's
  // "Continue this design" link.
  continueRequest: { id: string; status: "draft" | "submitted" | "in_progress" | "delivered" } | null;
}) {
  const router = useRouter();
  const [displayUnit, setDisplayUnit] = useState<"sqft" | "sqm">("sqft");
  const [sizeInput, setSizeInput] = useState("");
  const [selected, setSelected] = useState<PackageKey | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [openSample, setOpenSample] = useState<{ url: string; label: string } | null>(null);
  const [bannerNote, setBannerNote] = useState<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [selected]);

  function handleBannerClick() {
    if (!banner.enabled) return;
    if (continueRequest) {
      router.push(
        continueRequest.status === "submitted"
          ? `/design/handover?id=${continueRequest.id}`
          : `/design/spaces?id=${continueRequest.id}`
      );
      return;
    }
    setBannerNote(
      "Pick a package and size below to get started - once you've told us your rooms, you'll be able to draw your office and generate a starting layout."
    );
  }

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
      {isAnonymous && <SignInBar />}
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

        <div className="style-finder-banner">
          <div>
            <p className="style-finder-banner-text">Not sure of your style yet?</p>
            <p className="style-finder-banner-sub">Swipe through real office looks — takes 2 minutes.</p>
          </div>
          <Link href="/design/style-finder" className="style-finder-banner-cta">
            Find my style →
          </Link>
        </div>

        <div className="package-grid">
          {PACKAGES.map((pkg) => {
            const isSelected = selected === pkg.key;
            const price = sqftValid ? priceFor(pkg.key, sqft) : null;
            const features = featureItemsForTier(featureItems, pkg.key);
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
                  {features.map((f) => (
                    <li key={f.id}>
                      <span className="check">✓</span>
                      <span className="pkgfeat-label" tabIndex={0}>
                        {f.label}
                        {f.description && <span className="pkgfeat-tooltip">{f.description}</span>}
                      </span>
                      {f.sampleImageUrl && (
                        <button
                          type="button"
                          className="pkgfeat-sample-btn"
                          onClick={() => setOpenSample({ url: f.sampleImageUrl!, label: f.label })}
                          aria-label={`View sample image for ${f.label}`}
                          title="Sample"
                        >
                          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="package-size-row">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={1}
                    max={maxForUnit}
                    placeholder={displayUnit === "sqft" ? "e.g. 1500" : "e.g. 140"}
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    aria-label="Office size"
                  />
                  <div className="sqft-unit-toggle small">
                    {(["sqft", "sqm"] as const).map((u) => (
                      <button key={u} type="button" className={displayUnit === u ? "selected" : ""} onClick={() => handleUnitChange(u)}>
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="package-price-slot">
                  {price !== null ? (
                    <div className="package-price">
                      AED {price.toLocaleString()}
                      <span>total</span>
                    </div>
                  ) : (
                    <div className="package-price-hint">Enter your office size to see pricing</div>
                  )}
                </div>
                <button
                  type="button"
                  className={`package-cta ${isSelected ? "selected" : ""}`}
                  disabled={!sqftValid}
                  title={!sqftValid ? "Enter your office size first" : undefined}
                  onClick={() => setSelected(pkg.key)}
                >
                  {isSelected ? "Selected ✓" : `Select ${pkg.name}`}
                </button>
              </div>
            );
          })}

          {/* Entry point into the AI layout generator (see /design/handover's
              third option) - deep-links into an in-progress request if the
              actor has one, otherwise nudges them to start the flow below,
              since a room program from the Spaces step is required first.
              Copy is editable from the admin Marketing tab (AiDesignerBanner). */}
          {banner.enabled && (
            <div
              className="package-card ai-design-banner"
              role="button"
              tabIndex={0}
              style={{ background: banner.backgroundColor }}
              onClick={handleBannerClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleBannerClick();
              }}
            >
              <span className="ai-design-graffiti">{banner.headline}</span>
              <span className="ai-design-sub">{banner.subText}</span>
            </div>
          )}
        </div>

        {bannerNote && <p className="sqft-hint" style={{ textAlign: "center" }}>{bannerNote}</p>}

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
            <div className="design-summary" ref={summaryRef}>
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

      {openSample && (
        <div className="pkgfeat-lightbox-backdrop" onClick={() => setOpenSample(null)}>
          <div className="pkgfeat-lightbox" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="pkgfeat-lightbox-close" onClick={() => setOpenSample(null)} aria-label="Close">
              ✕
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={openSample.url} alt={openSample.label} />
            <div className="pkgfeat-lightbox-caption">{openSample.label}</div>
          </div>
        </div>
      )}
    </div>
  );
}
