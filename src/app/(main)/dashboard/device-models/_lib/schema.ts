import { z } from "zod";

export const deviceModelSchema = z.object({
  name: z.string().min(1, "name is required"),
  device_type: z.enum(["iphone", "ipad", "macbook"]),
  series: z.string().nullish(),
  release_year: z.coerce.number().int().nullable(),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

export type DeviceModelInput = z.infer<typeof deviceModelSchema>;
export type DeviceModelRow = {
  id: string;
  name: string;
  device_type: string;
  series: string | null;
  release_year: number | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};
