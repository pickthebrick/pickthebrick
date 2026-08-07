// Design package pricing - shared between the client-facing /design page
// (live price preview as the client types) and startDesignRequest (which
// snapshots the resulting price onto DesignRequest.packagePrice at request time).
export type PackageKey = "essential" | "advanced" | "premium";

// Pricing slabs are intentionally not shown to the client - only the
// resulting price for their entered size + chosen package.
export function essentialPrice(sqft: number): number | null {
  if (!Number.isFinite(sqft) || sqft <= 0) return null;
  if (sqft <= 1000) return 400;
  if (sqft <= 2000) return 800;
  if (sqft <= 3000) return 1200;
  if (sqft <= 10000) return 2000;
  return null;
}

export function priceFor(key: PackageKey, sqft: number): number | null {
  const base = essentialPrice(sqft);
  if (base === null) return null;
  if (key === "essential") return base;
  if (key === "advanced") return base + 300;
  return base + 300 + 800;
}

// How many times a designer may deliver/redeliver a submittal on each
// package (see DesignRequest.revisionsUsed and submitDesignRevision in
// app/actions/design.ts) - null means unlimited. A client who needs more
// than their package allows has to upgrade rather than the designer just
// ignoring the cap.
export const MAX_REVISIONS: Record<PackageKey, number | null> = {
  essential: 2,
  advanced: 4,
  premium: null,
};
