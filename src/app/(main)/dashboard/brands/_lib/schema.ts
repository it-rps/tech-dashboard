import { z } from "zod";

export const brandSchema = z.object({
  name: z.string().min(1, "Name is required"),
  note: z.string().default(""),
  is_active: z.boolean().default(true),
});

export type BrandInput = z.infer<typeof brandSchema>;
export type BrandRow = {
  id: string;
  name: string;
  note: string | null;
  is_active: boolean;
  created_at: string;
};
