"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { BlobShape, FloorplanGrid, DesignPathIcon, BuildPathIcon, CategoryIcon } from "./components/HomeIllustrations";
import HeroQuoteDemo from "./components/HeroQuoteDemo";
import ParallaxCtaBand from "./components/ParallaxCtaBand";
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

export default function HomeClient({
  isClientSession,
  categories,
}: {
  isClientSession: boolean;
  categories: { key: string; label: string }[];
}) {
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (blob1Ref.current) blob1Ref.current.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
        if (blob2Ref.current) blob2Ref.current.style.transform = `translate3d(0, ${y * -0.12}px, 0)`;
        if (gridRef.current) gridRef.current.style.transform = `translate3d(-50%, ${y * 0.08}px, 0)`;
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
            <div className="home-hero-bg">
              <div ref={blob1Ref} className="home-blob b1">
                <BlobShape color="var(--accent)" />
              </div>
              <div ref={blob2Ref} className="home-blob b2">
                <BlobShape color="var(--gold)" />
              </div>
              <div ref={gridRef} className="home-floorplan">
                <FloorplanGrid />
              </div>
            </div>

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

          {/* ---------- how it works ---------- */}
          <section className="home-section" id="how-it-works">
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
                  <h3>Design</h3>
                  <p>
                    A professional designer turns a short survey of your space into a concept layout, complete with
                    furniture arrangement, electrical, and a reflected ceiling plan.
                  </p>
                  <span className="home-link">Explore design packages ↓</span>
                </Link>
                <Link href="/build" className="home-split-card">
                  <BuildPathIcon className="home-split-icon" />
                  <h3>Build</h3>
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
                {categories.map((c) => (
                  <Link key={c.key} href={`/landing/${c.key}`} className="home-cat-card">
                    <CategoryIcon categoryKey={c.key} />
                    <span>{c.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

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
          <ParallaxCtaBand className="home-cta-band">
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
          </ParallaxCtaBand>
        </div>
      </main>

      <SiteFooter categories={categories} />
    </div>
  );
}
