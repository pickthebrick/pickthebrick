import type { ReactNode } from "react";

// Hand-drawn (hand-coded) vector graphics for the home page - a consistent
// retro line-art set in the app's own palette, not stock icons. Kept as
// plain inline SVG (no external assets) so the page stays fast and
// self-contained, same approach as SwatchSvg in ProductThumb.tsx.

export function BlobShape({ className, color = "var(--accent)" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true">
      <path
        d="M317 60C368 104 393 176 385 244C377 312 336 366 274 388C212 410 129 400 78 358C27 316 8 242 20 176C32 110 76 52 138 27C200 2 266 16 317 60Z"
        fill={color}
      />
    </svg>
  );
}

export function FloorplanGrid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 400" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 5" opacity="0.5">
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 60} y1={0} x2={i * 60} y2={400} />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 60} x2={600} y2={i * 60} />
        ))}
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.8">
        <rect x="60" y="60" width="180" height="160" rx="2" />
        <rect x="280" y="60" width="140" height="100" rx="2" />
        <rect x="280" y="180" width="140" height="140" rx="2" />
        <rect x="440" y="60" width="100" height="260" rx="2" />
      </g>
    </svg>
  );
}

// A flat "cutaway room" hero illustration - desk, task chair, partition
// panel, pendant light, potted plant, floor tiles - in the brand palette.
export function OfficeSceneIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 560 440" className={className} aria-hidden="true">
      {/* floor */}
      <rect x="0" y="330" width="560" height="110" fill="var(--line)" opacity="0.5" />
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={i} x1={i * 70} y1={330} x2={i * 70} y2={440} stroke="var(--fg)" strokeOpacity="0.08" strokeWidth="2" />
      ))}

      {/* partition wall */}
      <rect x="30" y="120" width="18" height="220" rx="3" fill="var(--surface)" stroke="var(--fg)" strokeWidth="3" />
      <rect x="30" y="150" width="18" height="60" fill="var(--gold)" opacity="0.55" />

      {/* pendant light */}
      <line x1="400" y1="0" x2="400" y2="90" stroke="var(--fg)" strokeWidth="2.5" />
      <path d="M370 90 L430 90 L418 130 L382 130 Z" fill="var(--accent)" stroke="var(--fg)" strokeWidth="3" strokeLinejoin="round" />
      <ellipse cx="400" cy="150" rx="30" ry="8" fill="var(--gold)" opacity="0.35" />

      {/* desk */}
      <rect x="120" y="230" width="260" height="16" rx="3" fill="var(--surface)" stroke="var(--fg)" strokeWidth="3" />
      <rect x="140" y="246" width="10" height="80" fill="var(--fg)" opacity="0.75" />
      <rect x="350" y="246" width="10" height="80" fill="var(--fg)" opacity="0.75" />
      <rect x="150" y="180" width="90" height="50" rx="4" fill="var(--accent-deep)" opacity="0.15" stroke="var(--fg)" strokeWidth="2.5" />
      <rect x="160" y="190" width="70" height="34" rx="2" fill="var(--fg)" opacity="0.85" />

      {/* task chair */}
      <path
        d="M270 260 C270 235 300 220 320 235 C332 244 330 260 320 266 L300 300 L280 300 Z"
        fill="var(--accent)"
        stroke="var(--fg)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <rect x="286" y="300" width="18" height="10" fill="var(--fg)" />
      <line x1="295" y1="310" x2="295" y2="335" stroke="var(--fg)" strokeWidth="4" />
      <path d="M270 335 L320 335 M275 335 L268 350 M315 335 L322 350 M295 335 L295 350" stroke="var(--fg)" strokeWidth="3.5" strokeLinecap="round" />

      {/* potted plant */}
      <path d="M460 250 C450 220 470 190 490 190 C510 190 528 220 518 250 Z" fill="var(--accent-deep)" opacity="0.85" />
      <path d="M480 250 C474 215 486 180 500 178" stroke="var(--fg)" strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M492 425 L488 340 L508 340 L504 425 Z" fill="var(--surface)" stroke="var(--fg)" strokeWidth="3" />

      {/* dashed measurement line, retro blueprint touch */}
      <line x1="120" y1="380" x2="380" y2="380" stroke="var(--fg)" strokeWidth="1.5" strokeDasharray="6 5" opacity="0.4" />
      <line x1="120" y1="372" x2="120" y2="388" stroke="var(--fg)" strokeWidth="1.5" opacity="0.4" />
      <line x1="380" y1="372" x2="380" y2="388" stroke="var(--fg)" strokeWidth="1.5" opacity="0.4" />
    </svg>
  );
}

export function DesignPathIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none">
      <path d="M8 40 L30 18 L36 24 L14 46 Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M30 12 L36 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 10 C33 8 37 8 38 10 C39 12 39 16 37 18 L36 18" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M8 40 L8 46 L14 46" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="10" cy="43" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function BuildPathIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none">
      <rect x="6" y="26" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="2.5" />
      <rect x="22" y="26" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="2.5" />
      <rect x="14" y="14" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="2.5" />
      <rect x="30" y="14" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

const ICONS: Record<string, ReactNode> = {
  flooring: (
    <g fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="6" width="15" height="15" />
      <rect x="27" y="6" width="15" height="15" />
      <rect x="6" y="27" width="15" height="15" />
      <rect x="27" y="27" width="15" height="15" />
    </g>
  ),
  partitions: (
    <g fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="8" y="7" width="14" height="34" rx="1.5" />
      <rect x="26" y="7" width="14" height="34" rx="1.5" />
      <line x1="8" y1="18" x2="22" y2="18" strokeWidth="1.5" opacity="0.6" />
      <line x1="26" y1="24" x2="40" y2="24" strokeWidth="1.5" opacity="0.6" />
    </g>
  ),
  doors: (
    <g fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="12" y="6" width="24" height="36" rx="1.5" />
      <circle cx="30" cy="24" r="1.8" fill="currentColor" stroke="none" />
    </g>
  ),
  ceiling: (
    <g fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="7" y="9" width="34" height="24" rx="1.5" />
      <line x1="7" y1="21" x2="41" y2="21" strokeWidth="1.5" opacity="0.6" />
      <line x1="24" y1="9" x2="24" y2="33" strokeWidth="1.5" opacity="0.6" />
      <circle cx="24" cy="21" r="2.4" fill="currentColor" stroke="none" />
    </g>
  ),
  hvac: (
    <g fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="24" cy="24" r="15" />
      <path d="M24 24 L24 12 M24 24 L34 30 M24 24 L14 30" strokeLinecap="round" />
    </g>
  ),
  electrical: (
    <path d="M26 6 L12 26 L22 26 L20 42 L36 20 L25 20 Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  ),
  cctv: (
    <g fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 16 L28 12 L28 28 L8 24 Z" strokeLinejoin="round" />
      <circle cx="34" cy="20" r="7" />
      <line x1="18" y1="24" x2="14" y2="34" strokeLinecap="round" />
    </g>
  ),
  approvals: (
    <g fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M24 6 L40 12 L40 24 C40 34 33 41 24 44 C15 41 8 34 8 24 L8 12 Z" strokeLinejoin="round" />
      <path d="M16 24 L21 30 L33 17" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  lighting: (
    <g fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="24" cy="18" r="12" />
      <path d="M18 30 L30 30 M19 36 L29 36 M21 41 L27 41" strokeLinecap="round" />
    </g>
  ),
  furniture: (
    <g fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20 C12 12 16 8 24 8 C32 8 36 12 36 20" strokeLinecap="round" />
      <path d="M12 20 L12 34 M36 20 L36 34" strokeLinecap="round" />
      <path d="M10 34 L38 34 L35 43 L13 43 Z" strokeLinejoin="round" />
    </g>
  ),
};

export function CategoryIcon({ categoryKey, className }: { categoryKey: string; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      {ICONS[categoryKey] ?? ICONS.furniture}
    </svg>
  );
}
