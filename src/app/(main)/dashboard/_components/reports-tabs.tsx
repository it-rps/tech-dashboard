"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  AgingRow,
  BrandValueRow,
  LowStockRow,
  RepairRevenueRow,
  SalesRow,
  TechCommRow,
  TopProductRow,
  WarrantyRow,
} from "../_lib/dashboard-queries";

const nf = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });

export function ReportsTabs({
  lowStock,
  salesByDay,
  topProducts,
  repairRevenue,
  techComm,
  warrantyExpiry,
  agingStock,
  stockByBrand,
}: {
  lowStock: LowStockRow[];
  salesByDay: SalesRow[];
  topProducts: TopProductRow[];
  repairRevenue: RepairRevenueRow[];
  techComm: TechCommRow[];
  warrantyExpiry: WarrantyRow[];
  agingStock: AgingRow[];
  stockByBrand: BrandValueRow[];
}) {
  return (
    <Tabs defaultValue="low-stock" className="flex flex-col gap-4">
      <TabsList className="flex flex-wrap">
        <TabsTrigger value="low-stock">Low stock</TabsTrigger>
        <TabsTrigger value="sales">Sales 30d</TabsTrigger>
        <TabsTrigger value="top-products">Top products</TabsTrigger>
        <TabsTrigger value="repair">Repair revenue</TabsTrigger>
        <TabsTrigger value="commission">Commission</TabsTrigger>
        <TabsTrigger value="warranty">Warranty</TabsTrigger>
        <TabsTrigger value="aging">Aging stock</TabsTrigger>
        <TabsTrigger value="by-brand">By brand</TabsTrigger>
      </TabsList>

      <TabsContent value="low-stock">
        <ReportTable
          title="Low stock alerts"
          subtitle="qty_available < reorder_point"
          cols={["Product", "Brand", "Available", "Reorder", "Shortage"]}
          rows={lowStock.map((r) => [
            `${r.name_th}${r.sku ? ` (${r.sku})` : ""}`,
            r.brand_name ?? "—",
            r.qty_available,
            r.reorder_point,
            r.shortage,
          ])}
        />
      </TabsContent>

      <TabsContent value="sales">
        <ReportTable
          title="Sales last 30 days"
          cols={["Day", "Orders", "Revenue", "VAT"]}
          rows={salesByDay.map((r) => [r.day, r.orders, nf.format(r.revenue ?? 0), nf.format(r.vat ?? 0)])}
        />
      </TabsContent>

      <TabsContent value="top-products">
        <ReportTable
          title="Top products (last 30d)"
          cols={["SKU", "Product", "Qty sold", "Revenue"]}
          rows={topProducts.map((p) => [p.sku ?? "—", p.name_th, p.qty_sold, nf.format(p.revenue ?? 0)])}
        />
      </TabsContent>

      <TabsContent value="repair">
        <ReportTable
          title="Repair revenue (last 30d)"
          cols={["Day", "Jobs", "Parts", "Labour", "Total", "Profit"]}
          rows={repairRevenue.map((r) => [
            r.day,
            r.jobs,
            nf.format(r.parts_revenue ?? 0),
            nf.format(r.labor_revenue ?? 0),
            nf.format(r.total ?? 0),
            nf.format(r.profit ?? 0),
          ])}
        />
      </TabsContent>

      <TabsContent value="commission">
        <ReportTable
          title="Technician commission (this month)"
          cols={["Technician", "Jobs", "Commission", "Paid?"]}
          rows={techComm.map((t) => [
            t.full_name,
            t.jobs,
            nf.format(t.commission ?? 0),
            t.any_paid ? "yes" : "no",
          ])}
          empty="No commission entries yet"
        />
      </TabsContent>

      <TabsContent value="warranty">
        <ReportTable
          title="Warranty expiring (≤30 days)"
          cols={["Customer", "Device IMEI", "Product", "End date", "Days left"]}
          rows={warrantyExpiry.map((w) => [
            w.customer_name ?? "—",
            w.device_imei ?? "—",
            w.product_name ?? "—",
            w.end_date,
            w.days_left,
          ])}
          empty="No warranties expiring soon"
        />
      </TabsContent>

      <TabsContent value="aging">
        <ReportTable
          title="Aging stock (oldest lots first)"
          cols={["Lot", "Product", "Qty", "Value", "Received", "Age (d)"]}
          rows={agingStock.map((a) => [
            a.lot_no,
            `${a.product_name}${a.sku ? ` (${a.sku})` : ""}`,
            a.qty_remaining,
            nf.format(a.lot_value ?? 0),
            a.received_at?.split("T")[0],
            a.age_days,
          ])}
        />
      </TabsContent>

      <TabsContent value="by-brand">
        <ReportTable
          title="Stock value by brand"
          cols={["Brand", "Products", "Total qty", "Total value"]}
          rows={stockByBrand.map((b) => [b.brand, b.products, b.total_qty, nf.format(b.total_value ?? 0)])}
        />
      </TabsContent>
    </Tabs>
  );
}

function ReportTable({
  title,
  subtitle,
  cols,
  rows,
  empty = "No data",
}: {
  title: string;
  subtitle?: string;
  cols: string[];
  rows: (string | number | null)[][];
  empty?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                {cols.map((c) => (
                  <th key={c} className="py-2 font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b">
                  {r.map((cell, j) => (
                    <td
                      key={j}
                      className={`py-2 ${typeof cell === "number" ? "tabular-nums" : "text-muted-foreground"}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={cols.length} className="py-6 text-center text-muted-foreground">
                    {empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}