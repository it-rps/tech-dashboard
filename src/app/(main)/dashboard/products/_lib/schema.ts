import { z } from "zod";

export const productSchema = z.object({
  sku: z.string().min(1, "sku is required"),
  barcode: z.string().nullish(),
  name_th: z.string().min(1, "name_th is required"),
  name_en: z.string().nullish(),
  category_id: z.string().uuid("category_id is required"),
  brand_id: z.string().uuid().nullish(),
  capacity_mah: z.coerce.number().int().nullish(),
  requires_tagon: z.boolean().default(false),
  track_serial: z.boolean().default(false),
  warranty_days: z.coerce.number().int().nullish(),
  reorder_point: z.coerce.number().int().min(0).default(0),
  unit: z.string().default("piece"),
  is_active: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;
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
