"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";

import { productSchema } from "./_lib/schema";

export async function upsertProduct(input: unknown, id?: string | null) {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid input" };
  await requireRole(["owner", "manager"]);
  const supabase = await createClient();

  const payload: any = {
    ...(id ? { id } : {}),
    sku: parsed.data.sku,
    barcode: parsed.data.barcode || null,
    name_th: parsed.data.name_th,
    name_en: parsed.data.name_en || null,
    category_id: parsed.data.category_id,
    brand_id: parsed.data.brand_id || null,
    capacity_mah: parsed.data.capacity_mah ?? null,
    requires_tagon: parsed.data.requires_tagon,
    track_serial: parsed.data.track_serial,
    warranty_days: parsed.data.warranty_days ?? null,
    reorder_point: parsed.data.reorder_point,
    unit: parsed.data.unit,
    is_active: parsed.data.is_active,
  };

  const { error } = await supabase.from("products").upsert(payload, { onConflict: "id" });
  if (error) {
    if (error.message.includes("products_sku_unique")) {
      return { ok: false as const, error: "SKU already exists" };
    }
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/dashboard/products");
  return { ok: true as const };
}

export async function deleteProduct(id: string) {
  await requireRole(["owner", "manager"]);
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/dashboard/products");
  return { ok: true as const };
}

export async function upsertProductPrices(
  productId: string,
  prices: Array<{ tier: string; price: number }>
) {
  await requireRole(["owner", "manager"]);
  const supabase = await createClient();
  for (const p of prices) {
    const { error } = await supabase
      .from("product_prices")
      .upsert({ product_id: productId, tier: p.tier as "wholesale" | "retail", price: p.price }, { onConflict: "product_id,tier" });
    if (error) return { ok: false as const, error: error.message };
  }
  revalidatePath("/dashboard/products");
  return { ok: true as const };
}

export async function syncProductDeviceModels(productId: string, modelIds: string[]) {
  await requireRole(["owner", "manager"]);
  const supabase = await createClient();
  const { error: delError } = await supabase
    .from("product_device_models")
    .delete()
    .eq("product_id", productId);
  if (delError) return { ok: false as const, error: delError.message };
  if (modelIds.length === 0) {
    revalidatePath("/dashboard/products");
    return { ok: true as const };
  }
  const rows = modelIds.map((mid) => ({ product_id: productId, device_model_id: mid }));
  const { error } = await supabase.from("product_device_models").insert(rows);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/dashboard/products");
  return { ok: true as const };
}
