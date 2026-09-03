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

import type { RepairJobRow } from "../actions";
import { addRepairJobItems, closeRepairJob, createRepairJob, deliverRepairJob } from "../actions";
import { addPartsSchema, intakeSchema } from "../_lib/schema";
import type {
  CustomerOption,
  DeviceModelOption,
  ProductOption,
  TechnicianOption,
} from "../actions";

type IntakeInput = z.input<typeof intakeSchema>;
type AddPartsInput = z.input<typeof addPartsSchema>;

export function RepairOrdersTable({
  rows,
  customers,
  deviceModels,
  products,
  technicians,
}: {
  rows: RepairJobRow[];
  customers: CustomerOption[];
  deviceModels: DeviceModelOption[];
  products: ProductOption[];
  technicians: TechnicianOption[];
}) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [closing, setClosing] = useState<string | null>(null);

  const filtered = rows.filter(
    (r) =>
      r.doc_no.toLowerCase().includes(search.toLowerCase()) ||
      (r.customer_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search JOB / customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button type="button" asChild>
            <span onClick={() => setDialogOpen(true)}>New repair</span>
          </Button>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New repair job</DialogTitle>
              <DialogDescription>IMEI is required before the job can be closed.</DialogDescription>
            </DialogHeader>
            <IntakeForm
              customers={customers}
              deviceModels={deviceModels}
              products={products}
              technicians={technicians}
              onClose={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Doc</th>
              <th className="py-2">Customer</th>
              <th className="py-2">IMEI</th>
              <th className="py-2">Status</th>
              <th className="py-2">Received</th>
              <th className="py-2 text-right">Total</th>
              <th className="py-2 w-[140px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="py-2 font-medium">{r.doc_no}</td>
                <td className="py-2 text-muted-foreground">{r.customer_name ?? "—"}</td>
                <td className="py-2 text-muted-foreground tabular-nums">{r.device_imei ?? "—"}</td>
                <td className="py-2">
                  <Badge variant={r.status === "done" ? "default" : r.status === "delivered" ? "secondary" : "outline"}>
                    {r.status}
                  </Badge>
                </td>
                <td className="py-2 text-muted-foreground">{r.received_at?.split("T")[0]}</td>
                <td className="py-2 text-right tabular-nums">
                  {Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(r.grand_total ?? 0)}
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    {(r.status === "received" || r.status === "diagnosing" || r.status === "waiting_parts" || r.status === "in_progress") && (
                      <AddPartsButton jobId={r.id} products={products} busy={closing === r.id} setBusy={setClosing} />
                    )}
                    {(r.status === "received" || r.status === "diagnosing" || r.status === "waiting_parts" || r.status === "in_progress") && (
                      <CloseJobButton jobId={r.id} busy={closing === r.id} setBusy={setClosing} />
                    )}
                    {r.status === "done" && (
                      <DeliverButton jobId={r.id} busy={closing === r.id} setBusy={setClosing} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-muted-foreground">
                  No repair jobs
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddPartsButton({
  jobId,
  products,
  busy,
  setBusy,
}: {
  jobId: string;
  products: ProductOption[];
  busy: boolean;
  setBusy: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} disabled={busy}>
        Parts
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add parts</DialogTitle>
            <DialogDescription>Reservation only. Cost is set when the job is closed (FIFO).</DialogDescription>
          </DialogHeader>
          <AddPartsForm
            jobId={jobId}
            products={products}
            busy={busy}
            setBusy={setBusy}
            onClose={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function AddPartsForm({
  jobId,
  products,
  busy,
  setBusy,
  onClose,
}: {
  jobId: string;
  products: ProductOption[];
  busy: boolean;
  setBusy: (v: string | null) => void;
  onClose: () => void;
}) {
  const form = useForm<AddPartsInput>({
    resolver: zodResolver(addPartsSchema) as never,
    defaultValues: {
      job_id: jobId,
      items: [{ product_id: "", qty: 1, unit_price: 0, is_optional: false }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  const onSubmit = async (data: AddPartsInput) => {
    setBusy(jobId);
    const r = await addRepairJobItems(data as never);
    if (r.ok) {
      toast.success(`Added ${r.data.count} part(s)`);
      onClose();
    } else toast.error(r.error);
    setBusy(null);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      {fields.map((f, i) => (
        <div key={f.id} className="flex items-end gap-2">
          <Controller
            control={form.control}
            name={`items.${i}.product_id` as never}
            render={({ field }) => (
              <div className="flex-1">
                <Label className="sr-only">Product</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
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
              </div>
            )}
          />
          <Controller
            control={form.control}
            name={`items.${i}.qty` as never}
            render={({ field }) => (
              <div>
                <Label className="sr-only">Qty</Label>
                <Input type="number" min={1} placeholder="Qty" {...field} className="w-20" />
              </div>
            )}
          />
          <Controller
            control={form.control}
            name={`items.${i}.unit_price` as never}
            render={({ field }) => (
              <div>
                <Label className="sr-only">Price</Label>
                <Input type="number" min={0} step={0.01} placeholder="Price" {...field} className="w-32" />
              </div>
            )}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} disabled={fields.length === 1}>
            ✕
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => append({ product_id: "", qty: 1, unit_price: 0, is_optional: false })}
      >
        Add row
      </Button>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving..." : "Add parts"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeliverButton({
  jobId,
  busy,
  setBusy,
}: {
  jobId: string;
  busy: boolean;
  setBusy: (v: string | null) => void;
}) {
  return (
    <Button
      size="sm"
      variant="default"
      disabled={busy}
      onClick={async () => {
        setBusy(jobId);
        const r = await deliverRepairJob({ job_id: jobId });
        if (r.ok) toast.success("Delivered");
        else toast.error(r.error);
        setBusy(null);
      }}
    >
      {busy ? "..." : "Deliver"}
    </Button>
  );
}

function CloseJobButton({
  jobId,
  busy,
  setBusy,
}: {
  jobId: string;
  busy: boolean;
  setBusy: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [labor, setLabor] = useState(0);
  const [discount, setDiscount] = useState(0);

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Close
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Close job</DialogTitle>
            <DialogDescription>Labour and discount, or 0 for both. FIFO deduction runs automatically.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Labour</Label>
              <Input type="number" min={0} step={0.01} value={labor} onChange={(e) => setLabor(Number(e.target.value))} />
            </div>
            <div>
              <Label>Discount</Label>
              <Input type="number" min={0} step={0.01} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(jobId);
                const r = await closeRepairJob({ job_id: jobId, labor_fee: labor, discount });
                if (r.ok) {
                  toast.success("Job closed");
                  setOpen(false);
                } else toast.error(r.error);
                setBusy(null);
              }}
            >
              {busy ? "Closing..." : "Close job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function IntakeForm({
  customers,
  deviceModels,
  products,
  technicians,
  onClose,
}: {
  customers: CustomerOption[];
  deviceModels: DeviceModelOption[];
  products: ProductOption[];
  technicians: TechnicianOption[];
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<IntakeInput>({
    resolver: zodResolver(intakeSchema) as never,
    defaultValues: {
      customer_id: "",
      device_model_id: "",
      device_imei: "",
      device_color: "",
      passcode: "",
      symptom: "",
      diagnosis: "",
      technician_id: null,
      tax_mode: "none",
      vat_rate: 7,
      note: "",
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const onSubmit = async (data: IntakeInput) => {
    setSubmitting(true);
    const r = await createRepairJob(data as never);
    if (r.ok) {
      toast.success("Repair job created");
      onClose();
    } else toast.error(r.error);
    setSubmitting(false);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* row 1: customer + device model */}
      <div className="grid grid-cols-2 gap-3">
        <Controller
          control={form.control}
          name="customer_id"
          render={({ field }) => (
            <div>
              <Label>Customer</Label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Customer" />
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
          name="device_model_id"
          render={({ field }) => (
            <div>
              <Label>Device model</Label>
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {deviceModels.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />
      </div>

      {/* row 2: IMEI + colour */}
      <div className="grid grid-cols-2 gap-3">
        <Controller
          control={form.control}
          name="device_imei"
          render={({ field }) => (
            <div>
              <Label>IMEI *</Label>
              <Input {...field} placeholder="359..." />
            </div>
          )}
        />
        <Controller
          control={form.control}
          name="device_color"
          render={({ field }) => (
            <div>
              <Label>Colour</Label>
              <Input {...field} value={field.value ?? ""} placeholder="Midnight" />
            </div>
          )}
        />
      </div>

      {/* row 3: symptom + passcode */}
      <div className="grid grid-cols-2 gap-3">
        <Controller
          control={form.control}
          name="symptom"
          render={({ field }) => (
            <div>
              <Label>Symptom *</Label>
              <Input {...field} placeholder="Battery drains fast" />
            </div>
          )}
        />
        <Controller
          control={form.control}
          name="passcode"
          render={({ field }) => (
            <div>
              <Label>Passcode</Label>
              <Input {...field} value={field.value ?? ""} placeholder="••••" />
            </div>
          )}
        />
      </div>

      {/* row 4: diagnosis + technician */}
      <div className="grid grid-cols-2 gap-3">
        <Controller
          control={form.control}
          name="diagnosis"
          render={({ field }) => (
            <div>
              <Label>Diagnosis</Label>
              <Input {...field} value={field.value ?? ""} placeholder="Swollen battery" />
            </div>
          )}
        />
        <Controller
          control={form.control}
          name="technician_id"
          render={({ field }) => (
            <div>
              <Label>Technician</Label>
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Assign later" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {technicians.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />
      </div>

      {/* row 5: vat */}
      <div className="grid grid-cols-2 gap-3">
        <Controller
          control={form.control}
          name="tax_mode"
          render={({ field }) => (
            <div>
              <Label>Tax mode</Label>
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
              <Input type="number" min={0} step={0.01} {...field} value={field.value as string | number} />
            </div>
          )}
        />
      </div>

      <Controller
        control={form.control}
        name="note"
        render={({ field }) => (
          <div>
            <Label>Note</Label>
            <Input {...field} value={field.value ?? ""} placeholder="Optional" />
          </div>
        )}
      />

      {/* parts */}
      <div>
        <Label>Parts (optional at intake)</Label>
        {fields.map((f, i) => (
          <div key={f.id} className="mb-2 flex items-end gap-2">
            <Select onValueChange={(v) => form.setValue(`items.${i}.product_id`, v)} defaultValue={f.product_id}>
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
            <Controller
              control={form.control}
              name={`items.${i}.qty` as never}
              render={({ field }) => <Input type="number" min={1} placeholder="Qty" {...field} className="w-20" />}
            />
            <Controller
              control={form.control}
              name={`items.${i}.unit_price` as never}
              render={({ field }) => <Input type="number" min={0} step={0.01} placeholder="Price" {...field} className="w-32" />}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}>
              ✕
            </Button>
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={() => append({ product_id: "", qty: 1, unit_price: 0, is_optional: false })}>
          Add part
        </Button>
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
