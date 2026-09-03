import { z } from "zod";

export const categorySchema = z.object({
  name_th: z.string().min(1, "name_th is required"),
  name_en: z.string().min(1, "name_en is required"),
  slug: z.string().min(1, "slug is required"),
  requires_imei: z.boolean().default(false),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type CategoryRow = {
  id: string;
  slug: string;
  name_th: string;
  name_en: string;
  requires_imei: boolean;
  sort_order: number;
  is_active: boolean;
};
