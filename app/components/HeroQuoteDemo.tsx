"use client";

import { useEffect, useRef } from "react";

// A looping, purely illustrative "quote building live" demo for the
// homepage hero - three line items fade in one at a time while a category
// chip highlights and the total counts up, then it resets. No real data,
// just motion that sells what Build actually does in a few seconds flat.

const LINES = [
  { name: "Porcelain Tile 60x60 — Grey", spec: "Flooring · Tiles", amount: 4970 },
  { name: "Gypsum Partition — Fire Rated", spec: "Partitions · Gypsum", amount: 9150 },
  { name: "Recessed LED Downlight, 12W", spec: "Lighting · 24 pcs", amount: 2568 },
];

// Matches the line-fade-in delays below (1.4s / 2.9s / 4.4s) so the total
// jumps right as each line becomes visible, within one 6s loop.
const TOTAL_STOPS = [
  { t: 0, v: 0 },
  { t: 1400, v: 0 },
  { t: 1600, v: 4970 },
  { t: 2900, v: 4970 },
  { t: 3100, v: 14120 },
  { t: 4400, v: 14120 },
  { t: 4600, v: 16688 },
  { t: 6000, v: 16688 },
];
const LOOP_MS = 6000;

function fmt(n: number) {
  return "AED " + n.toLocaleString();
}

export default function HeroQuoteDemo() {
  const totalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finalValue = TOTAL_STOPS[TOTAL_STOPS.length - 1].v;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (totalRef.current) totalRef.current.textContent = fmt(finalValue);
      return;
    }

    let raf: number;
    function loop(now: number) {
      const t = now % LOOP_MS;
      let val = finalValue;
      for (let i = 0; i < TOTAL_STOPS.length - 1; i++) {
        if (t >= TOTAL_STOPS[i].t && t < TOTAL_STOPS[i + 1].t) {
          val = TOTAL_STOPS[i].v;
          break;
        }
      }
      if (totalRef.current) totalRef.current.textContent = fmt(val);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="hero-demo-card" aria-hidden="true">
      <div className="hero-demo-topbar">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
      <div className="hero-demo-inner">
        <div className="hero-demo-row">
          <div className="hero-demo-title">Your Quote</div>
          <div className="hero-demo-live">
            <span className="hero-demo-pulse" />
            Building live
          </div>
        </div>
        <div className="hero-demo-chips">
          <span className="hero-demo-chip">Partitions</span>
          <span className="hero-demo-chip hit">Flooring</span>
          <span className="hero-demo-chip">Ceiling</span>
          <span className="hero-demo-chip">Lighting</span>
        </div>
        <div className="hero-demo-lines">
          {LINES.map((l, i) => (
            <div key={l.name} className={`hero-demo-line line-${i + 1}`}>
              <div className="hero-demo-thumb" />
              <div className="hero-demo-text">
                <div className="hero-demo-name">{l.name}</div>
                <div className="hero-demo-spec">{l.spec}</div>
              </div>
              <div className="hero-demo-amt">{fmt(l.amount)}</div>
            </div>
          ))}
        </div>
        <div className="hero-demo-total">
          <div className="label">Total</div>
          <div className="amt" ref={totalRef}>
            AED 0
          </div>
        </div>

        <div className="hero-demo-click-ring" />
        <div className="hero-demo-cursor">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M4 2 L4 20 L9 15.5 L12.5 22 L15 20.5 L11.5 14 L18 14 Z"
              fill="var(--fg)"
              stroke="#fff"
              strokeWidth="1.2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
