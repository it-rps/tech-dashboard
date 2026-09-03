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

import { deleteCategory, upsertCategory } from "../actions";
import { categorySchema, type CategoryRow } from "../_lib/schema";

type FormInput = z.input<typeof categorySchema>;

function CategoryForm({ category, onClose }: { category?: CategoryRow | null; onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit } = useForm<FormInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? {
          name_th: category.name_th,
          name_en: category.name_en,
          slug: category.slug,
          requires_imei: category.requires_imei,
          sort_order: category.sort_order,
          is_active: category.is_active,
        }
      : {
          name_th: "",
          name_en: "",
          slug: "",
          requires_imei: false,
          sort_order: 0,
          is_active: true,
        },
  });

  const onSubmit = async (data: FormInput) => {
    setIsSubmitting(true);
    const result = await upsertCategory(data, category?.id ?? null);
    if (result.ok) {
      toast.success(category ? "Category updated" : "Category created");
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
          <Label htmlFor="name_th">Thai name *</Label>
          <Input id="name_th" {...register("name_th")} />
        </div>
        <div>
          <Label htmlFor="name_en">English name *</Label>
          <Input id="name_en" {...register("name_en")} />
        </div>
        <div>
          <Label htmlFor="slug">Slug *</Label>
          <Input id="slug" {...register("slug")} placeholder="battery" />
        </div>
        <div>
          <Label htmlFor="sort_order">Sort order</Label>
          <Input id="sort_order" type="number" {...register("sort_order", { valueAsNumber: true })} />
        </div>
        <div className="flex items-center gap-2">
          <Switch id="requires_imei" {...register("requires_imei")} defaultChecked={category?.requires_imei ?? false} />
          <Label htmlFor="requires_imei" className="font-normal">Requires IMEI</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="is_active" {...register("is_active")} defaultChecked={category?.is_active ?? true} />
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

export function CategoriesTable({ categories }: { categories: CategoryRow[] }) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filtered = categories.filter(
    (c) =>
      c.name_th.toLowerCase().includes(search.toLowerCase()) ||
      c.name_en.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Dialog open={dialogOpen || !!editing} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4 mr-2" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle>
              <DialogDescription>Enter category details</DialogDescription>
            </DialogHeader>
            <CategoryForm
              category={editing}
              onClose={() => { setDialogOpen(false); setEditing(null); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Thai</th>
              <th className="py-2">English</th>
              <th className="py-2">Slug</th>
              <th className="py-2">IMEI</th>
              <th className="py-2">Status</th>
              <th className="py-2 w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="py-2">{c.name_th}</td>
                <td className="py-2 text-muted-foreground">{c.name_en}</td>
                <td className="py-2 text-muted-foreground">{c.slug}</td>
                <td className="py-2">{c.requires_imei ? "Yes" : "No"}</td>
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
                        const result = await deleteCategory(c.id);
                        if (result.ok) toast.success("Category deleted");
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
              <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No categories</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}