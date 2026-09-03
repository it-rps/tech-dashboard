import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { KpiRow } from "../_lib/dashboard-queries";

const nf = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });

export function KpiGrid({ k }: { k: KpiRow }) {
  const tiles = [
    { label: "Stock value", value: nf.format(k.total_stock_value ?? 0), sub: `${k.total_qty_available ?? 0} units available` },
    { label: "Low stock alerts", value: k.low_stock_count ?? 0, sub: "below reorder point" },
    { label: "Open jobs", value: k.open_jobs ?? 0, sub: "in progress" },
    { label: "Today repair revenue", value: nf.format(k.today_repair_revenue ?? 0), sub: "closed today" },
    { label: "Warranties expiring ≤7d", value: k.warranty_expiring_soon ?? 0, sub: "follow up" },
    { label: "Unpaid commission", value: nf.format(k.unpaid_commission ?? 0), sub: "this month" },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((t) => (
        <Card key={t.label}>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {t.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-3xl tabular-nums">{t.value}</div>
            <p className="text-muted-foreground text-xs">{t.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}