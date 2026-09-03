"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

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

import { deletePurchaseOrder, upsertPurchaseOrder } from "../actions";
import { purchaseOrderSchema } from "../_lib/schema";
import type { PurchaseOrderRow, PurchaseOrderInput } from "../_lib/schema";
import type { z } from "zod";

// ponytail: product/supplier lookup minimal — fetches options from public API.
// In full: use Supabase select for real list. For Phase 2 scaffold this is enough.

export function PurchaseOrdersTable({ purchaseOrders, suppliers, products }: {
  purchaseOrders: PurchaseOrderRow[];
  suppliers: Array<{ id: string; name: string }>;
  products: Array<{ id: string; sku: string; name_th: string }>;
}) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PurchaseOrderRow | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = purchaseOrders.filter((p) =>
    p.doc_no.toLowerCase().includes(search.toLowerCase()) ||
    (p.supplier_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Search PO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Dialog
          open={dialogOpen || !!editing}
          onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>Add Purchase Order</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit PO" : "Add PO"}</DialogTitle>
              <DialogDescription>Enter purchase order details</DialogDescription>
            </DialogHeader>
            <PurchaseOrderForm
              po={editing ?? null}
              suppliers={suppliers}
              products={products}
              onClose={() => { setDialogOpen(false); setEditing(null); }}
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
              <th className="py-2">Status</th>
              <th className="py-2">Total</th>
              <th className="py-2 w-[120px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-2">{p.doc_no}</td>
                <td className="py-2 text-muted-foreground">{p.supplier_name ?? "-"}</td>
                <td className="py-2">{p.order_date?.split("T")[0]}</td>
                <td className="py-2">
                  <Badge variant={p.status === "draft" ? "secondary" : "default"}>{p.status}</Badge>
                </td>
                <td className="py-2">{p.grand_total.toFixed(2)}</td>
                <td className="py-2">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(p)}>
                      ✏️
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={deleting === p.id}
                      onClick={async () => {
                        setDeleting(p.id);
                        const result = await deletePurchaseOrder(p.id);
                        if (result.ok) toast.success("Deleted");
                        else toast.error(result.error);
                        setDeleting(null);
                      }}
                    >
                      🗑️
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-muted-foreground">
                  No purchase orders
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PurchaseOrderForm({
  po,
  suppliers,
  products,
  onClose,
}: {
  po: PurchaseOrderRow | null;
  suppliers: Array<{ id: string; name: string }>;
  products: Array<{ id: string; sku: string; name_th: string }>;
  onClose: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.input<typeof purchaseOrderSchema>>({
    resolver: zodResolver(purchaseOrderSchema) as never,
    defaultValues: po
      ? { supplier_id: po.supplier_id, expected_date: po.expected_date ?? "", tax_mode: po.tax_mode as never, vat_rate: po.vat_rate, shipping_cost: po.shipping_cost, other_cost: po.other_cost, note: po.note ?? "", items: [] }
      : { supplier_id: "", tax_mode: "none", vat_rate: 7, shipping_cost: 0, other_cost: 0, items: [{ product_id: "", qty_ordered: 1, unit_cost: 0 }] },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  const onSubmit = async (data: z.input<typeof purchaseOrderSchema>) => {
    setIsSubmitting(true);
    const result = await upsertPurchaseOrder(data as never as PurchaseOrderInput, po?.id ?? null);
    if (result.ok) {
      toast.success(po ? "PO updated" : "PO created");
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
            <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      />
      <Controller
        control={form.control}
        name="expected_date"
        render={({ field }) => <Input type="date" {...field} value={field.value ?? ""} />}
      />
      <Controller
        control={form.control}
        name="tax_mode"
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Tax</SelectItem>
              <SelectItem value="exclusive">VAT Exclusive</SelectItem>
              <SelectItem value="inclusive">VAT Inclusive</SelectItem>
            </SelectContent>
          </Select>
        )}
      />
      <Controller
        control={form.control}
        name="vat_rate"
        render={({ field }) => (<div><Label>VAT Rate % (0-100)</Label><Input type="number" {...field} value={field.value as string | number} /></div>)}
      />

      <div>
        <Label>Items</Label>
        {fields.map((f, i) => (
          <div key={f.id} className="flex items-end gap-2 mb-2">
            <Select onValueChange={(v) => form.setValue(`items.${i}.product_id`, v)} defaultValue={f.product_id}>
              <SelectTrigger><SelectValue placeholder="Product" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.sku} — {p.name_th}</SelectItem>)}
              </SelectContent>
            </Select>
            <Controller control={form.control} name={`items.${i}.qty_ordered` as any} render={({ field }) => <Input type="number" min={1} placeholder="Qty" {...field} className="w-20" />} />
            <Controller control={form.control} name={`items.${i}.unit_cost` as any} render={({ field }) => <Input type="number" min={0} step={0.01} placeholder="Unit Cost" {...field} className="w-32" />} />
            {fields.length > 1 && <Button type="button" variant="ghost" onClick={() => remove(i)}>✕</Button>}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: "", qty_ordered: 1, unit_cost: 0 })}>Add item</Button>
      </div>

      <Controller
        control={form.control}
        name="shipping_cost"
        render={({ field }) => (<div><Label>Shipping Cost</Label><Input type="number" min={0} step={0.01} {...field} value={field.value as string | number} /></div>)}
      />
      <Controller
        control={form.control}
        name="other_cost"
        render={({ field }) => (<div><Label>Other Cost</Label><Input type="number" min={0} step={0.01} {...field} value={field.value as string | number} /></div>)}
      />
      <Controller
        control={form.control}
        name="note"
        render={({ field }) => (<div><Label>Note</Label><Input {...field} value={field.value ?? ""} placeholder="Note" /></div>)}
      />

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
      </DialogFooter>
    </form>
  );
}
