// Style catalog for the Style Finder swipe quiz (see app/design/style-finder/
// and app/actions/styleFinder.ts). Ported from the reference mockup
// (pickthebrick-style-finder-page.html) - image pool is placeholder photos
// via picsum.photos until real licensed/commissioned photography is sourced
// per style, same structure either way.
export type StyleFinderStyle = { key: string; name: string; desc: string; hex: string };

export const STYLE_FINDER_STYLES: StyleFinderStyle[] = [
  { key: "industrial", name: "Industrial", desc: "Exposed ceilings, black steel, concrete floors, Edison bulbs.", hex: "4A4A4A" },
  { key: "biophilic", name: "Biophilic", desc: "Living walls, natural wood and stone, abundant greenery.", hex: "7A9B6E" },
  { key: "mid-century-modern", name: "Mid-Century Modern", desc: "Warm wood tones, tan leather, brass, clean lines, retro geometry.", hex: "B5794A" },
  { key: "japandi", name: "Japandi", desc: "Japanese x Scandinavian — dark wood, low furniture, wabi-sabi warmth.", hex: "C9BBA5" },
  { key: "contemporary-arabic", name: "Contemporary Arabic", desc: "Mashrabiya screens, brass, rich textiles, regional prestige.", hex: "6E4A2E" },
  { key: "bold-playful", name: "Bold & Playful", desc: "Vibrant color, expressive furniture, brand-forward energy.", hex: "D9724A" },
  { key: "old-money", name: "Old Money", desc: "Dark wood wainscoting, leather chesterfields, brass, private-club gravitas.", hex: "4A3728" },
  { key: "french-victorian", name: "French Victorian", desc: "White crown mouldings, tall French windows, elegant traditional refinement.", hex: "EDE7DA" },
];

export const IMAGES_PER_STYLE = 10;
export const DECK_SIZE = 20;
// A style needs this many images shown before its % is trusted as the "top pick".
export const MIN_SHOWN_FOR_CONFIDENT_PICK = 3;

export function imagePoolForStyle(style: StyleFinderStyle): string[] {
  return Array.from({ length: IMAGES_PER_STYLE }, (_, i) => `https://picsum.photos/seed/${style.key}-${i + 1}/500/650`);
}

// Merges marketer-uploaded photography (see StyleFinderImage in
// prisma/schema.prisma and app/actions/styleFinderImages.ts) over the
// picsum placeholder pool, slot by slot - any style with no uploads yet (or
// only some slots filled) still renders a full deck, so the quiz never
// breaks while real photography is still being sourced.
export function resolveStyleImages(style: StyleFinderStyle, uploaded: Record<number, string>): string[] {
  const placeholders = imagePoolForStyle(style);
  return placeholders.map((fallback, i) => uploaded[i] ?? fallback);
}

export function styleFinderStyleByKey(key: string): StyleFinderStyle | undefined {
  return STYLE_FINDER_STYLES.find((s) => s.key === key);
}

export type RankedStyleFinderStat = { key: string; name: string; shown: number; liked: number; pct: number };

// Shared by the client and designer dashboards to render a completed
// result's tally - the quiz itself (StyleFinderClient.tsx) keeps its own
// copy since it ranks live in-memory {shown,liked} state during play rather
// than already-persisted rows.
export function rankStyleFinderStats(stats: { styleKey: string; shown: number; liked: number }[]): RankedStyleFinderStat[] {
  return stats
    .filter((s) => s.shown > 0)
    .map((s) => ({
      key: s.styleKey,
      name: styleFinderStyleByKey(s.styleKey)?.name ?? s.styleKey,
      shown: s.shown,
      liked: s.liked,
      pct: Math.round((s.liked / s.shown) * 100),
    }))
    .sort((a, b) => b.pct - a.pct || b.liked - a.liked);
}
