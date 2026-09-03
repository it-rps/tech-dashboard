"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";

import { deviceModelSchema } from "./_lib/schema";
import type { DeviceModelRow } from "./_lib/queries";

export async function getDeviceModels(): Promise<DeviceModelRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("device_models")
    .select("id, name, device_type, series, release_year, sort_order, is_active")
    .order("device_type", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as DeviceModelRow[];
}

export async function upsertDeviceModel(input: unknown, id?: string | null) {
  const parsed = deviceModelSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid input" };
  await requireRole(["owner", "manager"]);
  const supabase = await createClient();

  const { error } = await supabase.from("device_models").upsert(
    {
      ...(id ? { id } : {}),
      name: parsed.data.name,
      device_type: parsed.data.device_type,
      series: parsed.data.series || null,
      release_year: parsed.data.release_year ?? null,
      sort_order: parsed.data.sort_order,
      is_active: parsed.data.is_active,
    },
    { onConflict: "id" }
  );

  if (error) {
    const isUniqueConflict = error.message.includes("device_models_name_device_type_key");
    if (isUniqueConflict) return { ok: false as const, error: "Device model with this name and type already exists" };
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/dashboard/device-models");
  return { ok: true as const };
}

export async function deleteDeviceModel(id: string) {
  await requireRole(["owner", "manager"]);
  const supabase = await createClient();
  const { error } = await supabase.from("device_models").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/dashboard/device-models");
  return { ok: true as const };
}