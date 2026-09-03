"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Plus, Search, Trash2, Users } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { deleteCustomer, upsertCustomer } from "../actions";
import { customerSchema } from "../_lib/schema";
import type { CustomerRow } from "../_lib/queries";

type FormInput = z.input<typeof customerSchema>;

const kinds = [
  { value: "dealer", label: "Dealer" },
  { value: "walkin", label: "Walk-in" },
  { value: "internal", label: "Internal" },
] as const;

const priceTiers = [
  { value: "wholesale", label: "Wholesale" },
  { value: "retail", label: "Retail" },
] as const;

function CustomerForm({ customer, onClose }: { customer?: CustomerRow | null; onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, watch } = useForm<FormInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer
      ? {
          code: customer.code ?? undefined,
          name: customer.name,
          kind: customer.kind as "dealer" | "walkin" | "internal",
          default_price_tier: customer.default_price_tier as "wholesale" | "retail",
          commission_eligible: customer.commission_eligible,
          phone: customer.phone ?? undefined,
          line_id: customer.line_id ?? undefined,
          address: customer.address ?? undefined,
          tax_id: customer.tax_id ?? undefined,
          credit_limit: customer.credit_limit,
          credit_terms_days: customer.credit_terms_days,
          note: customer.note ?? undefined,
          is_active: customer.is_active,
        }
      : {
          name: "",
          code: undefined,
          kind: "walkin",
          default_price_tier: "retail",
          commission_eligible: true,
          phone: undefined,
          line_id: undefined,
          address: undefined,
          tax_id: undefined,
          credit_limit: 0,
          credit_terms_days: 0,
          note: undefined,
          is_active: true,
        },
  });

  const onSubmit = async (data: FormInput) => {
    setIsSubmitting(true);
    const result = await upsertCustomer(data, customer?.id ?? null);
    if (result.ok) {
      toast.success(customer ? "Customer updated" : "Customer created");
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
          <Input id="code" {...register("code")} placeholder="e.g. WAL" />
        </div>
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input id="name" {...register("name")} />
        </div>
        <div>
          <Label htmlFor="kind">Kind *</Label>
          <Select defaultValue={watch("kind")}>
            <SelectTrigger id="kind">
              <SelectValue placeholder="Select kind" />
            </SelectTrigger>
            <SelectContent>
              {kinds.map((k) => (
                <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" {...register("kind")} />
        </div>
        <div>
          <Label htmlFor="default_price_tier">Default Price Tier</Label>
          <Select defaultValue={watch("default_price_tier")}>
            <SelectTrigger id="default_price_tier">
              <SelectValue placeholder="Select tier" />
            </SelectTrigger>
            <SelectContent>
              {priceTiers.map((pt) => (
                <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" {...register("default_price_tier")} />
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
          <Label htmlFor="tax_id">Tax ID</Label>
          <Input id="tax_id" {...register("tax_id")} />
        </div>
        <div>
          <Label htmlFor="credit_limit">Credit Limit</Label>
          <Input id="credit_limit" type="number" {...register("credit_limit", { valueAsNumber: true })} />
        </div>
        <div>
          <Label htmlFor="credit_terms_days">Credit Terms (days)</Label>
          <Input id="credit_terms_days" type="number" {...register("credit_terms_days", { valueAsNumber: true })} />
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
          <Switch id="is_active" {...register("is_active")} defaultChecked={customer?.is_active ?? true} />
          <Label htmlFor="is_active" className="font-normal">Active</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="commission_eligible" {...register("commission_eligible")} defaultChecked={customer?.commission_eligible ?? true} />
          <Label htmlFor="commission_eligible" className="font-normal">Commission Eligible</Label>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
      </DialogFooter>
    </form>
  );
}

export function CustomersTable({ customers }: { customers: CustomerRow[] }) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.code ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Dialog open={dialogOpen || !!editing} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4 mr-2" /> Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Customer" : "Add Customer"}</DialogTitle>
              <DialogDescription>Enter customer details</DialogDescription>
            </DialogHeader>
            <CustomerForm
              customer={editing}
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
              <th className="py-2">Kind</th>
              <th className="py-2">Price Tier</th>
              <th className="py-2">Phone</th>
              <th className="py-2">Status</th>
              <th className="py-2 w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="py-2 font-mono">{c.code ?? "-"}</td>
                <td className="py-2">{c.name}</td>
                <td className="py-2 capitalize">{c.kind}</td>
                <td className="py-2 capitalize">{c.default_price_tier}</td>
                <td className="py-2 text-muted-foreground">{c.phone ?? "-"}</td>
                <td className="py-2">
                  <Badge variant={c.is_active ? "default" : "secondary"}>
                    {c.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="py-2">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(c)}>
                      <Edit className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={isDeleting === c.id}
                      onClick={async () => {
                        setIsDeleting(c.id);
                        const result = await deleteCustomer(c.id);
                        if (result.ok) toast.success("Customer deleted");
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
              <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">No customers</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}