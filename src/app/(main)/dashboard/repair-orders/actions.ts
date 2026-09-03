"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ─── queries ───────────────────────────────────────────────

export type RepairJobRow = {
  id: string;
  doc_no: string;
  status: string;
  job_kind: string;
  customer_id: string;
  customer_name: string | null;
  device_model_id: string | null;
  device_imei: string | null;
  symptom: string | null;
  received_at: string;
  closed_at: string | null;
  grand_total: number;
};

export async function getRepairJobs(): Promise<RepairJobRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("repair_jobs")
    .select(
      `id, doc_no, status, job_kind, customer_id, device_model_id, device_imei, symptom, received_at, closed_at, grand_total, customers!inner(name)`,
    )
    .order("received_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    doc_no: r.doc_no,
    status: r.status,
    job_kind: r.job_kind,
    customer_id: r.customer_id,
    customer_name: r.customers?.name ?? null,
    device_model_id: r.device_model_id,
    device_imei: r.device_imei,
    symptom: r.symptom,
    received_at: r.received_at,
    closed_at: r.closed_at,
    grand_total: r.grand_total,
  }));
}

export type CustomerOption = { id: string; name: string; kind: string; default_price_tier: string };
export type DeviceModelOption = { id: string; name: string };
export type ProductOption = { id: string; sku: string; name_th: string; track_serial: boolean };
export type TechnicianOption = { id: string; full_name: string };

export async function getCustomersForSelect(): Promise<CustomerOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, kind, default_price_tier")
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as CustomerOption[];
}

export async function getDeviceModelsForSelect(): Promise<DeviceModelOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("device_models")
    .select("id, name")
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as DeviceModelOption[];
}

export async function getProductsForRepair(): Promise<ProductOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, sku, name_th, track_serial")
    .eq("is_active", true)
    .order("name_th");
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductOption[];
}

export async function getTechnicians(): Promise<TechnicianOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["owner", "manager", "technician"])
    .eq("is_active", true)
    .order("full_name");
  if (error) throw new Error(error.message);
  return (data ?? []) as TechnicianOption[];
}

// ─── mutations ─────────────────────────────────────────────

const itemSchema = z.object({
  product_id: z.string().uuid(),
  qty: z.coerce.number().int().min(1),
  unit_price: z.coerce.number().min(0),
  is_optional: z.boolean().default(false),
});

const intakeSchema = z.object({
  customer_id: z.string().uuid(),
  device_model_id: z.string().uuid().nullish(),
  device_imei: z.string().min(1, "IMEI is required"), // Rule Set L
  device_color: z.string().nullish(),
  passcode: z.string().nullish(),
  symptom: z.string().min(1, "Symptom is required"),
  diagnosis: z.string().nullish(),
  technician_id: z.string().uuid().nullish(),
  tax_mode: z.enum(["none", "inclusive", "exclusive"]).default("none"),
  vat_rate: z.coerce.number().min(0).default(7),
  note: z.string().nullish(),
  items: z.array(itemSchema).default([]), // empty = intake only, draw parts later
});

export async function createRepairJob(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { profile } = await requireRole(["owner", "manager", "technician"]);
  const parsed = intakeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await createClient();

  // resolve job_kind + price_tier from customer (Rule Set D)
  const { data: customer, error: custErr } = await supabase
    .from("customers")
    .select("kind, default_price_tier")
    .eq("id", parsed.data.customer_id)
    .single();
  if (custErr || !customer) return { ok: false, error: "Customer not found" };

  // 1) insert job header (doc_no from trigger)
  const payload: any = {
    customer_id: parsed.data.customer_id,
    job_kind: customer.kind,
    device_model_id: parsed.data.device_model_id ?? null,
    device_imei: parsed.data.device_imei,
    device_color: parsed.data.device_color ?? null,
    passcode: parsed.data.passcode ?? null,
    symptom: parsed.data.symptom,
    diagnosis: parsed.data.diagnosis ?? null,
    technician_id: parsed.data.technician_id ?? profile.id,
    tax_mode: parsed.data.tax_mode,
    vat_rate: parsed.data.vat_rate,
    note: parsed.data.note ?? null,
    created_by: profile.id,
  };
  const { data: job, error: jobErr } = await supabase
    .from("repair_jobs")
    .insert(payload)
    .select("id, doc_no")
    .single();
  if (jobErr || !job) return { ok: false, error: jobErr?.message ?? "Create failed" };

  // 2) insert items (reservation only, per Rule Set B)
  if (parsed.data.items.length > 0) {
    const { error: itemsErr } = await supabase
      .from("repair_job_items")
      .insert(
        parsed.data.items.map((i) => ({
          repair_job_id: job.id,
          product_id: i.product_id,
          qty: i.qty,
          unit_price: i.unit_price,
          is_optional: i.is_optional,
        })),
      );
    if (itemsErr) {
      // best-effort cleanup
      await supabase.from("repair_jobs").delete().eq("id", job.id);
      return { ok: false, error: itemsErr.message };
    }

    // reserve: increment inventory_lots.qty_reserved (FIFO)
    for (const it of parsed.data.items) {
      const { error: rsvErr } = await supabase.rpc("reserve_stock" as never, {
        p_product_id: it.product_id,
        p_qty: it.qty,
      } as never);
      if (rsvErr) {
        return {
          ok: false,
          error: `Reservation failed for product ${it.product_id}: ${rsvErr.message}`,
        };
      }
    }
  }

  revalidatePath("/dashboard/repair-orders");
  return { ok: true, data: { id: job.id } };
}

const closeSchema = z.object({
  job_id: z.string().uuid(),
  labor_fee: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
});

export async function closeRepairJob(input: unknown): Promise<ActionResult<{ jobId: string }>> {
  const { profile } = await requireRole(["owner", "manager", "technician"]);
  const parsed = closeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("close_repair_job" as never, {
    p_job_id: parsed.data.job_id,
    p_labor_fee: parsed.data.labor_fee,
    p_discount: parsed.data.discount,
    p_actor_id: profile.id,
  } as never);

  if (error) {
    if (error.message.includes("STOCK_INSUFFICIENT")) {
      return { ok: false, error: "Not enough stock to close this job" };
    }
    if (error.message.includes("MIMEI_REQUIRED")) {
      return { ok: false, error: "Device IMEI is required to close a job" };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/repair-orders");
  revalidatePath(`/dashboard/repair-orders/${parsed.data.job_id}`);
  revalidatePath("/dashboard/stock");
  return { ok: true, data: { jobId: parsed.data.job_id } };
}
