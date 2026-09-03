import "server-only";

import { createClient } from "@/lib/supabase/server";
import { canSeeCost } from "@/lib/auth/guard";
import type { Database } from "@/lib/supabase/database.types";

type Role = Database["public"]["Enums"]["user_role"];

export type StockRow = {
  product_id: string;
  sku: string | null;
  name_th: string;
  name_en: string | null;
  category_slug: string | null;
  brand_name: string | null;
  reorder_point: number;
  qty_good: number;
  qty_reserved: number;
  qty_available: number;
  qty_defective: number;
  qty_scrap: number;
  wac_cost: number;
  last_cost: number;
  stock_value: number;
};

export async function getStockSummary(
  role: Role,
  params: { q?: string; categorySlug?: string },
): Promise<{ rows: StockRow[]; total: number; canSeeCost: boolean }> {
  const supabase = await createClient();
  const canCost = canSeeCost(role);
  const cols = canCost
    ? "product_id, sku, name_th, name_en, category_slug, brand_name, reorder_point, qty_good, qty_reserved, qty_available, qty_defective, qty_scrap, wac_cost, last_cost, stock_value"
    : "product_id, sku, name_th, name_en, category_slug, brand_name, reorder_point, qty_good, qty_reserved, qty_available, qty_defective, qty_scrap";

  let query = supabase.from("v_stock_summary").select(cols, { count: "exact" });
  if (params.q) query = query.or(`sku.ilike.%${params.q}%,name_th.ilike.%${params.q}%`);
  if (params.categorySlug) query = query.eq("category_slug", params.categorySlug);

  const { data, count, error } = await query
    .order("name_th", { ascending: true })
    .limit(500);

  if (error) throw new Error(error.message);
  return {
    rows: (data ?? []) as unknown as StockRow[],
    total: count ?? 0,
    canSeeCost: canCost,
  };
}
