"use client";

import { useState } from "react";
import { LayoutGrid, Table as TableIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { formatTHB } from "@/lib/money";
import type { StockRow } from "../_lib/queries";

type ViewMode = "auto" | "table" | "card";

export function StockTable({ rows, canSeeCost }: { rows: StockRow[]; canSeeCost: boolean }) {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<ViewMode>("auto");

  const filtered = rows.filter(
    (r) =>
      !q ||
      r.sku?.toLowerCase().includes(q.toLowerCase()) ||
      r.name_th.toLowerCase().includes(q.toLowerCase()),
  );

  const totalValue = canSeeCost ? filtered.reduce((s, r) => s + (r.stock_value ?? 0), 0) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Search SKU / name..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-full text-base sm:max-w-xs sm:text-sm"
        />
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && setMode(v as ViewMode)}
          size="sm"
        >
          <ToggleGroupItem value="card" aria-label="Card view" className="size-9">
            <LayoutGrid className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Table view" className="size-9">
            <TableIcon className="size-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {canSeeCost && totalValue > 0 && (
        <div className="text-muted-foreground text-sm">
          Stock value (by WAC): <span className="text-foreground tabular-nums">{formatTHB(totalValue)}</span>
        </div>
      )}

      {mode === "auto" && (
        <>
          <div className="md:hidden">
            <CardList rows={filtered} canSeeCost={canSeeCost} />
          </div>
          <div className="hidden md:block">
            <Table rows={filtered} canSeeCost={canSeeCost} />
          </div>
        </>
      )}
      {mode === "card" && <CardList rows={filtered} canSeeCost={canSeeCost} />}
      {mode === "table" && (
        <div className="w-full overflow-x-auto">
          <div className="min-w-[720px]">
            <Table rows={filtered} canSeeCost={canSeeCost} />
          </div>
        </div>
      )}
    </div>
  );
}

function Table({ rows, canSeeCost }: { rows: StockRow[]; canSeeCost: boolean }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b">
          <tr className="text-left">
            <th className="p-2 font-medium">Product</th>
            <th className="hidden p-2 font-medium sm:table-cell">SKU</th>
            <th className="hidden p-2 font-medium md:table-cell">Category</th>
            <th className="p-2 font-medium text-right">Avail.</th>
            <th className="hidden p-2 font-medium text-right xl:table-cell">Defect</th>
            {canSeeCost && <th className="hidden p-2 font-medium text-right md:table-cell">WAC</th>}
            {canSeeCost && <th className="hidden p-2 font-medium text-right xl:table-cell">Last</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={canSeeCost ? 7 : 5} className="text-muted-foreground py-8 text-center">
                No products
              </td>
            </tr>
          )}
          {rows.map((r) => {
            const isLow = r.qty_available <= r.reorder_point && r.qty_available > 0;
            const isOut = r.qty_available === 0;
            return (
              <tr key={r.product_id} className="border-b last:border-0">
                <td className="p-2">
                  <div className="min-w-0 flex flex-col">
                    <span className="truncate font-medium">{r.name_th}</span>
                    <span className="text-muted-foreground truncate text-xs sm:hidden">{r.sku}</span>
                  </div>
                </td>
                <td className="hidden p-2 sm:table-cell">{r.sku ?? "-"}</td>
                <td className="hidden p-2 md:table-cell">
                  <Badge variant={isOut ? "destructive" : isLow ? "secondary" : "outline"}>
                    {isOut ? "out" : isLow ? "low" : r.category_slug ?? "-"}
                  </Badge>
                </td>
                <td className="p-2 text-right tabular-nums">
                  {isOut ? "—" : isLow ? "⚠️ " : ""}
                  {r.qty_available}
                </td>
                <td className="hidden p-2 text-right tabular-nums xl:table-cell">{r.qty_defective ?? 0}</td>
                {canSeeCost && <td className="hidden p-2 text-right tabular-nums md:table-cell">{formatTHB(r.wac_cost ?? 0)}</td>}
                {canSeeCost && <td className="hidden p-2 text-right tabular-nums xl:table-cell">{formatTHB(r.last_cost ?? 0)}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CardList({ rows, canSeeCost }: { rows: StockRow[]; canSeeCost: boolean }) {
  if (rows.length === 0) return <div className="text-muted-foreground py-8 text-center text-sm">No products</div>;
  return (
    <div className="grid gap-3">
      {rows.map((r) => (
        <div key={r.product_id} className="flex flex-col gap-1 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 flex-1 truncate font-medium">{r.name_th}</span>
            <Badge variant={r.qty_available === 0 ? "destructive" : r.qty_available <= r.reorder_point ? "secondary" : "outline"}>
              {r.qty_available} avail.
            </Badge>
          </div>
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span>{r.sku ?? "—"} · {r.category_slug ?? "—"}</span>
            {canSeeCost && <span className="tabular-nums">WAC {formatTHB(r.wac_cost ?? 0)}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
