"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { Switch } from "@/components/ui/switch";

import { deleteSupplier, upsertSupplier } from "../actions";
import { supplierSchema } from "../_lib/schema";
import type { SupplierRow } from "../_lib/queries";

type FormInput = z.input<typeof supplierSchema>;

function SupplierForm({ supplier, onClose }: { supplier?: SupplierRow | null; onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit } = useForm<FormInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier
      ? {
          code: supplier.code ?? undefined,
          name: supplier.name,
          shop_name: supplier.shop_name ?? undefined,
          address: supplier.address ?? undefined,
          phone: supplier.phone ?? undefined,
          line_id: supplier.line_id ?? undefined,
          contact_person: supplier.contact_person ?? undefined,
          tax_id: supplier.tax_id ?? undefined,
          bank_account: supplier.bank_account ?? undefined,
          payment_terms_days: supplier.payment_terms_days,
          lead_time_days: supplier.lead_time_days ?? undefined,
          rating: supplier.rating ?? undefined,
          note: supplier.note ?? undefined,
          is_active: supplier.is_active,
        }
      : {
          name: "",
          code: undefined,
          shop_name: undefined,
          address: undefined,
          phone: undefined,
          line_id: undefined,
          contact_person: undefined,
          tax_id: undefined,
          bank_account: undefined,
          payment_terms_days: 0,
          lead_time_days: undefined,
          rating: undefined,
          note: undefined,
          is_active: true,
        },
  });

  const onSubmit = async (data: FormInput) => {
    setIsSubmitting(true);
    const result = await upsertSupplier(data, supplier?.id ?? null);
    if (result.ok) {
      toast.success(supplier ? "Supplier updated" : "Supplier created");
      onClose();
    } else {
      toast.error(result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="code">Code</Label>
          <Input id="code" {...register("code")} placeholder="e.g. SV" />
        </div>
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input id="name" {...register("name")} />
        </div>
        <div>
          <Label htmlFor="shop_name">Shop name</Label>
          <Input id="shop_name" {...register("shop_name")} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} />
        </div>
        <div>
          <Label htmlFor="line_id">Line ID</Label>
          <Input id="line_id" {...register("line_id")} />
        </div>
        <div>
          <Label htmlFor="contact_person">Contact person</Label>
          <Input id="contact_person" {...register("contact_person")} />
        </div>
        <div>
          <Label htmlFor="tax_id">Tax ID</Label>
          <Input id="tax_id" {...register("tax_id")} />
        </div>
        <div>
          <Label htmlFor="bank_account">Bank account</Label>
          <Input id="bank_account" {...register("bank_account")} />
        </div>
        <div>
          <Label htmlFor="payment_terms_days">Payment terms (days)</Label>
          <Input id="payment_terms_days" type="number" {...register("payment_terms_days", { valueAsNumber: true })} />
        </div>
        <div>
          <Label htmlFor="lead_time_days">Lead time (days)</Label>
          <Input id="lead_time_days" type="number" {...register("lead_time_days", { valueAsNumber: true })} />
        </div>
        <div>
          <Label htmlFor="rating">Rating (1-5)</Label>
          <Input id="rating" type="number" min={1} max={5} {...register("rating", { valueAsNumber: true })} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" {...register("address")} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="note">Note</Label>
          <Input id="note" {...register("note")} />
        </div>
        <div className="flex items-center gap-2">
          <Switch id="is_active" {...register("is_active")} defaultChecked={supplier?.is_active ?? true} />
          <Label htmlFor="is_active" className="font-normal">Active</Label>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
      </DialogFooter>
    </form>
  );
}

export function SuppliersTable({ suppliers }: { suppliers: SupplierRow[] }) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierRow | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.code ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.phone ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Dialog open={dialogOpen || !!editing} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4 mr-2" /> Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
              <DialogDescription>Enter supplier details</DialogDescription>
            </DialogHeader>
            <SupplierForm
              supplier={editing}
              onClose={() => { setDialogOpen(false); setEditing(null); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Code</th>
              <th className="py-2">Name</th>
              <th className="py-2">Phone</th>
              <th className="py-2">Rating</th>
              <th className="py-2">Status</th>
              <th className="py-2 w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="py-2 font-mono">{s.code ?? "-"}</td>
                <td className="py-2">{s.name}</td>
                <td className="py-2 text-muted-foreground">{s.phone ?? "-"}</td>
                <td className="py-2">{s.rating ?? "-"}</td>
                <td className="py-2">
                  <Badge variant={s.is_active ? "default" : "secondary"}>
                    {s.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="py-2">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(s)}>
                      <Edit className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={isDeleting === s.id}
                      onClick={async () => {
                        setIsDeleting(s.id);
                        const result = await deleteSupplier(s.id);
                        if (result.ok) toast.success("Supplier deleted");
                        else toast.error(result.error);
                        setIsDeleting(null);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No suppliers</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
