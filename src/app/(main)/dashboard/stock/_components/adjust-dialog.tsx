"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { adjustStock } from "@/app/(main)/dashboard/stock/actions";
import { useRouter } from "next/navigation";

type LotOption = {
  id: string;
  lot_no: string;
  qty_remaining: number;
  landed_unit_cost: number;
};

export function AdjustDialog({
  productId,
  lots,
  canSeeCost,
}: {
  productId: string;
  lots: LotOption[];
  canSeeCost: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [lotId, setLotId] = useState(lots[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const selectedLot = lots.find((l) => l.id === lotId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await adjustStock({
        product_id: productId,
        lot_id: lotId,
        qty,
        unit_cost: unitCost,
        note: note || null,
        direction,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      setNote("");
      setQty(1);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Adjust
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stock adjustment</DialogTitle>
          <DialogDescription>
            Increase or decrease a lot. Out adjustments reduce qty_remaining.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={direction === "in" ? "default" : "outline"}
              onClick={() => setDirection("in")}
              className="flex-1"
            >
              + In
            </Button>
            <Button
              type="button"
              variant={direction === "out" ? "default" : "outline"}
              onClick={() => setDirection("out")}
              className="flex-1"
            >
              − Out
            </Button>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Lot</span>
            <select
              value={lotId}
              onChange={(e) => {
                setLotId(e.target.value);
                const l = lots.find((x) => x.id === e.target.value);
                if (l) setUnitCost(l.landed_unit_cost);
              }}
              className="border-input bg-background rounded-md border px-3 py-2 text-sm"
            >
              {lots.length === 0 && <option value="">No lots</option>}
              {lots.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.lot_no} — {l.qty_remaining} avail
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Quantity</span>
            <Input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              required
            />
          </label>

          {canSeeCost && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Unit cost (THB)</span>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={unitCost}
                onChange={(e) => setUnitCost(Number(e.target.value))}
              />
            </label>
          )}

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Note</span>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Stocktake / damage / recount"
            />
          </label>

          {selectedLot && direction === "out" && qty > selectedLot.qty_remaining && (
            <div className="text-destructive text-xs">
              Exceeds available qty ({selectedLot.qty_remaining})
            </div>
          )}
          {error && <div className="text-destructive text-xs">{error}</div>}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !lotId}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
