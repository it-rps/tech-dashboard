import { notFound } from "next/navigation";
import Link from "next/link";

import { requireUser, canSeeCost } from "@/lib/auth/guard";
import { formatTHB } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { AdjustDialog } from "../_components/adjust-dialog";
import { getProductLots } from "../_lib/queries";

export default async function ProductStockDetail({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  const { profile } = await requireUser();
  const data = await getProductLots(productId, profile.role);
  if (!data) notFound();

  const { product: p, lots } = data;

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-medium text-3xl leading-none tracking-tight">
            {p.name_th}
          </h1>
          <p className="text-muted-foreground text-sm">
            {p.sku ?? "No SKU"} · {p.category_slug ?? "—"} · {p.brand_name ?? "—"}
          </p>
        </div>
        <Link
          href="/dashboard/stock"
          className="text-muted-foreground text-sm underline-offset-4 hover:underline"
        >
          ← Back to Stock
        </Link>
      </header>

      {/* Summary row */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Available: </span>
          <span className="font-medium tabular-nums">{p.qty_available}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Reserved: </span>
          <span className="font-medium tabular-nums">{p.qty_reserved}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Defective: </span>
          <span className="font-medium tabular-nums">{p.qty_defective}</span>
        </div>
        {profile.role === "owner" || profile.role === "manager" ? (
          <>
            <div>
              <span className="text-muted-foreground">WAC: </span>
              <span className="font-medium tabular-nums">
                {formatTHB(p.wac_cost ?? 0)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Value: </span>
              <span className="font-medium tabular-nums">
                {formatTHB(p.stock_value ?? 0)}
              </span>
            </div>
          </>
        ) : null}
      </div>

      {/* Adjust button + Lots heading */}
      <div className="flex items-center justify-between">
        {profile.role === "owner" || profile.role === "manager" ? (
          <AdjustDialog
            productId={p.product_id}
            lots={lots}
            canSeeCost={canSeeCost(profile.role)}
          />
        ) : (
          <div />
        )}
        <span className="text-muted-foreground text-xs">
          {lots.length} lot{lots.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Lots table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr className="text-left">
              <th className="p-2 font-medium">Lot</th>
              <th className="hidden p-2 font-medium sm:table-cell">Received</th>
              <th className="p-2 font-medium text-right">Current</th>
              <th className="hidden p-2 font-medium text-right md:table-cell">
                Unit Cost
              </th>
              <th className="hidden p-2 font-medium md:table-cell">Status</th>
            </tr>
          </thead>
          <tbody>
            {lots.length === 0 && (
              <tr>
                <td colSpan={5} className="text-muted-foreground py-8 text-center">
                  No inventory lots
                </td>
              </tr>
            )}
            {lots.map((lot) => (
              <tr key={lot.id} className="border-b last:border-0">
                <td className="p-2">
                  <span className="font-medium">{lot.lot_no}</span>
                </td>
                <td className="hidden p-2 tabular-nums sm:table-cell">
                  {lot.qty_received}
                </td>
                <td className="p-2 text-right tabular-nums">{lot.qty_remaining}</td>
                <td className="hidden p-2 text-right tabular-nums md:table-cell">
                  {formatTHB(lot.landed_unit_cost)}
                </td>
                <td className="hidden p-2 md:table-cell">
                  <Badge
                    variant={
                      lot.qty_remaining === 0
                        ? "destructive"
                        : lot.qty_remaining < lot.qty_received
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {lot.qty_remaining === 0
                      ? "depleted"
                      : lot.qty_remaining < lot.qty_received
                        ? "partial"
                        : "full"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
