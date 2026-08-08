import type { ReactNode } from "react";

// Placeholder tile art for the homepage "Full Catalog" grid - shown for any
// category the marketing team hasn't uploaded a real photo for yet (see
// Category.imageUrl + app/actions/catalog.ts setCategoryImage). Large
// decorative line-art on a themed gradient, in the same hand-coded SVG
// convention as HomeIllustrations.tsx, sized to fill a whole tile rather
// than read as a small icon.

const PALETTES = [
  ["var(--accent)", "var(--accent-deep)"],
  ["var(--gold)", "var(--accent-deep)"],
  ["var(--fg)", "var(--muted)"],
  ["var(--accent-deep)", "var(--gold)"],
];

const MOTIFS: Record<string, ReactNode> = {
  flooring: (
    <g fill="none" stroke="#fff" strokeWidth="3" opacity="0.55">
      <rect x="20" y="20" width="70" height="70" />
      <rect x="110" y="20" width="70" height="70" />
      <rect x="20" y="110" width="70" height="70" />
      <rect x="110" y="110" width="70" height="70" />
    </g>
  ),
  partitions: (
    <g fill="none" stroke="#fff" strokeWidth="3" opacity="0.55">
      <rect x="35" y="20" width="55" height="160" rx="4" />
      <rect x="110" y="20" width="55" height="160" rx="4" />
      <line x1="35" y1="70" x2="90" y2="70" strokeWidth="2" opacity="0.7" />
      <line x1="110" y1="110" x2="165" y2="110" strokeWidth="2" opacity="0.7" />
    </g>
  ),
  doors: (
    <g fill="none" stroke="#fff" strokeWidth="3" opacity="0.55">
      <rect x="60" y="20" width="80" height="160" rx="4" />
      <circle cx="122" cy="100" r="4" fill="#fff" stroke="none" />
    </g>
  ),
  ceiling: (
    <g fill="none" stroke="#fff" strokeWidth="3" opacity="0.55">
      <rect x="25" y="35" width="150" height="110" rx="4" />
      <line x1="25" y1="90" x2="175" y2="90" strokeWidth="2" opacity="0.7" />
      <line x1="100" y1="35" x2="100" y2="145" strokeWidth="2" opacity="0.7" />
      <circle cx="100" cy="90" r="6" fill="#fff" stroke="none" />
    </g>
  ),
  hvac: (
    <g fill="none" stroke="#fff" strokeWidth="3" opacity="0.55">
      <circle cx="100" cy="100" r="65" />
      <path d="M100 100 L100 50 M100 100 L143 125 M100 100 L57 125" strokeLinecap="round" />
    </g>
  ),
  electrical: (
    <path
      d="M112 20 L50 110 L92 110 L84 180 L152 85 L104 85 Z"
      fill="#fff"
      opacity="0.55"
      stroke="#fff"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  ),
  cctv: (
    <g fill="none" stroke="#fff" strokeWidth="3" opacity="0.55">
      <path d="M30 65 L115 50 L115 115 L30 100 Z" strokeLinejoin="round" />
      <circle cx="140" cy="82" r="30" />
      <line x1="75" y1="100" x2="60" y2="140" strokeLinecap="round" />
    </g>
  ),
  approvals: (
    <g fill="none" stroke="#fff" strokeWidth="3" opacity="0.55">
      <path d="M100 22 L165 48 L165 100 C165 140 138 168 100 182 C62 168 35 140 35 100 L35 48 Z" strokeLinejoin="round" />
      <path d="M68 100 L88 122 L134 72" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  lighting: (
    <g fill="none" stroke="#fff" strokeWidth="3" opacity="0.55">
      <circle cx="100" cy="75" r="48" />
      <path d="M75 125 L125 125 M80 148 L120 148 M87 168 L113 168" strokeLinecap="round" />
    </g>
  ),
  furniture: (
    <g fill="none" stroke="#fff" strokeWidth="3" opacity="0.55">
      <path d="M48 82 C48 48 66 32 100 32 C134 32 152 48 152 82" strokeLinecap="round" />
      <path d="M48 82 L48 140 M152 82 L152 140" strokeLinecap="round" />
      <path d="M40 140 L160 140 L150 176 L50 176 Z" strokeLinejoin="round" />
    </g>
  ),
};

export default function CategoryArt({ categoryKey, index }: { categoryKey: string; index: number }) {
  const [c1, c2] = PALETTES[index % PALETTES.length];
  return (
    <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`cat-grad-${categoryKey}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="200" height="200" fill={`url(#cat-grad-${categoryKey})`} />
      {MOTIFS[categoryKey] ?? MOTIFS.furniture}
    </svg>
  );
}
