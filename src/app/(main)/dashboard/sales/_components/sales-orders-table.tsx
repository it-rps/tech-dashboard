"use client";

import Link from "next/link";
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

import type { CustomerOption, ProductOption, SalesOrderRow } from "../actions";
import { createSalesOrder } from "../actions";
import { createSalesOrderSchema } from "../_lib/schema";

type FormInput = z.input<typeof createSalesOrderSchema>;

const nf = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });

export function SalesOrdersTable({
  rows,
  customers,
  products,
}: {
  rows: SalesOrderRow[];
  customers: CustomerOption[];
  products: ProductOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={() => setOpen(true)}>New sale</Button>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New sale</DialogTitle>
              <DialogDescription>Stock deducted FIFO on submit.</DialogDescription>
            </DialogHeader>
            <SalesForm
              customers={customers}
              products={products}
              onClose={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-3 py-2 font-medium">Doc</th>
              <th className="px-3 py-2 font-medium">Customer</th>
              <th className="px-3 py-2 font-medium">Sold</th>
              <th className="px-3 py-2 font-medium">VAT</th>
              <th className="px-3 py-2 text-right font-medium">Subtotal</th>
              <th className="px-3 py-2 text-right font-medium">VAT</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
              <th className="px-3 py-2 font-medium">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="px-3 py-2 font-medium">{r.doc_no}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.customer_name ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.sold_at?.split("T")[0]}</td>
                <td className="px-3 py-2">
                  <Badge variant="outline">{r.tax_mode}</Badge>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{nf.format(r.subtotal ?? 0)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{nf.format(r.vat_amount ?? 0)}</td>
                <td className="px-3 py-2 text-right font-medium tabular-nums">{nf.format(r.grand_total ?? 0)}</td>
                <td className="px-3 py-2">
                  <Link href={`/dashboard/sales/${r.id}`} className="text-primary underline-offset-4 hover:underline">
                    Print
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-muted-foreground">
                  No sales yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SalesForm({
  customers,
  products,
  onClose,
}: {
  customers: CustomerOption[];
  products: ProductOption[];
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<FormInput>({
    resolver: zodResolver(createSalesOrderSchema) as never,
    defaultValues: {
      customer_id: "",
      price_tier: "retail",
      tax_mode: "none",
      vat_rate: 7,
      discount: 0,
      note: "",
      items: [{ product_id: "", qty: 1, unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const watched = form.watch();

  const subtotal = (watched.items ?? []).reduce(
    (sum, it) => sum + Number(it.qty ?? 0) * Number(it.unit_price ?? 0),
    0,
  );
  const discount = Number(watched.discount ?? 0);
  const afterDiscount = Math.max(0, subtotal - discount);
  const r = Number(watched.vat_rate ?? 0) / 100;
  let vat = 0;
  let total = afterDiscount;
  if (watched.tax_mode === "exclusive") {
    vat = afterDiscount * r;
    total = afterDiscount + vat;
  } else if (watched.tax_mode === "inclusive") {
    vat = afterDiscount - afterDiscount / (1 + r);
    total = afterDiscount;
  }

  const onSubmit = async (data: FormInput) => {
    setSubmitting(true);
    const res = await createSalesOrder(data as never);
    if (res.ok) {
      toast.success(`Order created`);
      onClose();
    } else toast.error(res.error);
    setSubmitting(false);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Controller
          control={form.control}
          name="customer_id"
          render={({ field }) => (
            <div>
              <Label>Customer</Label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.kind})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />
        <Controller
          control={form.control}
          name="price_tier"
          render={({ field }) => (
            <div>
              <Label>Price tier</Label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="wholesale">Wholesale</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Controller
          control={form.control}
          name="tax_mode"
          render={({ field }) => (
            <div>
              <Label>VAT mode</Label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="inclusive">Inclusive</SelectItem>
                  <SelectItem value="exclusive">Exclusive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        />
        <Controller
          control={form.control}
          name="vat_rate"
          render={({ field }) => (
            <div>
              <Label>VAT %</Label>
              <Input type="number" min={0} step={0.01} {...field} value={field.value as number | string} />
            </div>
          )}
        />
        <Controller
          control={form.control}
          name="discount"
          render={({ field }) => (
            <div>
              <Label>Discount</Label>
              <Input type="number" min={0} step={0.01} {...field} value={field.value as number | string} />
            </div>
          )}
        />
      </div>

      <div>
        <Label>Items</Label>
        {fields.map((f, i) => (
          <div key={f.id} className="mb-2 flex items-end gap-2">
            <Controller
              control={form.control}
              name={`items.${i}.product_id` as never}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name_th} ({p.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <Controller
              control={form.control}
              name={`items.${i}.qty` as never}
              render={({ field }) => (
                <Input type="number" min={1} placeholder="Qty" {...field} className="w-20" />
              )}
            />
            <Controller
              control={form.control}
              name={`items.${i}.unit_price` as never}
              render={({ field }) => (
                <Input type="number" min={0} step={0.01} placeholder="Price" {...field} className="w-32" />
              )}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}>
              ✕
            </Button>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => append({ product_id: "", qty: 1, unit_price: 0 })}
        >
          Add item
        </Button>
      </div>

      <Controller
        control={form.control}
        name="note"
        render={({ field }) => (
          <div>
            <Label>Note</Label>
            <Input {...field} value={field.value ?? ""} />
          </div>
        )}
      />

      <div className="rounded-md border bg-muted/30 p-3 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="tabular-nums">{nf.format(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>After discount</span>
          <span className="tabular-nums">{nf.format(afterDiscount)}</span>
        </div>
        <div className="flex justify-between">
          <span>VAT</span>
          <span className="tabular-nums">{nf.format(vat)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t pt-2 font-medium">
          <span>Total</span>
          <span className="tabular-nums">{nf.format(total)}</span>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}