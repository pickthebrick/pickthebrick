import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Unit } from "@/lib/database.types";

export type CartLine = {
  productId: string;
  name: string;
  categoryLabel: string;
  typeLabel: string;
  subtypeLabel: string;
  rate: number;
  install: number;
  unit: Unit;
  qty: number;
};

// Creates (or reuses) the caller's single active draft quote - this is what
// lets a Client's in-progress cart survive a refresh or dropped connection,
// since it lives in quote_items rather than page-level state.
export async function getOrCreateDraftQuote(supabase: SupabaseClient<Database>): Promise<string> {
  const { data, error } = await supabase.rpc("get_or_create_draft_quote");
  if (error) throw error;
  return data as string;
}

export async function fetchCartLines(supabase: SupabaseClient<Database>, quoteId: string): Promise<CartLine[]> {
  const { data, error } = await supabase.from("quote_items").select("*").eq("quote_id", quoteId);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    productId: row.product_id!,
    name: row.name,
    categoryLabel: row.category_label,
    typeLabel: row.type_label,
    subtypeLabel: row.subtype_label,
    rate: Number(row.rate),
    install: Number(row.install_rate),
    unit: row.unit,
    qty: Number(row.qty),
  }));
}

export async function upsertCartLine(supabase: SupabaseClient<Database>, quoteId: string, line: CartLine) {
  const { error } = await supabase.from("quote_items").upsert(
    {
      quote_id: quoteId,
      product_id: line.productId,
      name: line.name,
      category_label: line.categoryLabel,
      type_label: line.typeLabel,
      subtype_label: line.subtypeLabel,
      rate: line.rate,
      install_rate: line.install,
      unit: line.unit,
      qty: line.qty,
    },
    { onConflict: "quote_id,product_id" }
  );
  if (error) throw error;
}

export async function removeCartLine(supabase: SupabaseClient<Database>, quoteId: string, productId: string) {
  const { error } = await supabase.from("quote_items").delete().eq("quote_id", quoteId).eq("product_id", productId);
  if (error) throw error;
}

export async function submitQuote(supabase: SupabaseClient<Database>, quoteId: string) {
  const { error } = await supabase.rpc("submit_quote", { p_quote_id: quoteId });
  if (error) throw error;
}
