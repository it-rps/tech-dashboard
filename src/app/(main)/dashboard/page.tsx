import Link from "next/link";

import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guard";

import { KpiGrid } from "./_components/kpi-grid";
import { getKpis } from "./_lib/dashboard-queries";

export default async function DashboardPage() {
  await requireUser();
  const k = await getKpis();

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-medium text-3xl leading-none tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Snapshot across stock, repairs, warranties, commissions</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/reports">All reports →</Link>
        </Button>
      </header>
      <KpiGrid k={k} />
    </div>
  );
}