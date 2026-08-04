import "server-only";
import { prisma } from "@/lib/prisma";
import type { Unit } from "@/app/generated/prisma/enums";

export type CartLine = {
  productId: string;
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
    productId: row.productId!,
    name: row.name,
    categoryLabel: row.categoryLabel,
    typeLabel: row.typeLabel,
    subtypeLabel: row.subtypeLabel,
    rate: row.rate,
    unit: row.unit,
    qty: row.qty,
  }));
}
