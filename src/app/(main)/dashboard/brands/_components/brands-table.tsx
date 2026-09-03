"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";

import { type BrandRow, brandSchema } from "../_lib/schema";
import { deleteBrand, upsertBrand } from "../actions";

type FormInput = z.input<typeof brandSchema>;

function BrandForm({ brand, onClose }: { brand?: BrandRow | null; onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit } = useForm<FormInput>({
    resolver: zodResolver(brandSchema),
    defaultValues: brand
      ? { name: brand.name, note: brand.note ?? "", is_active: brand.is_active }
      : { name: "", note: "", is_active: true },
  });

  const onSubmit = async (data: FormInput) => {
    setIsSubmitting(true);
    const result = await upsertBrand(data, brand?.id ?? null);
    if (result.ok) {
      toast.success(brand ? "Brand updated" : "Brand created");
      onClose();
    } else {
      toast.error(result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Brand name *</Label>
        <Input id="name" {...register("name")} />
      </div>
      <div>
        <Label htmlFor="note">Note</Label>
        <Input id="note" {...register("note")} />
      </div>
      <div className="flex items-center gap-2">
        <Switch id="is_active" {...register("is_active")} defaultChecked={brand?.is_active ?? true} />
        <Label htmlFor="is_active" className="font-normal">
          Active
        </Label>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function BrandsTable({ brands }: { brands: BrandRow[] }) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BrandRow | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filtered = brands.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Dialog
          open={dialogOpen || !!editing}
          onOpenChange={(o) => {
            setDialogOpen(o);
            if (!o) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4 mr-2" /> Add Brand
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Brand" : "Add Brand"}</DialogTitle>
              <DialogDescription>Enter brand details</DialogDescription>
            </DialogHeader>
            <BrandForm
              brand={editing}
              onClose={() => {
                setDialogOpen(false);
                setEditing(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Name</th>
              <th className="py-2">Note</th>
              <th className="py-2">Status</th>
              <th className="py-2 w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="border-b">
                <td className="py-2">{b.name}</td>
                <td className="py-2 text-muted-foreground">{b.note ?? "-"}</td>
                <td className="py-2">
                  <Badge variant={b.is_active ? "default" : "secondary"}>{b.is_active ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="py-2">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(b)}>
                      <Edit className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={isDeleting === b.id}
                      onClick={async () => {
                        setIsDeleting(b.id);
                        const result = await deleteBrand(b.id);
                        if (result.ok) toast.success("Brand deleted");
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
              <tr>
                <td colSpan={4} className="py-6 text-center text-muted-foreground">
                  No brands
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
