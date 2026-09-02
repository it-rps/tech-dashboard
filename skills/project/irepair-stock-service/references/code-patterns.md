# Code Patterns (copy this style only)

### 8.1 Supabase Server Client

```ts
// src/lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (all) => {
          try { all.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* called from a Server Component — safe to ignore */ }
        },
      },
    },
  );
}
```

### 8.2 Auth Guard

```ts
// src/lib/auth/guard.ts
import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type Role = Database["public"]["Enums"]["user_role"];

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/v1/login");

  const { data: profile } = await supabase
    .from("profiles").select("id, full_name, role, is_active").eq("id", user.id).single();

  if (!profile?.is_active) redirect("/auth/v1/login");
  return { user, profile };
}

export async function requireRole(allowed: Role[]) {
  const ctx = await requireUser();
  if (!allowed.includes(ctx.profile.role)) redirect("/dashboard?error=forbidden");
  return ctx;
}

export const canSeeCost = (role: Role) => role === "owner" || role === "manager";
```

### 8.3 Server Action (standard template — every action must look like this)

```ts
// src/app/(main)/dashboard/repair-jobs/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guard";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const closeJobSchema = z.object({
  jobId: z.string().uuid(),
  laborFee: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
});

export async function closeRepairJob(input: unknown): Promise<ActionResult<{ jobId: string }>> {
  // 1) permission check
  const { profile } = await requireRole(["owner", "manager", "technician"]);

  // 2) validate
  const parsed = closeJobSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // 3) call the RPC that does everything in a single transaction
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("close_repair_job", {
    p_job_id: parsed.data.jobId,
    p_labor_fee: parsed.data.laborFee,
    p_discount: parsed.data.discount,
    p_actor_id: profile.id,
  });

  if (error) {
    if (error.message.includes("STOCK_INSUFFICIENT")) {
      return { ok: false, error: "Not enough stock to close this job" };
    }
    return { ok: false, error: error.message };
  }

  // 4) revalidate every affected path
  revalidatePath("/dashboard/repair-jobs");
  revalidatePath(`/dashboard/repair-jobs/${parsed.data.jobId}`);
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard");

  return { ok: true, data: { jobId: parsed.data.jobId } };
}
```

### 8.4 Query Layer (server-only)

```ts
// src/app/(main)/dashboard/products/_lib/queries.ts
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { canSeeCost } from "@/lib/auth/guard";
import type { Database } from "@/lib/supabase/database.types";

type Role = Database["public"]["Enums"]["user_role"];

export async function getStockSummary(role: Role, params: {
  q?: string; categorySlug?: string; page?: number; pageSize?: number;
}) {
  const supabase = await createClient();
  const page = params.page ?? 1;
  const size = params.pageSize ?? 20;

  const cols = canSeeCost(role)
    ? "product_id, sku, name_th, name_en, category_slug, brand_name, qty_good, qty_available, qty_defective, reorder_point, wac_cost, last_cost, stock_value"
    : "product_id, sku, name_th, name_en, category_slug, brand_name, qty_good, qty_available, qty_defective, reorder_point";

  let query = supabase.from("v_stock_summary").select(cols, { count: "exact" });
  if (params.q) query = query.or(`sku.ilike.%${params.q}%,name_th.ilike.%${params.q}%`);
  if (params.categorySlug) query = query.eq("category_slug", params.categorySlug);

  const { data, count, error } = await query
    .order("name_th")
    .range((page - 1) * size, page * size - 1);

  if (error) throw new Error(error.message);
  return { rows: data ?? [], total: count ?? 0, page, pageSize: size };
}
```

### 8.5 Page = Server Component

```tsx
// src/app/(main)/dashboard/products/page.tsx
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/guard";
import { getStockSummary } from "./_lib/queries";
import { ProductView } from "./_components/product-view";
import { TableSkeleton } from "@/components/shared/data-table/table-skeleton";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { profile } = await requireUser();
  const data = await getStockSummary(profile.role, {
    q: sp.q,
    categorySlug: sp.category,
    page: Number(sp.page ?? 1),
  });

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Products &amp; Stock</h1>
          <p className="text-muted-foreground text-sm">{data.total} items total</p>
        </div>
      </header>

      <Suspense fallback={<TableSkeleton />}>
        <ProductView data={data} canSeeCost={profile.role !== "technician" && profile.role !== "viewer"} />
      </Suspense>
    </div>
  );
}
```

### 8.6 Chart (shadcn Chart + Recharts) — Sales & Profit

```tsx
// src/app/(main)/dashboard/_components/sales-profit-chart.tsx
"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  profit:  { label: "Gross profit", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function SalesProfitChart({ data }: { data: { date: string; revenue: number; profit: number }[] }) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Sales &amp; Gross Profit</CardTitle>
        <CardDescription>Last 30 days</CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {/* increase height per breakpoint for readability on larger screens */}
        <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full sm:h-[280px] lg:h-[340px]">
          <AreaChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24}
              tickFormatter={(v) => new Date(v).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
            />
            {/* hide the Y axis on mobile to save space */}
            <YAxis
              width={48} tickLine={false} axisLine={false}
              className="hidden sm:block"
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area dataKey="revenue" type="monotone" fill="var(--color-revenue)" fillOpacity={0.2} stroke="var(--color-revenue)" stackId="a" />
            <Area dataKey="profit"  type="monotone" fill="var(--color-profit)"  fillOpacity={0.3} stroke="var(--color-profit)"  stackId="b" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

**Chart rule:** only use colors from `var(--chart-1)` through `var(--chart-5)`. Never hardcode a hex color — the template ships multiple theme presets, and colors must follow them.

### 8.7 Form (react-hook-form + zod + Server Action)

```tsx
"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createProduct } from "../actions";

const schema = z.object({
  sku: z.string().min(1, "SKU is required"),
  nameTh: z.string().min(1, "Product name is required"),
  capacityMah: z.coerce.number().int().positive().optional(),
});
type FormValues = z.infer<typeof schema>;

export function ProductForm({ onSuccess }: { onSuccess?: () => void }) {
  const [pending, startTransition] = useTransition();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { sku: "", nameTh: "" } });

  const onSubmit = (values: FormValues) =>
    startTransition(async () => {
      const res = await createProduct(values);
      if (!res.ok) {
        if (res.fieldErrors) {
          Object.entries(res.fieldErrors).forEach(([k, v]) =>
            form.setError(k as keyof FormValues, { message: v?.[0] }));
        }
        toast.error(res.error);
        return;
      }
      toast.success("Saved successfully");
      form.reset();
      onSuccess?.();
    });

  return (
    <Form {...form}>
      {/* 1 column on mobile → 2 columns from md up */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField control={form.control} name="sku" render={({ field }) => (
          <FormItem>
            <FormLabel>SKU</FormLabel>
            {/* text-base prevents iOS auto-zoom on focus */}
            <FormControl><Input {...field} inputMode="text" className="text-base sm:text-sm" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="nameTh" render={({ field }) => (
          <FormItem>
            <FormLabel>Product name (Thai)</FormLabel>
            <FormControl><Input {...field} className="text-base sm:text-sm" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* button sticks to bottom on mobile / sits inline in the form on larger screens */}
        <div className="bg-background sticky bottom-0 col-span-full -mx-4 flex gap-2 border-t p-4 md:static md:mx-0 md:justify-end md:border-0 md:p-0">
          <Button type="submit" disabled={pending} className="h-11 w-full md:h-9 md:w-auto">
            {pending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

