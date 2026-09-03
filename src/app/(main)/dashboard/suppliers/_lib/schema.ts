import { z } from "zod";

export const supplierSchema = z.object({
  code: z.string().nullable().optional(),
  name: z.string().min(1, "name is required"),
  shop_name: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  line_id: z.string().nullable().optional(),
  contact_person: z.string().nullable().optional(),
  tax_id: z.string().nullable().optional(),
  bank_account: z.string().nullable().optional(),
  payment_terms_days: z.coerce.number().int().min(0).default(0),
  lead_time_days: z.coerce.number().int().positive().nullable().optional(),
  rating: z.coerce.number().int().min(1).max(5).nullable().optional(),
  note: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
export type SupplierRow = {
  id: string;
  code: string | null;
  name: string;
  shop_name: string | null;
  address: string | null;
  phone: string | null;
  line_id: string | null;
  contact_person: string | null;
  tax_id: string | null;
  bank_account: string | null;
  payment_terms_days: number;
  lead_time_days: number | null;
  rating: number | null;
  note: string | null;
  is_active: boolean;
  created_at: string;
};
