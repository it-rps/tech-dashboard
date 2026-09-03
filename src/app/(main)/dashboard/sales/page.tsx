import { Receipt } from "lucide-react";

import { requireUser } from "@/lib/auth/guard";

import { SalesOrdersTable } from "./_components/sales-orders-table";
import {
  getCustomersForSelect,
  getProductsForSales,
  getSalesOrders,
} from "./actions";

export default async function SalesPage() {
  await requireUser();
  const [rows, customers, products] = await Promise.all([
    getSalesOrders(),
    getCustomersForSelect(),
    getProductsForSales(),
  ]);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 font-medium text-3xl leading-none tracking-tight">
            <Receipt className="size-6 text-primary" /> Sales
          </h1>
          <p className="text-muted-foreground text-sm">{rows.length} orders · FIFO stock deduction</p>
        </div>
      </div>

      <SalesOrdersTable rows={rows} customers={customers} products={products} />
    </div>
  );
}