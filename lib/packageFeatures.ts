import type { PackageKey } from "./designPricing";

// Default rows for PackageFeatureItem (see prisma/schema.prisma), upserted
// by fixed id on every /admin/marketing load (same "ensure defaults" pattern
// as CaseStudyCard's case-1/case-2/case-3 rows) so the table is never empty.
//
// Each tier owns its own independently-editable copy of every item (rather
// than one row shown cumulatively across tiers) - e.g. "Revisions for final
// layout" is 3 separate rows below, one per tier, so a marketer can set "2
// revisions" on Essential and "4 revisions" on Advanced without the two
// tiers being forced to show identical text. minTier is therefore an exact
// tier assignment now, not a "included from this tier up" threshold - see
// featureItemsForTier().
export type PackageFeatureSeed = {
  id: string;
  label: string;
  description: string;
  minTier: PackageKey;
  sortOrder: number;
};

export const DEFAULT_PACKAGE_FEATURES: PackageFeatureSeed[] = [
  // ---------- Essential ----------
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
    description: "2 rounds of feedback and adjustment on the layout before it's finalized.",
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

  // ---------- Advanced ----------
  {
    id: "pkgfeat-concept-layout-adv",
    label: "Concept layout",
    description: "A first-pass floor plan showing how your spaces are arranged, sized, and connected.",
    minTier: "advanced",
    sortOrder: 0,
  },
  {
    id: "pkgfeat-revisions-adv",
    label: "Revisions for final layout",
    description: "4 rounds of feedback and adjustment on the layout before it's finalized.",
    minTier: "advanced",
    sortOrder: 1,
  },
  {
    id: "pkgfeat-furniture-layout-adv",
    label: "Furniture arrangement layout",
    description: "Desks, seating, and storage placed within each space for a realistic, workable footprint.",
    minTier: "advanced",
    sortOrder: 2,
  },
  {
    id: "pkgfeat-measurement-statements-adv",
    label: "Full measurement & area statements (quantities)",
    description: "A detailed breakdown of areas and quantities your contractor will use to price and build the fit-out.",
    minTier: "advanced",
    sortOrder: 3,
  },
  {
    id: "pkgfeat-electrical-layout-adv",
    label: "Electrical layout",
    description: "Power points, switches, and circuit routing mapped across every space.",
    minTier: "advanced",
    sortOrder: 4,
  },
  {
    id: "pkgfeat-rcp-adv",
    label: "Reflected ceiling plan",
    description: "A ceiling-level plan showing lighting fixtures, AC diffusers, and other overhead elements.",
    minTier: "advanced",
    sortOrder: 5,
  },
  {
    id: "pkgfeat-mood-board-adv",
    label: "Color scheme mood board",
    description: "A curated palette of colors, finishes, and materials to guide the look and feel of your office.",
    minTier: "advanced",
    sortOrder: 6,
  },
  {
    id: "pkgfeat-3d-sketch",
    label: "3D sketch",
    description: "A quick 3D massing sketch to help you visualize the space before full renders.",
    minTier: "advanced",
    sortOrder: 7,
  },

  // ---------- Premium ----------
  {
    id: "pkgfeat-concept-layout-prem",
    label: "Concept layout",
    description: "A first-pass floor plan showing how your spaces are arranged, sized, and connected.",
    minTier: "premium",
    sortOrder: 0,
  },
  {
    id: "pkgfeat-revisions-prem",
    label: "Revisions for final layout",
    description: "6 rounds of feedback and adjustment on the layout before it's finalized.",
    minTier: "premium",
    sortOrder: 1,
  },
  {
    id: "pkgfeat-furniture-layout-prem",
    label: "Furniture arrangement layout",
    description: "Desks, seating, and storage placed within each space for a realistic, workable footprint.",
    minTier: "premium",
    sortOrder: 2,
  },
  {
    id: "pkgfeat-measurement-statements-prem",
    label: "Full measurement & area statements (quantities)",
    description: "A detailed breakdown of areas and quantities your contractor will use to price and build the fit-out.",
    minTier: "premium",
    sortOrder: 3,
  },
  {
    id: "pkgfeat-electrical-layout-prem",
    label: "Electrical layout",
    description: "Power points, switches, and circuit routing mapped across every space.",
    minTier: "premium",
    sortOrder: 4,
  },
  {
    id: "pkgfeat-rcp-prem",
    label: "Reflected ceiling plan",
    description: "A ceiling-level plan showing lighting fixtures, AC diffusers, and other overhead elements.",
    minTier: "premium",
    sortOrder: 5,
  },
  {
    id: "pkgfeat-mood-board-prem",
    label: "Color scheme mood board",
    description: "A curated palette of colors, finishes, and materials to guide the look and feel of your office.",
    minTier: "premium",
    sortOrder: 6,
  },
  {
    id: "pkgfeat-3d-sketch-prem",
    label: "3D sketch",
    description: "A quick 3D massing sketch to help you visualize the space before full renders.",
    minTier: "premium",
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

// Exact tier match - each tier only ever shows its own rows now, so a
// change to Essential's copy/count never leaks into Advanced or Premium.
export function featureItemsForTier<T extends { minTier: string }>(items: T[], tier: PackageKey): T[] {
  return items.filter((item) => item.minTier === tier);
}
