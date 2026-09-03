"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";

import type { CategoryInput, CategoryRow } from "./_lib/schema";
import { categorySchema } from "./_lib/schema";

export async function getCategories(): Promise<CategoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name_th, name_en, requires_imei, sort_order, is_active")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as CategoryRow[];
}

export async function upsertCategory(input: unknown, categoryId?: string | null) {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid input" };
  }
  await requireRole(["owner", "manager"]);
  const supabase = await createClient();

  const { error } = await supabase.from("categories").upsert(
    {
      ...(categoryId ? { id: categoryId } : {}),
      name_th: parsed.data.name_th,
      name_en: parsed.data.name_en,
      slug: parsed.data.slug,
      requires_imei: parsed.data.requires_imei,
      sort_order: parsed.data.sort_order,
      is_active: parsed.data.is_active,
    },
    { onConflict: "id" },
  );

  const isSlugConflict = error?.message.includes("categories_slug_unique") || error?.code === "23505";
  if (error && !isSlugConflict) return { ok: false as const, error: error.message };
  if (isSlugConflict) return { ok: false as const, error: "Category slug already exists" };

  revalidatePath("/dashboard/categories");
  return { ok: true as const };
}

export async function deleteCategory(id: string) {
  await requireRole(["owner", "manager"]);
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/dashboard/categories");
  return { ok: true as const };
}
