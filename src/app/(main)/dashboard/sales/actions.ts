"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";
import { createSalesOrderSchema } from "./_lib/schema";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type CustomerOption = { id: string; name: string; kind: string; default_price_tier: string };
export type ProductOption = { id: string; sku: string; name_th: string; track_serial: boolean };
export type SalesOrderRow = {
  id: string;
  doc_no: string;
  customer_name: string | null;
  sold_at: string;
  tax_mode: string;
  vat_rate: number;
  subtotal: number;
  vat_amount: number;
  grand_total: number;
};

export async function getCustomersForSelect(): Promise<CustomerOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, kind, default_price_tier")
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as CustomerOption[];
}

export async function getProductsForSales(): Promise<ProductOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, sku, name_th, track_serial")
    .eq("is_active", true)
    .order("name_th");
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductOption[];
}

export async function getSalesOrders(): Promise<SalesOrderRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales_orders")
    .select("id, doc_no, sold_at, tax_mode, vat_rate, subtotal, vat_amount, grand_total, customers!inner(name)")
    .order("sold_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    doc_no: r.doc_no,
    customer_name: r.customers?.name ?? null,
    sold_at: r.sold_at,
    tax_mode: r.tax_mode,
    vat_rate: r.vat_rate,
    subtotal: r.subtotal,
    vat_amount: r.vat_amount,
    grand_total: r.grand_total,
  }));
}

export async function createSalesOrder(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { profile } = await requireRole(["owner", "manager", "technician"]);
  const parsed = createSalesOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data: orderId, error } = await supabase.rpc("create_sales_order", {
    p_customer_id: parsed.data.customer_id,
    p_price_tier: parsed.data.price_tier,
    p_tax_mode: parsed.data.tax_mode,
    p_vat_rate: parsed.data.vat_rate,
    p_discount: parsed.data.discount,
    p_note: (parsed.data.note ?? null) as string,
    p_items: parsed.data.items as never,
    p_actor_id: profile.id,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/sales");
  return { ok: true, data: { id: (orderId ?? "") as string } };
}