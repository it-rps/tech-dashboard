import { requireUser } from "@/lib/auth/guard";

import { ReportsTabs } from "../_components/reports-tabs";
import {
  getAgingStock,
  getLowStock,
  getRepairRevenue,
  getSalesByDay,
  getStockValueByBrand,
  getTechCommission,
  getTopProducts,
  getWarrantyExpiry,
} from "../_lib/dashboard-queries";

export default async function ReportsPage() {
  await requireUser();
  const [lowStock, salesByDay, topProducts, repairRevenue, techComm, warrantyExpiry, agingStock, stockByBrand] =
    await Promise.all([
      getLowStock(),
      getSalesByDay(),
      getTopProducts(),
      getRepairRevenue(),
      getTechCommission(),
      getWarrantyExpiry(),
      getAgingStock(),
      getStockValueByBrand(),
    ]);

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-medium text-3xl leading-none tracking-tight">Reports</h1>
        <p className="text-muted-foreground text-sm">8 reports across stock, sales, repairs, warranties</p>
      </header>
      <ReportsTabs
        lowStock={lowStock}
        salesByDay={salesByDay}
        topProducts={topProducts}
        repairRevenue={repairRevenue}
        techComm={techComm}
        warrantyExpiry={warrantyExpiry}
        agingStock={agingStock}
        stockByBrand={stockByBrand}
      />
    </div>
  );
}