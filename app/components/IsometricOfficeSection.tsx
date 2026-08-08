"use client";

import { useEffect, useRef } from "react";

// Placeholder for the workspace.ae-style isometric office parallax the user
// is producing separately as an animation file. This hand-drawn SVG (a 6x4
// floor grid + three simple 3-face isometric boxes, all computed from a
// standard "2:1 pixel-isometric" axis pair rather than hand-picked
// coordinates) exists purely so the section's layout, sizing, and scroll
// parallax can be previewed before the real artwork exists. Swapping in the
// final asset later only means replacing the contents of `.iso-graphic` -
// the parallax wiring (isoRef/gridRef + the scroll listener below) stays as-is.

// One "floor tile" step in screen pixels for the 2:1 isometric axes used
// below - moving one tile along X or Y both shifts the point down by half
// as much as it shifts sideways, which is what makes the grid read as a
// floor receding into the screen instead of a flat top-down grid.
const TILE = 34;
const AXIS_X: [number, number] = [TILE, TILE / 2];
const AXIS_Y: [number, number] = [-TILE, TILE / 2];
const ORIGIN: [number, number] = [300, 60];

function iso(x: number, y: number): [number, number] {
  return [ORIGIN[0] + x * AXIS_X[0] + y * AXIS_Y[0], ORIGIN[1] + x * AXIS_X[1] + y * AXIS_Y[1]];
}

function pts(points: [number, number][]) {
  return points.map((p) => p.join(",")).join(" ");
}

// Draws one 3-face box (top/left/right) sitting on tile rect
// [x0,x1] x [y0,y1], extruded upward by `height` screen pixels.
function IsoBox({ x0, x1, y0, y1, height, fill, stroke = "var(--fg)" }: {
  x0: number; x1: number; y0: number; y1: number; height: number; fill: string; stroke?: string;
}) {
  const A = iso(x0, y0);
  const B = iso(x1, y0);
  const C = iso(x1, y1);
  const D = iso(x0, y1);
  const up = ([px, py]: [number, number]): [number, number] => [px, py - height];
  const [Ae, Be, Ce, De] = [up(A), up(B), up(C), up(D)];
  return (
    <g stroke={stroke} strokeWidth="1.6" strokeLinejoin="round">
      <polygon points={pts([D, C, Ce, De])} fill={fill} opacity="0.75" />
      <polygon points={pts([B, C, Ce, Be])} fill={fill} opacity="0.55" />
      <polygon points={pts([Ae, Be, Ce, De])} fill={fill} />
    </g>
  );
}

function IsoFloorGrid() {
  const lines: [number, number][][] = [];
  for (let x = 0; x <= 6; x++) lines.push([iso(x, 0), iso(x, 4)]);
  for (let y = 0; y <= 4; y++) lines.push([iso(0, y), iso(6, y)]);
  const outline = pts([iso(0, 0), iso(6, 0), iso(6, 4), iso(0, 4)]);
  return (
    <g>
      <polygon points={outline} fill="var(--surface)" stroke="none" opacity="0.6" />
      <g stroke="var(--fg)" strokeWidth="1" strokeDasharray="3 5" opacity="0.35">
        {lines.map(([[x1, y1], [x2, y2]], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>
      <polygon points={outline} fill="none" stroke="var(--fg)" strokeWidth="1.5" opacity="0.5" />
    </g>
  );
}

export default function IsometricOfficeSection() {
  const gridRef = useRef<HTMLDivElement>(null);
  const boxesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = gridRef.current?.closest(".iso-section") as HTMLElement | null;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (!section) return;
        const rect = section.getBoundingClientRect();
        // -1 (section just below viewport) .. 1 (section just above it) -
        // 0 is centered, so both layers sit at their resting position when
        // the section is in the middle of the screen.
        const progress = Math.max(-1, Math.min(1, 1 - (rect.top + rect.height / 2) / (window.innerHeight / 2)));
        if (gridRef.current) gridRef.current.style.transform = `translate3d(0, ${progress * 18}px, 0)`;
        if (boxesRef.current) boxesRef.current.style.transform = `translate3d(0, ${progress * -30}px, 0)`;
        ticking = false;
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="iso-section">
      <div className="iso-section-inner">
        <div className="home-section-head">
          <div className="home-section-eyebrow">Your Space, Mapped Out</div>
          <h2 className="home-section-title">See it before it&apos;s built</h2>
        </div>
        <div className="iso-graphic">
          <div ref={gridRef} className="iso-layer iso-layer-grid">
            <svg viewBox="0 0 600 340" aria-hidden="true">
              <IsoFloorGrid />
            </svg>
          </div>
          <div ref={boxesRef} className="iso-layer iso-layer-boxes">
            <svg viewBox="0 0 600 340" aria-hidden="true">
              <IsoBox x0={0.6} x1={2.2} y0={0.6} y1={2} height={46} fill="var(--accent)" />
              <IsoBox x0={2.6} x1={4.6} y0={1.4} y1={2.8} height={30} fill="var(--gold)" />
              <IsoBox x0={3.6} x1={5.4} y0={0.4} y1={1.4} height={64} fill="var(--surface)" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
