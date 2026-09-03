import { z } from "zod";

export const salesOrderItemSchema = z.object({
  product_id: z.string().uuid(),
  qty: z.coerce.number().int().min(1),
  unit_price: z.coerce.number().min(0),
});

export const createSalesOrderSchema = z.object({
  customer_id: z.string().uuid(),
  price_tier: z.enum(["wholesale", "retail"]).default("retail"),
  tax_mode: z.enum(["none", "inclusive", "exclusive"]).default("none"),
  vat_rate: z.coerce.number().min(0).default(7),
  discount: z.coerce.number().min(0).default(0),
  note: z.string().nullish(),
  items: z.array(salesOrderItemSchema).min(1, "At least one item required"),
});