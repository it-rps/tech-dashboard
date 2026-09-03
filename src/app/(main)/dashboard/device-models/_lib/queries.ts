import "server-only";

import { createClient } from "@/lib/supabase/server";

export type DeviceModelRow = {
  id: string;
  name: string;
  device_type: string;
  series: string | null;
  release_year: number | null;
  sort_order: number;
  is_active: boolean;
};

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
