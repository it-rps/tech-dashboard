import "server-only";

import { createClient } from "@/lib/supabase/server";

export type KpiRow = {
  total_stock_value: number | null;
  total_qty_available: number | null;
  low_stock_count: number | null;
  open_jobs: number | null;
  warranty_expiring_soon: number | null;
  today_repair_revenue: number | null;
  unpaid_commission: number | null;
};

export async function getKpis(): Promise<KpiRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_dashboard_kpis")
    .select()
    .single();
  if (error) throw new Error(error.message);
  return (data ?? {}) as KpiRow;
}

export type LowStockRow = {
  product_id: string;
  sku: string | null;
  name_th: string;
  brand_name: string | null;
  qty_available: number;
  reorder_point: number;
  shortage: number;
};

export async function getLowStock(): Promise<LowStockRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_low_stock")
    .select()
    .order("shortage", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as LowStockRow[];
}

export type SalesRow = {
  day: string;
  orders: number;
  revenue: number | null;
  vat: number | null;
};

export async function getSalesByDay(): Promise<SalesRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_sales_by_day")
    .select()
    .order("day", { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SalesRow[];
}

export type RepairRevenueRow = {
  day: string;
  jobs: number;
  parts_revenue: number | null;
  labor_revenue: number | null;
  total: number | null;
  profit: number | null;
};

export async function getRepairRevenue(): Promise<RepairRevenueRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_repair_revenue")
    .select()
    .order("day", { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as RepairRevenueRow[];
}

export type TechCommRow = {
  technician_id: string;
  full_name: string;
  jobs: number;
  commission: number | null;
  any_paid: boolean | null;
};

export async function getTechCommission(): Promise<TechCommRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_tech_commission")
    .select()
    .order("commission", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as TechCommRow[];
}

export type WarrantyRow = {
  id: string;
  customer_name: string | null;
  device_imei: string | null;
  product_name: string | null;
  end_date: string;
  days_left: number;
};

export async function getWarrantyExpiry(): Promise<WarrantyRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_warranty_expiry")
    .select()
    .order("end_date")
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as WarrantyRow[];
}

export type AgingRow = {
  lot_id: string;
  lot_no: string;
  product_name: string;
  sku: string | null;
  qty_remaining: number;
  lot_value: number | null;
  received_at: string;
  age_days: number;
};

export async function getAgingStock(): Promise<AgingRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_aging_stock")
    .select()
    .order("received_at")
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AgingRow[];
}

export type TopProductRow = {
  product_id: string;
  sku: string | null;
  name_th: string;
  qty_sold: number;
  revenue: number | null;
};

export async function getTopProducts(): Promise<TopProductRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_top_products_sold")
    .select()
    .order("revenue", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as TopProductRow[];
}

export type BrandValueRow = {
  brand: string;
  products: number;
  total_value: number | null;
  total_qty: number | null;
};

export async function getStockValueByBrand(): Promise<BrandValueRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_stock_value_by_brand")
    .select()
    .order("total_value", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as BrandValueRow[];
}
