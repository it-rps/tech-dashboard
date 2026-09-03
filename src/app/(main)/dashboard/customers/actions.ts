"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";

import { customerSchema } from "./_lib/schema";

export async function upsertCustomer(input: unknown, id?: string | null) {
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid input" };
  await requireRole(["owner", "manager"]);
  const supabase = await createClient();

  const { error } = await supabase.from("customers").upsert(
    {
      ...(id ? { id } : {}),
      code: parsed.data.code || null,
      name: parsed.data.name,
      kind: parsed.data.kind,
      default_price_tier: parsed.data.default_price_tier,
      commission_eligible: parsed.data.commission_eligible,
      phone: parsed.data.phone || null,
      line_id: parsed.data.line_id || null,
      address: parsed.data.address || null,
      tax_id: parsed.data.tax_id || null,
      credit_limit: parsed.data.credit_limit,
      credit_terms_days: parsed.data.credit_terms_days,
      note: parsed.data.note ?? null,
      is_active: parsed.data.is_active,
    },
    { onConflict: "id" }
  );

  if (error) {
    if (error.message.includes("customers_code_unique")) {
      return { ok: false as const, error: "Customer code already exists" };
    }
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/dashboard/customers");
  return { ok: true as const };
}

export async function deleteCustomer(id: string) {
  await requireRole(["owner", "manager"]);
  const supabase = await createClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/dashboard/customers");
  return { ok: true as const };
}