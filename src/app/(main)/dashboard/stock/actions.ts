"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";

const adjustSchema = z.object({
  product_id: z.string().uuid(),
  lot_id: z.string().uuid(),
  qty: z.number().int().positive(),
  unit_cost: z.number().nonnegative().default(0),
  note: z.string().optional().nullable(),
  direction: z.enum(["in", "out"]),
});

export type AdjustInput = z.infer<typeof adjustSchema>;

export async function adjustStock(input: unknown) {
  const parsed = adjustSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid input" };
  }
  await requireRole(["owner", "manager"]);
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  void user; // RPC reads auth.uid() server-side

  const qtyDelta =
    parsed.data.direction === "in" ? parsed.data.qty : -parsed.data.qty;

  const { error } = await supabase.rpc("adjust_stock" as never, {
    p_product_id: parsed.data.product_id,
    p_qty_delta: qtyDelta,
    p_unit_cost: parsed.data.unit_cost,
    p_lot_id: parsed.data.lot_id,
    p_note: parsed.data.note ?? null,
  } as never);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/dashboard/stock");
  revalidatePath(`/dashboard/stock/${parsed.data.product_id}`);
  return { ok: true as const };
}
