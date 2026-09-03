"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
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

import { deleteProduct, upsertProduct } from "../actions";
import { productSchema } from "../_lib/schema";
import type { ProductWithRefs } from "../_lib/queries";

type FormInput = z.input<typeof productSchema>;

type Option = { id: string; name: string };

function ProductForm({
  product,
  categories,
  brands,
  onClose,
}: {
  product?: ProductWithRefs | null;
  categories: Option[];
  brands: Option[];
  onClose: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, control } = useForm<FormInput>({
    resolver: zodResolver(productSchema) as never,
    defaultValues: product
      ? {
          sku: product.sku,
          barcode: product.barcode ?? undefined,
          name_th: product.name_th,
          name_en: product.name_en ?? undefined,
          category_id: product.category_id,
          brand_id: product.brand_id ?? undefined,
          capacity_mah: product.capacity_mah ?? undefined,
          requires_tagon: product.requires_tagon,
          track_serial: product.track_serial,
          warranty_days: product.warranty_days ?? undefined,
          reorder_point: product.reorder_point,
          unit: product.unit,
          is_active: product.is_active,
        }
      : {
          sku: "",
          barcode: undefined,
          name_th: "",
          name_en: undefined,
          category_id: categories[0]?.id ?? "",
          brand_id: undefined,
          capacity_mah: undefined,
          requires_tagon: false,
          track_serial: false,
          warranty_days: undefined,
          reorder_point: 0,
          unit: "piece",
          is_active: true,
        },
  });

  const onSubmit = async (data: FormInput) => {
    setIsSubmitting(true);
    const result = await upsertProduct(data, product?.id ?? null);
    if (result.ok) {
      toast.success(product ? "Product updated" : "Product created");
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
          <Label htmlFor="sku">SKU *</Label>
          <Input id="sku" {...register("sku")} placeholder="e.g. APP-BAT-15P-5200" />
        </div>
        <div>
          <Label htmlFor="barcode">Barcode</Label>
          <Input id="barcode" {...register("barcode")} />
        </div>
        <div>
          <Label htmlFor="name_th">Name (TH) *</Label>
          <Input id="name_th" {...register("name_th")} />
        </div>
        <div>
          <Label htmlFor="name_en">Name (EN)</Label>
          <Input id="name_en" {...register("name_en")} />
        </div>
        <div>
          <Label htmlFor="category_id">Category *</Label>
          <Controller
            control={control}
            name="category_id"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="category_id">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <Label htmlFor="brand_id">Brand</Label>
          <Controller
            control={control}
            name="brand_id"
            render={({ field }) => (
              <Select onValueChange={(v) => field.onChange(v || undefined)} value={field.value ?? ""}>
                <SelectTrigger id="brand_id">
                  <SelectValue placeholder="Select brand (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <Label htmlFor="capacity_mah">Capacity (mAh)</Label>
          <Input id="capacity_mah" type="number" {...register("capacity_mah", { valueAsNumber: true })} />
        </div>
        <div>
          <Label htmlFor="warranty_days">Warranty (days)</Label>
          <Input id="warranty_days" type="number" {...register("warranty_days", { valueAsNumber: true })} />
        </div>
        <div>
          <Label htmlFor="reorder_point">Reorder Point</Label>
          <Input id="reorder_point" type="number" {...register("reorder_point", { valueAsNumber: true })} />
        </div>
        <div>
          <Label htmlFor="unit">Unit</Label>
          <Input id="unit" {...register("unit")} />
        </div>
        <div className="flex items-center gap-2">
          <Switch id="requires_tagon" {...register("requires_tagon")} defaultChecked={product?.requires_tagon ?? false} />
          <Label htmlFor="requires_tagon" className="font-normal">Requires Tagon</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="track_serial" {...register("track_serial")} defaultChecked={product?.track_serial ?? false} />
          <Label htmlFor="track_serial" className="font-normal">Track Serial</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="is_active" {...register("is_active")} defaultChecked={product?.is_active ?? true} />
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

export function ProductsTable({
  products,
  categories,
  brands,
}: {
  products: ProductWithRefs[];
  categories: Option[];
  brands: Option[];
}) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductWithRefs | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filtered = products.filter(
    (p) =>
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.name_th.toLowerCase().includes(search.toLowerCase()) ||
      (p.name_en ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Dialog open={dialogOpen || !!editing} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4 mr-2" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
              <DialogDescription>Enter product details</DialogDescription>
            </DialogHeader>
            <ProductForm
              product={editing}
              categories={categories}
              brands={brands}
              onClose={() => { setDialogOpen(false); setEditing(null); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">SKU</th>
              <th className="py-2">Name (TH)</th>
              <th className="py-2">Category</th>
              <th className="py-2">Brand</th>
              <th className="py-2">Status</th>
              <th className="py-2 w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-2 font-mono text-xs">{p.sku}</td>
                <td className="py-2">{p.name_th}</td>
                <td className="py-2 text-muted-foreground">{p.category_name ?? "-"}</td>
                <td className="py-2 text-muted-foreground">{p.brand_name ?? "-"}</td>
                <td className="py-2">
                  <Badge variant={p.is_active ? "default" : "secondary"}>
                    {p.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="py-2">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(p)}>
                      <Edit className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={isDeleting === p.id}
                      onClick={async () => {
                        setIsDeleting(p.id);
                        const result = await deleteProduct(p.id);
                        if (result.ok) toast.success("Product deleted");
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
              <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No products</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}