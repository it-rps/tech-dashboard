"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { deleteGoodsReceipt, upsertGoodsReceipt } from "../actions";
import { goodsReceiptSchema } from "../_lib/schema";
import type { GoodsReceiptRow, GoodsReceiptInput } from "../_lib/schema";

type Supplier = { id: string; name: string };
type Product = { id: string; sku: string; name_th: string };
type PurchaseOrder = { id: string; doc_no: string; supplier_name: string | null; status: string };

export function GoodsReceiptsTable({
  goodsReceipts,
  suppliers,
  products,
  purchaseOrders,
}: {
  goodsReceipts: GoodsReceiptRow[];
  suppliers: Supplier[];
  products: Product[];
  purchaseOrders: PurchaseOrder[];
}) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = goodsReceipts.filter(
    (g) =>
      g.doc_no.toLowerCase().includes(search.toLowerCase()) ||
      (g.supplier_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Search GR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Goods Receipt</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add Goods Receipt</DialogTitle>
              <DialogDescription>Record received goods</DialogDescription>
            </DialogHeader>
            <GoodsReceiptForm
              suppliers={suppliers}
              products={products}
              purchaseOrders={purchaseOrders}
              onClose={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Doc No</th>
              <th className="py-2">Supplier</th>
              <th className="py-2">Date</th>
              <th className="py-2">PO</th>
              <th className="py-2 w-[120px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr key={g.id} className="border-b">
                <td className="py-2">{g.doc_no}</td>
                <td className="py-2 text-muted-foreground">{g.supplier_name ?? "-"}</td>
                <td className="py-2">{g.received_date?.split("T")[0]}</td>
                <td className="py-2">{g.po_doc_no ?? "-"}</td>
                <td className="py-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={deleting === g.id}
                    onClick={async () => {
                      setDeleting(g.id);
                      const result = await deleteGoodsReceipt(g.id);
                      if (result.ok) toast.success("Deleted");
                      else toast.error(result.error);
                      setDeleting(null);
                    }}
                  >
                    🗑️
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-muted-foreground">
                  No goods receipts
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GoodsReceiptForm({
  suppliers,
  products,
  purchaseOrders,
  onClose,
}: {
  suppliers: Supplier[];
  products: Product[];
  purchaseOrders: PurchaseOrder[];
  onClose: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.input<typeof goodsReceiptSchema>>({
    resolver: zodResolver(goodsReceiptSchema) as never,
    defaultValues: {
      supplier_id: "",
      purchase_order_id: undefined,
      shipping_cost: 0,
      note: "",
      items: [{ product_id: "", qty: 1, unit_cost: 0 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  const onSubmit = async (data: z.input<typeof goodsReceiptSchema>) => {
    setIsSubmitting(true);
    const result = await upsertGoodsReceipt(data as never as GoodsReceiptInput);
    if (result.ok) {
      toast.success("GR created");
      onClose();
    } else {
      toast.error(result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit as never)} className="space-y-4">
      <Controller
        control={form.control}
        name="supplier_id"
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger>
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

      <Controller
        control={form.control}
        name="purchase_order_id"
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value ?? ""}>
            <SelectTrigger>
              <SelectValue placeholder="Link PO (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {purchaseOrders.map((po) => (
                <SelectItem key={po.id} value={po.id}>{po.doc_no} — {po.supplier_name ?? "-"} ({po.status})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

      <Controller
        control={form.control}
        name="shipping_cost"
        render={({ field }) => (
          <div>
            <Label>Shipping Cost</Label>
            <Input type="number" min={0} step={0.01} {...field} value={field.value as string | number} />
          </div>
        )}
      />

      <div>
        <Label>Items</Label>
        {fields.map((f, i) => (
          <div key={f.id} className="flex items-end gap-2 mb-2">
            <Select
              onValueChange={(v) => form.setValue(`items.${i}.product_id`, v)}
              defaultValue={f.product_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.sku} — {p.name_th}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Controller
              control={form.control}
              name={`items.${i}.qty` as never}
              render={({ field }) => <Input type="number" min={1} placeholder="Qty" {...field} className="w-20" />}
            />
            <Controller
              control={form.control}
              name={`items.${i}.unit_cost` as never}
              render={({ field }) => <Input type="number" min={0} step={0.01} placeholder="Unit Cost" {...field} className="w-32" />}
            />
            {fields.length > 1 && (
              <Button type="button" variant="ghost" onClick={() => remove(i)}>✕</Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: "", qty: 1, unit_cost: 0 })}>
          Add item
        </Button>
      </div>

      <Controller
        control={form.control}
        name="note"
        render={({ field }) => (
          <div>
            <Label>Note</Label>
            <Input {...field} value={field.value ?? ""} placeholder="Note" />
          </div>
        )}
      />

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
      </DialogFooter>
    </form>
  );
}
