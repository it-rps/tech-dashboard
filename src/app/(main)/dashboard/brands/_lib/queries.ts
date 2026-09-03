import "server-only";

import { createClient } from "@/lib/supabase/server";

export type BrandRow = {
  id: string;
  name: string;
  note: string | null;
  is_active: boolean;
  created_at: string;
};

export async function getBrands(): Promise<BrandRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, note, is_active, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as BrandRow[];
}
