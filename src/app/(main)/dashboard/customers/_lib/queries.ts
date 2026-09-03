import "server-only";

import { createClient } from "@/lib/supabase/server";

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

export async function getCustomers(): Promise<CustomerRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, code, name, kind, default_price_tier, commission_eligible, phone, line_id, address, tax_id, credit_limit, credit_terms_days, note, is_active, created_at"
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CustomerRow[];
}