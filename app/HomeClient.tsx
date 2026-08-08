"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { DesignPathIcon, BuildPathIcon } from "./components/HomeIllustrations";
import HeroQuoteDemo from "./components/HeroQuoteDemo";
import ParallaxCtaBand from "./components/ParallaxCtaBand";
import CategoryArt from "./components/CategoryArt";
import SiteFooter from "./components/SiteFooter";
import "./marketing.css";
import "./home.css";

const VALUE_PROPS = [
  {
    title: "All-inclusive pricing",
    body: "Every rate shown already includes installation - no separate install line item to negotiate later.",
  },
  {
    title: "One Project Manager, everything handled",
    body: "A single dedicated Project Manager manages everything on your job - every contractor, every trade, one shared timeline.",
  },
  {
    title: "Vetted contractor network",
    body: "Every contractor is approved per trade category before they're ever matched to a project.",
  },
  {
    title: "Design through to move-in",
    body: "Start with a concept or go straight to a priced quote - both paths live on the same platform.",
  },
];

const PROCESS_STEPS = [
  { title: "Tell us about your office", body: "Area, location, people, requirements" },
  { title: "Configure your workspace", body: "Rooms, furniture, finishes, services" },
  { title: "Get your design", body: "Professional layout + visualisation" },
  { title: "Know your cost", body: "Transparent itemized estimate" },
  { title: "Approve", body: "Confirm scope and pricing" },
  { title: "We build it", body: "Vetted contractors, one Project Manager" },
];

const WHY_CARDS = [
  { icon: "⚡", title: "Speed", body: "Professional layout in 48 hours, not weeks of back-and-forth." },
  { icon: "👁", title: "Transparency", body: "Know your indicative cost early - before you commit to anything." },
  { icon: "✓", title: "Quality", body: "Specified brands, warrantied work, vetted contractors only." },
  { icon: "🤝", title: "Accountability", body: "One platform, one Project Manager, from design through construction." },
];

const CASE_STUDIES = [
  {
    tag: "Technology Company · Dubai",
    title: "2,800 sqft office fit-out",
    stats: [
      ["42", "employees"],
      ["48 hrs", "design"],
      ["19 days", "fit-out"],
      ["AED 890K", "budget"],
    ],
  },
  {
    tag: "Professional Services · DIFC",
    title: "1,800 sqft office fit-out",
    stats: [
      ["28", "employees"],
      ["36 hrs", "design"],
      ["14 days", "fit-out"],
      ["AED 610K", "budget"],
    ],
  },
  {
    tag: "Logistics Firm · JAFZA",
    title: "4,200 sqft office fit-out",
    stats: [
      ["65", "employees"],
      ["48 hrs", "design"],
      ["26 days", "fit-out"],
      ["AED 1.4M", "budget"],
    ],
  },
];

function estimateRange(sqft: number, people: number) {
  const base = sqft * 210 + people * 2500;
  const low = Math.round((base * 0.92) / 1000) * 1000;
  const high = Math.round((base * 1.15) / 1000) * 1000;
  return { low, high };
}

type CaseStudyCard = { id: string; imageUrl: string | null; buttonLabel: string; buttonUrl: string };

export default function HomeClient({
  isClientSession,
  categories,
  caseStudyCards,
}: {
  isClientSession: boolean;
  categories: { key: string; label: string; imageUrl: string | null }[];
  caseStudyCards: CaseStudyCard[];
}) {
  const [estSqft, setEstSqft] = useState(1000);
  const [estPeople, setEstPeople] = useState(12);
  const { low: estLow, high: estHigh } = estimateRange(estSqft, estPeople);

  return (
    <div className="ptb-marketing">
      <header>
        <Link href="/" className="brand-mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PickTheBrick" />
        </Link>
        <nav>
          <a href="#how-it-works">How it works</a>
          <a href="#categories">Categories</a>
          {!isClientSession && (
            <a href="#partner" className="nav-partner-btn">
              Partner with us
            </a>
          )}
          <Link href="/build" className="home-header-cta">
            Build My Quote
          </Link>
        </nav>
      </header>

      <main className="home-main">
        <div className="home-page">
          {/* ---------- hero ---------- */}
          <section className="home-hero">
            <div className="home-hero-grid">
              <div className="home-hero-content">
                <span className="home-hero-eyebrow">Dubai&apos;s Office Fit-Out Marketplace</span>
                <h1 className="home-hero-title">
                  Price your entire office fit-out — <span className="accent">instantly.</span>
                </h1>
                <p className="home-hero-sub">
                  Partitions, flooring, ceilings, electrical, and more. Pick your products, get a live itemized
                  quote, and a dedicated Project Manager takes it from there.
                </p>
                <div className="home-hero-cta-row">
                  <Link href="/build" className="home-hero-cta-primary">
                    Build My Quote →
                  </Link>
                  <Link href="/design" className="home-hero-cta-secondary">
                    Not sure where to start? Get a design concept
                  </Link>
                </div>
                <p className="home-hero-microcopy">No account needed to get a price · 10 trades, one platform</p>
              </div>

              <HeroQuoteDemo />
            </div>

            <a href="#how-it-works" className="home-scroll-cue">
              See how it works
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </section>

          {/* ---------- isometric office image ---------- */}
          <section className="home-iso-section">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/isometric-office.png"
              alt="Isometric illustration of a PickTheBrick crew fitting out an office"
              className="home-iso-img"
            />
          </section>

          {/* ---------- how it works / process ---------- */}
          <section className="home-section tight" id="how-it-works">
            <div className="home-section-inner">
              <div className="home-section-head">
                <div className="home-section-eyebrow">How it works</div>
                <h2 className="home-section-title">Design → Price → Build</h2>
                <p className="home-section-body">
                  One platform, guided end to end - not six phone calls to six different contractors.
                </p>
              </div>
              <div className="home-process-flow">
                {PROCESS_STEPS.map((step, i) => (
                  <Fragment key={step.title}>
                    <div className="home-proc-step">
                      <div className="home-proc-num">{i + 1}</div>
                      <div className="home-proc-title">{step.title}</div>
                      <div className="home-proc-body">{step.body}</div>
                    </div>
                    {i < PROCESS_STEPS.length - 1 && <div className="home-proc-arrow">→</div>}
                  </Fragment>
                ))}
              </div>
            </div>
          </section>

          {/* ---------- instant estimator ---------- */}
          <section className="home-section tight">
            <div className="home-section-inner">
              <div className="home-section-head">
                <div className="home-section-eyebrow">Get a feel for it</div>
                <h2 className="home-section-title">How much, roughly?</h2>
                <p className="home-section-body">
                  Move the sliders - this is a ballpark, not a quote. The real one takes about 5 minutes on Build.
                </p>
              </div>
              <div className="home-estimator">
                <div className="home-estimator-head">
                  <div className="home-estimator-title">Instant estimate</div>
                  <div className="home-estimator-live">
                    <span className="hero-demo-pulse" />
                    Live preview
                  </div>
                </div>
                <div className="home-estimator-row">
                  <label>
                    Office size <span>{estSqft.toLocaleString()} sqft</span>
                  </label>
                  <input
                    type="range"
                    min={500}
                    max={8000}
                    step={100}
                    value={estSqft}
                    onChange={(e) => setEstSqft(Number(e.target.value))}
                  />
                </div>
                <div className="home-estimator-row">
                  <label>
                    Number of people <span>{estPeople}</span>
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={150}
                    step={1}
                    value={estPeople}
                    onChange={(e) => setEstPeople(Number(e.target.value))}
                  />
                </div>
                <div className="home-estimator-result">
                  <div>
                    <div className="label">Estimated fit-out cost</div>
                    <div className="range">
                      AED {estLow.toLocaleString()} – {estHigh.toLocaleString()}
                    </div>
                  </div>
                  <Link href="/build" className="home-estimator-go">
                    Get exact quote →
                  </Link>
                </div>
              </div>
              <p className="home-estimator-microcopy">
                No account needed for this estimate · Full itemized quote takes ~5 minutes
              </p>
            </div>
          </section>

          {/* ---------- weeks vs days ---------- */}
          <section className="home-section tight">
            <div className="home-section-inner">
              <div className="home-section-head">
                <div className="home-section-eyebrow">The difference</div>
                <h2 className="home-section-title">Weeks, or days?</h2>
                <p className="home-section-body">Same outcome. Radically different timeline.</p>
              </div>
              <div className="home-race">
                <div className="home-race-row">
                  <div className="home-race-label">
                    <span>Traditional fit-out</span>
                    <span>Site visit → Design → Revisions → BOQ → Quote → Negotiate</span>
                  </div>
                  <div className="home-race-track">
                    <div className="home-race-fill slow">Multiple contractors, endless back-and-forth</div>
                    <div className="home-race-time">2–4 weeks</div>
                  </div>
                </div>
                <div className="home-race-row">
                  <div className="home-race-label">
                    <span>PickTheBrick</span>
                    <span>Configure → Design → Price → Build</span>
                  </div>
                  <div className="home-race-track">
                    <div className="home-race-fill fast">One platform, guided configuration</div>
                    <div className="home-race-time">2–4 days</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ---------- why choose us ---------- */}
          <section className="home-section tight">
            <div className="home-section-inner">
              <div className="home-section-head">
                <div className="home-section-eyebrow">Why PickTheBrick</div>
                <h2 className="home-section-title">Four real reasons, not one repeated</h2>
              </div>
              <div className="home-why-grid">
                {WHY_CARDS.map((c) => (
                  <div key={c.title} className="home-why-card">
                    <div className="home-why-icon">{c.icon}</div>
                    <h3>{c.title}</h3>
                    <p>{c.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ---------- case studies ---------- */}
          <section className="home-section tight">
            <div className="home-section-inner">
              <div className="home-section-head">
                <div className="home-section-eyebrow">Evidence, not decoration</div>
                <h2 className="home-section-title">Built with PickTheBrick</h2>
                <p className="home-section-body">Real projects, real numbers - not just star ratings.</p>
              </div>
              <div className="home-case-grid">
                {CASE_STUDIES.map((c, i) => {
                  const card = caseStudyCards[i];
                  return (
                    <div key={c.title} className="home-case-card">
                      {card?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="home-case-photo" src={card.imageUrl} alt={c.title} />
                      ) : (
                        <div className="home-case-photo" />
                      )}
                      <div className="home-case-body">
                        <div className="home-case-tag">{c.tag}</div>
                        <div className="home-case-title">{c.title}</div>
                        <div className="home-case-stats">
                          {c.stats.map(([v, label]) => (
                            <div key={label}>
                              <span className="v">{v}</span>
                              {label}
                            </div>
                          ))}
                        </div>
                        <div className="home-case-rating">★★★★★ Google review</div>
                        {card && (
                          <Link href={card.buttonUrl} className="home-case-btn">
                            {card.buttonLabel}
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ---------- two ways to start ---------- */}
          <section className="home-section">
            <div className="home-section-inner">
              <div className="home-section-head">
                <div className="home-section-eyebrow">Two ways to start</div>
                <h2 className="home-section-title">Whichever way you&apos;re ready to go</h2>
                <p className="home-section-body">
                  Don&apos;t have a layout yet? Start with Design. Know exactly what you need? Go straight to Build.
                </p>
              </div>
              <div className="home-split">
                <Link href="/design" className="home-split-card">
                  <DesignPathIcon className="home-split-icon" />
                  <h3>Design Your Office Layout</h3>
                  <p>
                    A professional designer turns a short survey of your space into a concept layout, complete with
                    furniture arrangement, electrical, and a reflected ceiling plan.
                  </p>
                  <span className="home-link">Explore design packages ↓</span>
                </Link>
                <Link href="/build" className="home-split-card">
                  <BuildPathIcon className="home-split-icon" />
                  <h3>Build Your Fitout Estimate</h3>
                  <p>
                    Already know what you want? Pick products directly from the full catalog - flooring, partitions,
                    ceilings, furniture and more - and get an itemised, priced quote instantly.
                  </p>
                  <span className="home-link">Start building your quote ↓</span>
                </Link>
              </div>
            </div>
          </section>

          {/* ---------- categories ---------- */}
          <section className="home-section tight" id="categories">
            <div className="home-section-inner">
              <div className="home-section-head">
                <div className="home-section-eyebrow">Full Catalog</div>
                <h2 className="home-section-title">Every trade, one place</h2>
              </div>
              <div className="home-categories">
                {categories.map((c, i) => (
                  <Link key={c.key} href={`/landing/${c.key}`} className="home-cat-card">
                    <div className="home-cat-card-art">
                      {c.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.imageUrl} alt="" />
                      ) : (
                        <CategoryArt categoryKey={c.key} index={i} />
                      )}
                    </div>
                    <span className="home-cat-card-label">{c.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* ---------- priced today, built next ---------- */}
          <ParallaxCtaBand className="home-build-cta">
            <h2>Your office, priced today. Built next.</h2>
            <p>Ten trades, one platform, one dedicated Project Manager - from first click to move-in.</p>
            <Link href="/build" className="home-hero-cta-primary">
              Start Designing →
            </Link>
          </ParallaxCtaBand>

          {/* ---------- value props ---------- */}
          <section className="home-section tight">
            <div className="home-section-inner">
              <div className="home-stats">
                {VALUE_PROPS.map((v) => (
                  <div key={v.title} className="home-stat-card">
                    <svg viewBox="0 0 24 24" className="home-stat-icon" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <h4>{v.title}</h4>
                    <p>{v.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ---------- final CTA ---------- */}
          <section className="home-cta-band">
            <div className="home-section-inner">
              <h2 className="home-section-title">Ready to start?</h2>
              <p className="home-section-body">Pick your path - you can switch between them any time.</p>
              <div className="home-cta-row">
                <a className="home-cta-card" href="/design">
                  <div className="icon">✏️</div>
                  <h3>Design</h3>
                  <p>Get a concept tailored to your space.</p>
                  <span className="cta">Explore packages →</span>
                </a>
                <a className="home-cta-card" href="/build">
                  <div className="icon">🧱</div>
                  <h3>Build</h3>
                  <p>Build your fitout quote from our full catalog.</p>
                  <span className="cta">Start building →</span>
                </a>
              </div>
              {!isClientSession && (
                <p className="home-cta-foot" id="partner">
                  Fit-out contractor or interior designer? Partner with us -{" "}
                  <a href="/login?next=%2Fcontractor%2Fapply&role=contractor">Apply as a contractor →</a>{" "}
                  <a href="/login?next=%2Fdesigner%2Fapply&role=designer">Apply as a designer →</a>
                </p>
              )}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter categories={categories} />
    </div>
  );
}
