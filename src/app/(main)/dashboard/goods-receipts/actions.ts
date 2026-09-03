"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";
import { goodsReceiptSchema } from "./_lib/schema";
import type { GoodsReceiptRow, GoodsReceiptItemRow } from "./_lib/schema";

export async function getGoodsReceipts(): Promise<GoodsReceiptRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goods_receipts")
    .select(
      `id, doc_no, supplier_id, goods_receipts_supplier_id_fkey!inner(name), purchase_order_id, purchase_order:purchase_order_id!inner(doc_no), received_date, shipping_cost, note, created_at`,
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    doc_no: r.doc_no,
    supplier_id: r.supplier_id,
    supplier_name: r.goods_receipts_supplier_id_fkey?.name ?? null,
    purchase_order_id: r.purchase_order_id,
    po_doc_no: r.purchase_order?.doc_no ?? null,
    received_date: r.received_date,
    shipping_cost: r.shipping_cost,
    note: r.note ?? null,
    created_at: r.created_at,
  })) as GoodsReceiptRow[];
}

export async function getGoodsReceipt(id: string) {
  const supabase = await createClient();
  const { data: gr, error: grErr } = await supabase
    .from("goods_receipts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (grErr) throw new Error(grErr.message);
  const { data: items, error: itemsErr } = await supabase
    .from("goods_receipt_items")
    .select("id, product_id, products!inner(sku, name_th), qty, unit_cost")
    .eq("goods_receipt_id", id);
  if (itemsErr) throw new Error(itemsErr.message);
  return {
    ...gr,
    items: (items ?? []).map((i) => ({
      id: i.id,
      product_id: i.product_id,
      product_sku: i.products?.sku ?? null,
      product_name: i.products?.name_th ?? null,
      qty: i.qty,
      unit_cost: i.unit_cost,
    })) as GoodsReceiptItemRow[],
  };
}

export async function getPurchaseOrdersForSelect() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("id, doc_no, suppliers!inner(name), status")
    .in("status", ["ordered", "partial"])
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    doc_no: r.doc_no,
    supplier_name: r.suppliers?.name ?? null,
    status: r.status,
  }));
}

export async function getProductsForSelect() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, sku, name_th, track_serial")
    .eq("is_active", true)
    .order("name_th", { ascending: true })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({
    id: p.id,
    sku: p.sku,
    name_th: p.name_th,
    track_serial: p.track_serial,
  }));
}

export async function getSuppliersForSelect() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => ({ id: s.id, name: s.name }));
}

export async function upsertGoodsReceipt(input: unknown) {
  const parsed = goodsReceiptSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid input" };
  await requireRole(["owner", "manager"]);
  const supabase = await createClient();

  const itemsJsonb = parsed.data.items.map((i) => ({
    purchase_order_item_id: i.purchase_order_item_id ?? null,
    product_id: i.product_id,
    qty: i.qty,
    unit_cost: i.unit_cost,
  }));

  // receive_goods RPC does the full transaction
  const { error } = await supabase.rpc("receive_goods" as never, {
    p_supplier_id: parsed.data.supplier_id,
    p_purchase_order_id: parsed.data.purchase_order_id ?? null,
    p_received_date: parsed.data.received_date ?? null,
    p_shipping_cost: parsed.data.shipping_cost ?? 0,
    p_note: parsed.data.note ?? null,
    p_items: itemsJsonb,
  } as never);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/dashboard/goods-receipts");
  return { ok: true as const };
}

export async function deleteGoodsReceipt(id: string) {
  await requireRole(["owner", "manager"]);
  const supabase = await createClient();
  const { error } = await supabase.from("goods_receipts").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/dashboard/goods-receipts");
  return { ok: true as const };
}
