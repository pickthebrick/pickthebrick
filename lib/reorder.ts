// Shared helper for the swap-based "move up/down" reordering used across
// categories/types/subtypes/products/images - siblings must already be
// sorted by sortOrder ascending. Returns null if there's nowhere to move.
export function findSwapIndex<T extends { id: string }>(
  siblings: T[],
  id: string,
  direction: "up" | "down",
): number | null {
  const idx = siblings.findIndex((s) => s.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= siblings.length) return null;
  return swapIdx;
}
