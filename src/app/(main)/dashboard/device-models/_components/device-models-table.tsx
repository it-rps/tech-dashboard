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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { deleteDeviceModel, upsertDeviceModel } from "../actions";
import { deviceModelSchema } from "../_lib/schema";
import type { DeviceModelRow } from "../_lib/queries";

type FormInput = z.input<typeof deviceModelSchema>;

const deviceTypes = [
  { value: "iphone", label: "iPhone" },
  { value: "ipad", label: "iPad" },
  { value: "macbook", label: "MacBook" },
] as const;

function DeviceModelForm({ model, onClose }: { model?: DeviceModelRow | null; onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, control, watch } = useForm<FormInput>({
    resolver: zodResolver(deviceModelSchema),
    defaultValues: model
      ? {
          name: model.name,
          device_type: model.device_type as "iphone" | "ipad" | "macbook",
          series: model.series ?? undefined,
          release_year: model.release_year ?? undefined,
          sort_order: model.sort_order,
          is_active: model.is_active,
        }
      : {
          name: "",
          device_type: "iphone",
          series: undefined,
          release_year: undefined,
          sort_order: 0,
          is_active: true,
        },
  });

  const onSubmit = async (data: FormInput) => {
    setIsSubmitting(true);
    const result = await upsertDeviceModel(data, model?.id ?? null);
    if (result.ok) {
      toast.success(model ? "Device model updated" : "Device model created");
      onClose();
    } else {
      toast.error(result.error);
    }
    setIsSubmitting(false);
  };

  const currentType = watch("device_type");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="device_type">Device Type *</Label>
          <Select
            defaultValue={currentType}
            onValueChange={(v) => {
              void v;
            }}
          >
            <SelectTrigger id="device_type" className="text-base sm:text-sm">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {deviceTypes.map((dt) => (
                <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" {...register("device_type")} />
        </div>
        <div>
          <Label htmlFor="name">Model Name *</Label>
          <Input id="name" {...register("name")} />
        </div>
        <div>
          <Label htmlFor="series">Series</Label>
          <Input id="series" {...register("series")} placeholder="e.g. 15 series" />
        </div>
        <div>
          <Label htmlFor="release_year">Release Year</Label>
          <Input id="release_year" type="number" {...register("release_year", { valueAsNumber: true })} />
        </div>
        <div>
          <Label htmlFor="sort_order">Sort Order</Label>
          <Input id="sort_order" type="number" {...register("sort_order", { valueAsNumber: true })} />
        </div>
        <div className="flex items-center gap-2">
          <Switch id="is_active" {...register("is_active")} defaultChecked={model?.is_active ?? true} />
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

export function DeviceModelsTable({ models }: { models: DeviceModelRow[] }) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DeviceModelRow | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filtered = models.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.device_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search device models..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Dialog open={dialogOpen || !!editing} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4 mr-2" /> Add Model
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Device Model" : "Add Device Model"}</DialogTitle>
              <DialogDescription>Enter device model details</DialogDescription>
            </DialogHeader>
            <DeviceModelForm
              model={editing}
              onClose={() => { setDialogOpen(false); setEditing(null); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Type</th>
              <th className="py-2">Name</th>
              <th className="py-2">Series</th>
              <th className="py-2">Year</th>
              <th className="py-2">Status</th>
              <th className="py-2 w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="py-2 capitalize">{m.device_type}</td>
                <td className="py-2">{m.name}</td>
                <td className="py-2 text-muted-foreground">{m.series ?? "-"}</td>
                <td className="py-2">{m.release_year ?? "-"}</td>
                <td className="py-2">
                  <Badge variant={m.is_active ? "default" : "secondary"}>
                    {m.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="py-2">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(m)}>
                      <Edit className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={isDeleting === m.id}
                      onClick={async () => {
                        setIsDeleting(m.id);
                        const result = await deleteDeviceModel(m.id);
                        if (result.ok) toast.success("Device model deleted");
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
              <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No device models</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
