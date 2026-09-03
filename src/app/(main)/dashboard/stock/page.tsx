import { Suspense } from "react";

import { requireUser } from "@/lib/auth/guard";
import { TableSkeleton } from "@/components/shared/data-table/table-skeleton";
import { getStockSummary } from "./_lib/queries";
import { StockTable } from "./_components/stock-table";

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const { profile } = await requireUser();
  const data = await getStockSummary(profile.role, {
    q: sp.q,
    categorySlug: sp.category,
  });

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-medium text-3xl leading-none tracking-tight">Stock</h1>
          <p className="text-muted-foreground text-sm">{data.total} products</p>
        </div>
      </header>

      <Suspense fallback={<TableSkeleton />}>
        <StockTable rows={data.rows} canSeeCost={data.canSeeCost} />
      </Suspense>
    </div>
  );
}
