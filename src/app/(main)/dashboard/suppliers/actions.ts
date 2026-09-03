"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";

import { supplierSchema } from "./_lib/schema";

export async function upsertSupplier(input: unknown, id?: string | null) {
  const parsed = supplierSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid input" };
  await requireRole(["owner", "manager"]);
  const supabase = await createClient();

  const { error } = await supabase.from("suppliers").upsert(
    {
      ...(id ? { id } : {}),
      code: parsed.data.code || null,
      name: parsed.data.name,
      shop_name: parsed.data.shop_name || null,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      line_id: parsed.data.line_id || null,
      contact_person: parsed.data.contact_person || null,
      tax_id: parsed.data.tax_id || null,
      bank_account: parsed.data.bank_account || null,
      payment_terms_days: parsed.data.payment_terms_days,
      lead_time_days: parsed.data.lead_time_days ?? null,
      rating: parsed.data.rating ?? null,
      note: parsed.data.note || null,
      is_active: parsed.data.is_active,
    },
    { onConflict: "id" }
  );

  if (error) {
    const isCodeConflict = error.message.includes("suppliers_code_unique");
    if (isCodeConflict) return { ok: false as const, error: "Supplier code already exists" };
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/dashboard/suppliers");
  return { ok: true as const };
}

export async function deleteSupplier(id: string) {
  await requireRole(["owner", "manager"]);
  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/dashboard/suppliers");
  return { ok: true as const };
}
