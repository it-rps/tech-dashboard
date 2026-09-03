# iRepair — Session State (2026-09-03)

## Current Phase
**Phase 1 (Master Data CRUD) — COMPLETE**
**Phase 2 (Purchasing) — NOT STARTED**

## Stack
- Next.js 16.3.4 (Turbopack), React, TypeScript
- Supabase (linked remote: `olneiasqahinffkqctbk`)
- Zod 4, react-hook-form, shadcn/ui
- App Router with `(main)` route group

## Phase 0 — Done
- `supabase/migrations/20260101000000_init.sql` (schema)
- `supabase/migrations/20260101000001_rls.sql` (RLS)
- `supabase/migrations/20260101000002_seed.sql` (seed)
- `src/lib/supabase/database.types.ts` regenerated from remote
- `src/lib/auth/guard.ts` — `requireUser()`, `requireRole()`, `canSeeCost()`
- `src/lib/money.ts` — `round2()`, `calcTax()`, `formatTHB()` (integer satang)
- `.env.local` has `SUPABASE_ACCESS_TOKEN` + Supabase URLs
- Auth: `src/lib/supabase/{client,server,admin}.ts`

## Phase 1 — Master Data CRUD (all working, build green)
Each entity lives at `src/app/(main)/dashboard/<name>/` with same shape:
- `page.tsx` — Card + table wrapper
- `actions.ts` — `"use server"` upsert/delete (Zod + requireRole + revalidatePath)
- `_lib/schema.ts` — Zod schema + Row type
- `_lib/queries.ts` — `get*` server query
- `_components/<name>-table.tsx` — client table + form dialog

Entities built:
1. **Brands** (`/dashboard/brands`) — name + is_active
2. **Categories** (`/dashboard/categories`) — name_th, name_en, slug, requires_imei, sort_order
3. **Device Models** (`/dashboard/device-models`) — name, device_type (iphone/ipad/macbook), series, release_year, sort_order
4. **Suppliers** (`/dashboard/suppliers`) — code, name, shop_name, address, phone, line_id, contact_person, tax_id, bank_account, payment_terms_days, lead_time_days, rating
5. **Customers** (`/dashboard/customers`) — code, name, kind (dealer/walkin/internal), default_price_tier, commission_eligible, phone, credit_limit, credit_terms_days
6. **Products** (`/dashboard/products`) — sku, barcode, name_th, name_en, category_id (FK), brand_id (FK), capacity_mah, requires_tagon, track_serial, warranty_days, reorder_point, unit. Plus server actions: `upsertProductPrices`, `syncProductDeviceModels` for `product_prices` + `product_device_models`

## Sidebar (`src/navigation/sidebar/sidebar-items.ts`)
- Group 1: Dashboards (unchanged)
- **Group 2: Master Data** (NEW) — Brands, Categories, Device Models, Suppliers, Customers, Products
- Group 3: Pages (Authentication collapsed to Login + Register only, v2 deleted)
- Groups 4-5: Legacy, Misc (unchanged)

## Auth Pages
- v1 kept: `/auth/v1/login`, `/auth/v1/register` (left-column branded layout)
- v2 DELETED: `src/app/(main)/auth/v2/` folder removed
- Shared forms: `src/app/(main)/auth/_components/{login,register}-form.tsx`
- Forms currently use **mock `onSubmit` (toast only)** — no real auth wiring yet

## Patterns Established
- **Server Action pattern:** `"use server"` → `zodSchema.safeParse(input)` → `requireRole([...])` → `supabase.from(...).upsert(...)` → `revalidatePath()`
- **Query pattern:** `import "server-only"` + `createClient()` + typed select
- **Form pattern:** `useForm({ resolver: zodResolver, defaultValues })` + `react-hook-form` + `sonner` toast
- **Table pattern:** Search input + "Add" Dialog (trigger button) + edit-dialog reuse + delete with loading state
- **Role gates:** `requireRole(["owner", "manager"])` for write; query-level RLS for read

## Database Tables (public schema)
Categories, Brands, Device_Models, Suppliers, Customers, Products, Product_Prices, Product_Device_Models, Inventory_Lots, Stock_Movements, Stock_Items, Purchase_Orders, Purchase_Order_Items, Goods_Receipts, Goods_Receipt_Items, Supplier_Products, Repair_Jobs, Repair_Job_Items, Sales_Orders, Sales_Order_Items, Claims, Claim_Items, Warranties, Commission_Entries, Audit_Logs, App_Settings, Profiles
+ views: v_stock_summary, v_claim_rate_by_product, v_supplier_price_compare

## Next Steps (Phase 2)
Purchasing flow: **PO → GR → inventory_lots → stock_movements + supplier_products**
- `suppliers` and `products` already exist
- Need: PO form, GR form, lot creation on GR, stock movement ledger, supplier-product price list

## Files NOT to Touch
- `src/components/ui/**` (shadcn primitives — wrap if you need changes)
- `supabase/migrations/*` (already applied to remote)

## Commands
- `npm run build` — verify (single source of truth, per-file tsc has zod v4 esm noise)
- `npm run lint` — pre-existing noise
- `npx supabase db query --linked "SQL"` — query remote DB
- `npx supabase gen types typescript --linked --schema public > src/lib/supabase/database.types.ts`

## User Preferences
- English (brief, casual)
- Ponytail mode: full
- Save `SUPABASE_ACCESS_TOKEN` in `.env.local` (CLI reads it for `db query`)
- Prefers concrete diffs over essays
