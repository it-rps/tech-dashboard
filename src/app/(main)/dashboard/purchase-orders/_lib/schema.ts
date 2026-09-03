import { z } from "zod";

export const purchaseOrderItemSchema = z.object({
  product_id: z.string().uuid(),
  qty_ordered: z.coerce.number().int().min(1),
  unit_cost: z.coerce.number().min(0),
});

export const purchaseOrderSchema = z.object({
  supplier_id: z.string().uuid(),
  expected_date: z.string().nullish(),
  tax_mode: z.enum(["none", "inclusive", "exclusive"]).default("none"),
  vat_rate: z.coerce.number().min(0).max(100).default(7.0),
  shipping_cost: z.coerce.number().min(0).default(0),
  other_cost: z.coerce.number().min(0).default(0),
  note: z.string().nullish(),
  items: z.array(purchaseOrderItemSchema).min(1, "Add at least one item"),
});

export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;

export type PurchaseOrderRow = {
  id: string;
  doc_no: string;
  supplier_id: string;
  supplier_name: string | null;
  status: string;
  order_date: string;
  expected_date: string | null;
  tax_mode: string;
  vat_rate: number;
  shipping_cost: number;
  other_cost: number;
  subtotal: number;
  vat_amount: number;
  grand_total: number;
  note: string | null;
  created_at: string;
};

export type PurchaseOrderItemRow = {
  id: string;
  product_id: string;
  product_sku: string | null;
  product_name: string | null;
  qty_ordered: number;
  qty_received: number;
  unit_cost: number;
};
