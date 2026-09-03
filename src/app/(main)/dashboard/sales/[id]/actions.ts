"use server";

import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";

const nf = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });

export type ReceiptOrder = {
  id: string;
  doc_no: string;
  sold_at: string;
  tax_mode: string;
  vat_rate: number;
  subtotal: number;
  vat_amount: number;
  grand_total: number;
  discount: number;
  note: string | null;
  customer_name: string | null;
  customer_kind: string | null;
};

export type ReceiptItem = {
  id: string;
  product_name: string;
  sku: string | null;
  qty: number;
  unit_price: number;
  unit_cost: number;
  line_total: number;
};

export async function getReceipt(orderId: string): Promise<{ order: ReceiptOrder; items: ReceiptItem[] }> {
  await requireUser();
  const supabase = await createClient();

  const { data: orderRow, error: oErr } = await supabase
    .from("sales_orders")
    .select("id, doc_no, sold_at, tax_mode, vat_rate, subtotal, vat_amount, grand_total, discount, note, customers!inner(name, kind)")
    .eq("id", orderId)
    .single();
  if (oErr || !orderRow) return notFound();

  const { data: itemRows, error: iErr } = await supabase
    .from("sales_order_items")
    .select("id, qty, unit_price, unit_cost, products!inner(name_th, sku)")
    .eq("sales_order_id", orderId);
  if (iErr) throw new Error(iErr.message);

  const order: ReceiptOrder = {
    id: orderRow.id,
    doc_no: orderRow.doc_no,
    sold_at: orderRow.sold_at,
    tax_mode: orderRow.tax_mode,
    vat_rate: orderRow.vat_rate,
    subtotal: orderRow.subtotal,
    vat_amount: orderRow.vat_amount,
    grand_total: orderRow.grand_total,
    discount: orderRow.discount,
    note: orderRow.note,
    customer_name: orderRow.customers?.name ?? null,
    customer_kind: orderRow.customers?.kind ?? null,
  };
  const items: ReceiptItem[] = (itemRows ?? []).map((r) => ({
    id: r.id,
    product_name: r.products?.name_th ?? "",
    sku: r.products?.sku ?? null,
    qty: r.qty,
    unit_price: r.unit_price,
    unit_cost: r.unit_cost,
    line_total: r.qty * r.unit_price,
  }));

  return { order, items };
}