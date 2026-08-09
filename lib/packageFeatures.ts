import type { PackageKey } from "./designPricing";

// Default rows for PackageFeatureItem (see prisma/schema.prisma), upserted
// by fixed id on every /admin/marketing load (same "ensure defaults" pattern
// as CaseStudyCard's case-1/case-2/case-3 rows) so the table is never empty.
// This is the one-time replacement for the old hardcoded
// ESSENTIAL_FEATURES/ADVANCED_FEATURES/PREMIUM_FEATURES arrays in
// DesignPageClient.tsx - descriptions below are placeholder copy for the
// marketer to refine from the admin panel.
export type PackageFeatureSeed = {
  id: string;
  label: string;
  description: string;
  minTier: PackageKey;
  sortOrder: number;
};

export const DEFAULT_PACKAGE_FEATURES: PackageFeatureSeed[] = [
  {
    id: "pkgfeat-concept-layout",
    label: "Concept layout",
    description: "A first-pass floor plan showing how your spaces are arranged, sized, and connected.",
    minTier: "essential",
    sortOrder: 0,
  },
  {
    id: "pkgfeat-revisions",
    label: "Revisions for final layout",
    description: "Rounds of feedback and adjustment on the layout before it's finalized, within your package's revision limit.",
    minTier: "essential",
    sortOrder: 1,
  },
  {
    id: "pkgfeat-furniture-layout",
    label: "Furniture arrangement layout",
    description: "Desks, seating, and storage placed within each space for a realistic, workable footprint.",
    minTier: "essential",
    sortOrder: 2,
  },
  {
    id: "pkgfeat-measurement-statements",
    label: "Full measurement & area statements (quantities)",
    description: "A detailed breakdown of areas and quantities your contractor will use to price and build the fit-out.",
    minTier: "essential",
    sortOrder: 3,
  },
  {
    id: "pkgfeat-electrical-layout",
    label: "Electrical layout",
    description: "Power points, switches, and circuit routing mapped across every space.",
    minTier: "essential",
    sortOrder: 4,
  },
  {
    id: "pkgfeat-rcp",
    label: "Reflected ceiling plan",
    description: "A ceiling-level plan showing lighting fixtures, AC diffusers, and other overhead elements.",
    minTier: "essential",
    sortOrder: 5,
  },
  {
    id: "pkgfeat-mood-board",
    label: "Color scheme mood board",
    description: "A curated palette of colors, finishes, and materials to guide the look and feel of your office.",
    minTier: "essential",
    sortOrder: 6,
  },
  {
    id: "pkgfeat-3d-sketch",
    label: "3D sketch",
    description: "A quick 3D massing sketch to help you visualize the space before full renders.",
    minTier: "advanced",
    sortOrder: 7,
  },
  {
    id: "pkgfeat-build-discount",
    label: "Pre-approved discount on PTB Build",
    description: "A discount automatically applied when you move from Design into a PTB Build fit-out quote.",
    minTier: "premium",
    sortOrder: 8,
  },
  {
    id: "pkgfeat-design-station",
    label: "Access to the Design Station",
    description: "A dedicated online space to track your design, leave comments, and download files as they're delivered.",
    minTier: "premium",
    sortOrder: 9,
  },
  {
    id: "pkgfeat-3d-photoreal",
    label: "3D photorealistic views for selected areas",
    description: "High-fidelity photorealistic renders of key spaces, ready to share with stakeholders.",
    minTier: "premium",
    sortOrder: 10,
  },
];

const TIER_RANK: Record<PackageKey, number> = { essential: 0, advanced: 1, premium: 2 };

// Advanced shows every essential+advanced item, Premium shows all three -
// the same progressive-inclusion rule the old hardcoded feature arrays used.
export function featureItemsForTier<T extends { minTier: string }>(items: T[], tier: PackageKey): T[] {
  return items.filter((item) => TIER_RANK[item.minTier as PackageKey] <= TIER_RANK[tier]);
}
