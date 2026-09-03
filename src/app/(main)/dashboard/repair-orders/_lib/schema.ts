import { z } from "zod";

export const repairOrderItemSchema = z.object({
  product_id: z.string().uuid(),
  qty: z.coerce.number().int().min(1),
  unit_price: z.coerce.number().min(0),
  is_optional: z.boolean().default(false),
});

export const intakeSchema = z.object({
  customer_id: z.string().uuid(),
  device_model_id: z.string().uuid().nullish(),
  device_imei: z.string().min(1, "IMEI is required"),
  device_color: z.string().nullish(),
  passcode: z.string().nullish(),
  symptom: z.string().min(1),
  diagnosis: z.string().nullish(),
  technician_id: z.string().uuid().nullish(),
  tax_mode: z.enum(["none", "inclusive", "exclusive"]).default("none"),
  vat_rate: z.coerce.number().min(0).default(7),
  note: z.string().nullish(),
  items: z.array(repairOrderItemSchema).default([]),
});

export const closeSchema = z.object({
  job_id: z.string().uuid(),
  labor_fee: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
});
