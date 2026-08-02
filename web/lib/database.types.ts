// Hand-written to match supabase/migrations/*.sql until a project is linked.
// Once you've run `supabase link`, regenerate the real thing with:
//   npx supabase gen types typescript --linked > lib/database.types.ts

export type Role = "client" | "captain" | "contractor" | "admin";
export type Unit = "sqm" | "lm" | "count";
export type QuoteStatus = "draft" | "submitted" | "captain_confirmed" | "admin_approved" | "paid";

// supabase-js's generic query builder only resolves real (non-`never`/`undefined`)
// types when each table matches `GenericTable` (Row/Insert/Update/Relationships) and
// the schema includes `Views` - both are required even though this project has none.
type NoRelationships = { Relationships: [] };

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Role;
          full_name: string | null;
          company: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      } & NoRelationships;
      categories: {
        Row: {
          id: string;
          key: string;
          label: string;
          subtitle: string | null;
          unit: Unit;
          highlight: string | null;
          enabled: boolean;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
      } & NoRelationships;
      types: {
        Row: {
          id: string;
          category_id: string;
          key: string;
          label: string;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["types"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["types"]["Row"]>;
      } & NoRelationships;
      subtypes: {
        Row: {
          id: string;
          type_id: string;
          key: string;
          label: string;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["subtypes"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["subtypes"]["Row"]>;
      } & NoRelationships;
      products: {
        Row: {
          id: string;
          subtype_id: string;
          name: string;
          rate: number;
          install_rate: number;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
      } & NoRelationships;
      quotes: {
        Row: {
          id: string;
          client_id: string;
          status: QuoteStatus;
          captain_id: string | null;
          contractor_id: string | null;
          materials_total: number;
          install_total: number;
          grand_total: number;
          created_at: string;
          submitted_at: string | null;
          confirmed_at: string | null;
          approved_at: string | null;
          paid_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["quotes"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["quotes"]["Row"]>;
      } & NoRelationships;
      quote_items: {
        Row: {
          id: string;
          quote_id: string;
          product_id: string | null;
          name: string;
          category_label: string;
          type_label: string;
          subtype_label: string;
          rate: number;
          install_rate: number;
          unit: Unit;
          qty: number;
          amount: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["quote_items"]["Row"]> & {
          quote_id: string;
          product_id: string;
          name: string;
          category_label: string;
          type_label: string;
          subtype_label: string;
          rate: number;
          unit: Unit;
          qty: number;
        };
        Update: Partial<Database["public"]["Tables"]["quote_items"]["Row"]>;
      } & NoRelationships;
      quote_status_history: {
        Row: {
          id: string;
          quote_id: string;
          from_status: string | null;
          to_status: string;
          changed_by: string | null;
          changed_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["quote_status_history"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["quote_status_history"]["Row"]>;
      } & NoRelationships;
    };
    Views: Record<string, never>;
    Functions: {
      current_role: { Args: Record<string, never>; Returns: Role };
      get_or_create_draft_quote: { Args: Record<string, never>; Returns: string };
      recalc_quote_totals: { Args: { p_quote_id: string }; Returns: undefined };
      submit_quote: { Args: { p_quote_id: string }; Returns: undefined };
      captain_confirm: { Args: { p_quote_id: string; p_contractor_id: string }; Returns: undefined };
      admin_approve: { Args: { p_quote_id: string }; Returns: undefined };
      mark_paid: { Args: { p_quote_id: string }; Returns: undefined };
    };
  };
}
