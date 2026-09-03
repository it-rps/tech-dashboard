import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ProductRow = {
  id: string;
  sku: string;
  barcode: string | null;
  name_th: string;
  name_en: string | null;
  category_id: string;
  brand_id: string | null;
  capacity_mah: number | null;
  requires_tagon: boolean;
  track_serial: boolean;
  warranty_days: number | null;
  reorder_point: number;
  unit: string;
  is_active: boolean;
  created_at: string;
};

export type ProductWithRefs = ProductRow & {
  category_name: string | null;
  brand_name: string | null;
};

export async function getProducts(): Promise<ProductWithRefs[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, sku, barcode, name_th, name_en, category_id, brand_id, capacity_mah, requires_tagon, track_serial, warranty_days, reorder_point, unit, is_active, created_at, categories(name_th), brands(name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((p: any) => ({
    ...p,
    category_name: p.categories?.name_th ?? null,
    brand_name: p.brands?.name ?? null,
  })) as ProductWithRefs[];
}

export async function getProduct(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, sku, barcode, name_th, name_en, category_id, brand_id, capacity_mah, requires_tagon, track_serial, warranty_days, reorder_point, unit, is_active, product_device_models(device_model_id), product_prices(tier, price)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
