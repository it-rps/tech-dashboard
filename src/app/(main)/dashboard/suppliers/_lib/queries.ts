import "server-only";

import { createClient } from "@/lib/supabase/server";

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

export async function getSuppliers(): Promise<SupplierRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select(
      "id, code, name, shop_name, address, phone, line_id, contact_person, tax_id, bank_account, payment_terms_days, lead_time_days, rating, note, is_active, created_at"
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SupplierRow[];
}
