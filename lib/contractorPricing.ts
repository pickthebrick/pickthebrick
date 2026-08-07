// PickTheBrick sells to the client at a different (higher) price than what
// it pays the contractor doing the work - that gap is the business's
// margin. Every dollar figure a contractor sees (open job values, payment
// claim amounts) is the client sell price reduced by their category's
// contractorReductionPercent (see Category model, adjustable by the super
// admin at /admin/contractor-pricing).
export const DEFAULT_CONTRACTOR_REDUCTION_PERCENT = 15;

export function applyContractorReduction(amount: number, reductionPercent: number): number {
  return amount * (1 - reductionPercent / 100);
}

// A contractor can be assigned across more than one category on the same
// project - blend their own categories' rates with a simple average (not
// dollar-weighted) so every category's admin-set rate is represented evenly.
export function blendedReductionPercent(reductionPercents: number[]): number {
  if (reductionPercents.length === 0) return DEFAULT_CONTRACTOR_REDUCTION_PERCENT;
  return reductionPercents.reduce((sum, r) => sum + r, 0) / reductionPercents.length;
}
