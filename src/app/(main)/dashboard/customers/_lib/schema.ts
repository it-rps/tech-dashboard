import { z } from "zod";

export const customerSchema = z.object({
  code: z.string().nullable().optional(),
  name: z.string().min(1, "name is required"),
  kind: z.enum(["dealer", "walkin", "internal"]),
  default_price_tier: z.enum(["wholesale", "retail"]).default("retail"),
  commission_eligible: z.boolean().default(true),
  phone: z.string().nullable().optional(),
  line_id: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  tax_id: z.string().nullable().optional(),
  credit_limit: z.coerce.number().min(0).default(0),
  credit_terms_days: z.coerce.number().int().min(0).default(0),
  note: z.string().nullish(),
  is_active: z.boolean().default(true),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type CustomerRow = {
  id: string;
  code: string | null;
  name: string;
  kind: string;
  default_price_tier: string;
  commission_eligible: boolean;
  phone: string | null;
  line_id: string | null;
  address: string | null;
  tax_id: string | null;
  credit_limit: number;
  credit_terms_days: number;
  note: string | null;
  is_active: boolean;
  created_at: string;
};
