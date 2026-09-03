import "server-only";

import { createClient } from "@/lib/supabase/server";

export type CategoryRow = {
  id: string;
  slug: string;
  name_th: string;
  name_en: string;
  requires_imei: boolean;
  sort_order: number;
  is_active: boolean;
};

export async function getCategories(): Promise<CategoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name_th, name_en, requires_imei, sort_order, is_active")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as CategoryRow[];
}
