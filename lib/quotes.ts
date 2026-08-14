import "server-only";
import { prisma } from "@/lib/prisma";
import type { Unit } from "@/app/generated/prisma/enums";

export type CartLine = {
  // Null for a contractor's own manually-typed line - see itemId below.
  productId: string | null;
  // Only set (to the QuoteItem's own id) when productId is null - a manual
  // line has no catalog product to key off, so this is what edit/remove
  // actions target instead (see contractorUpsertManualItem in
  // app/actions/quotes.ts). Always undefined for a catalog-linked line.
  itemId?: string;
  name: string;
  categoryLabel: string;
  typeLabel: string;
  subtypeLabel: string;
  rate: number;
  unit: Unit;
  qty: number;
};

export async function fetchCartLines(quoteId: string): Promise<CartLine[]> {
  const items = await prisma.quoteItem.findMany({ where: { quoteId } });
  return items.map((row) => ({
    productId: row.productId,
    itemId: row.productId ? undefined : row.id,
    name: row.name,
    categoryLabel: row.categoryLabel,
    typeLabel: row.typeLabel,
    subtypeLabel: row.subtypeLabel,
    rate: row.rate,
    unit: row.unit,
    qty: row.qty,
  }));
}
