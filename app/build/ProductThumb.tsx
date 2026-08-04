"use client";

import { useState } from "react";

// Deterministic, locally-generated placeholder "material swatch" - used as an
// offline fallback if the dummy photo service below can't be reached (or as
// the primary look, if that's ever preferred over photos).

function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PALETTE = ["#e8d9c0", "#e3c9a8", "#d8b791", "#c9a37e", "#efa46a", "#e08c52", "#c97a4a", "#b9906f", "#d9c7a3", "#a9825f"];

function SwatchSvg({ seed, variant = 0, className }: { seed: string; variant?: number; className?: string }) {
  const rnd = mulberry32(hashSeed(seed + ":" + variant));
  const bg = PALETTE[Math.floor(rnd() * PALETTE.length)];
  const line = "rgba(58,54,50,0.16)";
  const pattern = hashSeed(seed) % 5;

  let shapes: React.ReactNode = null;
  if (pattern === 0) {
    shapes = Array.from({ length: 5 }).map((_, i) => (
      <line key={i} x1={0} y1={20 + i * 20} x2={200} y2={20 + i * 20} stroke={line} strokeWidth={2} />
    ));
  } else if (pattern === 1) {
    shapes = (
      <>
        {[0, 1, 2].map((c) => (
          <line key={`v${c}`} x1={c * 67} y1={0} x2={c * 67} y2={140} stroke={line} strokeWidth={2} />
        ))}
        {[0, 1, 2].map((r) => (
          <line key={`h${r}`} x1={0} y1={r * 47} x2={200} y2={r * 47} stroke={line} strokeWidth={2} />
        ))}
      </>
    );
  } else if (pattern === 2) {
    shapes = Array.from({ length: 8 }).map((_, i) => (
      <line key={i} x1={-40 + i * 30} y1={140} x2={40 + i * 30} y2={0} stroke={line} strokeWidth={3} />
    ));
  } else if (pattern === 3) {
    shapes = Array.from({ length: 4 }).map((_, i) => (
      <path key={i} d={`M ${i * 55} 0 L ${i * 55 + 27} 140 L ${i * 55 + 55} 0`} stroke={line} strokeWidth={3} fill="none" />
    ));
  } else {
    shapes = Array.from({ length: 22 }).map((_, i) => {
      const x = rnd() * 200;
      const y = rnd() * 140;
      const r = 1.5 + rnd() * 2.5;
      return <circle key={i} cx={x} cy={y} r={r} fill={line} />;
    });
  }

  return (
    <svg viewBox="0 0 200 140" className={className} preserveAspectRatio="xMidYMid slice">
      <rect width={200} height={140} fill={bg} />
      {shapes}
    </svg>
  );
}

// Photo-style dummy images (via a seeded placeholder photo service) so
// product cards/gallery show realistic proportions - falls back to the
// generated swatch above if the image can't load (e.g. offline). If the
// admin has uploaded real photos for this product, those are used instead.
export function ProductThumb({
  seed,
  variant = 0,
  images,
  className,
}: {
  seed: string;
  variant?: number;
  images?: string[];
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (images && images.length > 0) {
    const src = images[variant] ?? images[0];
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" loading="lazy" className={className} />;
  }

  if (failed) {
    return <SwatchSvg seed={seed} variant={variant} className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://picsum.photos/seed/${encodeURIComponent(seed + "-" + variant)}/400/300`}
      alt=""
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
