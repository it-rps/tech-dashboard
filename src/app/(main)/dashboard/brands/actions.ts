"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";

import type { BrandInput, BrandRow } from "./_lib/schema";
import { brandSchema } from "./_lib/schema";

export async function getBrands(): Promise<BrandRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, note, is_active, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as BrandRow[];
}

export async function upsertBrand(input: unknown, brandId?: string | null) {
  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid input" };
  }
  await requireRole(["owner", "manager"]);
  const supabase = await createClient();

  const { error } = await supabase.from("brands").upsert(
    {
      ...(brandId ? { id: brandId } : {}),
      name: parsed.data.name,
      note: parsed.data.note || null,
      is_active: parsed.data.is_active,
    },
    { onConflict: "id" },
  );

  const isNameConflict = error?.message.includes("brands_name_unique") || error?.code === "23505";
  if (error && !isNameConflict) return { ok: false as const, error: error.message };
  if (isNameConflict) return { ok: false as const, error: "Brand name already exists" };

  revalidatePath("/dashboard/brands");
  return { ok: true as const };
}

export async function deleteBrand(id: string) {
  await requireRole(["owner", "manager"]);
  const supabase = await createClient();
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/dashboard/brands");
  return { ok: true as const };
}
