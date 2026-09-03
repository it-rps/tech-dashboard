import { z } from "zod";

export const goodsReceiptItemSchema = z.object({
  purchase_order_item_id: z.string().uuid().nullish(),
  product_id: z.string().uuid(),
  qty: z.coerce.number().int().min(1),
  unit_cost: z.coerce.number().min(0),
});

export const goodsReceiptSchema = z.object({
  supplier_id: z.string().uuid(),
  purchase_order_id: z.string().uuid().nullish(),
  received_date: z.string().nullish(),
  shipping_cost: z.coerce.number().min(0).default(0),
  note: z.string().nullish(),
  items: z.array(goodsReceiptItemSchema).min(1, "Add at least one item"),
});

export type GoodsReceiptInput = z.infer<typeof goodsReceiptSchema>;

export type GoodsReceiptRow = {
  id: string;
  doc_no: string;
  supplier_id: string;
  supplier_name: string | null;
  purchase_order_id: string | null;
  po_doc_no: string | null;
  received_date: string;
  shipping_cost: number;
  note: string | null;
  created_at: string;
};

export type GoodsReceiptItemRow = {
  id: string;
  product_id: string;
  product_sku: string | null;
  product_name: string | null;
  qty: number;
  unit_cost: number;
};
