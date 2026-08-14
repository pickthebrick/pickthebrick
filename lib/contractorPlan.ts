// A contractor gets this many free client quotes (see createContractorQuote
// in app/actions/quotes.ts) before they're asked to upgrade - counted the
// same way the admin Contractor Quotes tab already counts them: quotes
// they've actually downloaded a PDF for (Quote.contractorCompletedAt), not
// ones just started. A single shared constant, not per-row default, so
// raising it later doesn't require a migration.
export const CONTRACTOR_FREE_QUOTE_LIMIT = 10;

// A contractor's actual limit - the shared default, unless the business has
// granted them a specific override (User.contractorFreeQuotaOverride, e.g. a
// pilot partner or VIP relationship).
export function getContractorQuoteLimit(freeQuotaOverride: number | null | undefined): number {
  return freeQuotaOverride ?? CONTRACTOR_FREE_QUOTE_LIMIT;
}
