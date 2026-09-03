# iRepair — Session State (2026-09-03)

## Current Phase
**Phase 1 (Master Data CRUD) — COMPLETE**
**Phase 2 (Purchasing) — PARTIAL (PO done, GR pending)**
**Auth — WIRED (real Supabase email+password)**

## Stack
- Next.js 16.3.4 (Turbopack), React, TypeScript
- Supabase (linked remote: `olneiasqahinffkqctbk`)
- Zod 4, react-hook-form, shadcn/ui
- App Router with `(main)` route group

## Phase 0 — Done
- `supabase/migrations/20260101000000_init.sql` (schema)
- `supabase/migrations/20260101000001_rls.sql` (RLS)
- `supabase/migrations/20260101000002_seed.sql` (seed)
- `supabase/migrations/20260101000003_doc_no_and_phase2.sql` (auto doc_no/lot generators for PO, GR, lots — applied remotely `→ db push --linked`)
- `src/lib/supabase/database.types.ts` regenerated from remote (beware: `npx supabase gen types typescript --linked --schema public` writes npm notice header to stdout; pipe `2>/dev/null`)
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

## Phase 2 — Purchasing (PO done, GR pending)
- **Purchase Orders** (`/dashboard/purchase-orders`) — supplier_id, expected_date, tax_mode, vat_rate, shipping_cost, other_cost, items[], totals satang-math via `calcTax()` + `SUP()`. Doc numbers auto-generated `PO-YYYY-NNNN` via trigger `purchase_orders_set_doc_no`. File scaffold: `page.tsx`, `actions.ts` (upsert with header + full line-item replace, delete), `_lib/schema.ts` (purchaseOrderSchema, PurchaseOrderRow), `_components/purchase-orders-table.tsx` (Dialog form + product/supplier Selects + qty/cost inputs).
- **TODO GR:** `goods_receipts` + `goods_receipt_items` → on create: insert `inventory_lots` (product, supplier, condition='good', landed_unit_cost, qty), `stock_movements` (movement_type='receipt'), update `purchase_order_items.qty_received`, upsert `supplier_products`.
- Sidebar (`src/navigation/sidebar/sidebar-items.ts`) now has `Purchase Orders` under Master Data.

## Sidebar (`src/navigation/sidebar/sidebar-items.ts`)
- Group 1: Dashboards (unchanged)
- **Group 2: Master Data** (updated) — Brands, Categories, Device Models, Suppliers, Customers, Products, **Purchase Orders**
- Group 3: Pages (Authentication collapsed to Login + Register only, v2 deleted)
- Groups 4-5: Legacy, Misc (unchanged)

## Auth Pages
- v1 kept: `/auth/v1/login`, `/auth/v1/register` (left-column branded layout)
- v2 DELETED: `src/app/(main)/auth/v2/` folder removed
- Shared forms: `src/app/(main)/auth/_components/{login,register}-form.tsx` — now **wired to Server Actions** at `src/app/(main)/auth/actions.ts` (signUp/signInWithPassword), validated via `src/app/(main)/auth/_lib/schema.ts`.
- Route guard: `src/proxy.ts` (Next.js 16 proxy — async, matcher excludes `_next/static`, `api`) redirects anon from `/dashboard/*` → `/auth/v1/login` and authed from `/auth/*` → `/dashboard`.
- DB trigger `handle_new_user()` on `auth.users` insert → `profiles` with role `'viewer'` (created via `scripts/bootstrap-superadmin.mjs`). Auto `SUPABASE_ACCESS_TOKEN` bootstrap.
- Superadmin: `sayz.1ost@gmail.com` / `Lolipop-11` (profiles role `owner`, active) — created by `scripts/bootstrap-superadmin.mjs` (also resets password on re-run, idempotent).
- Google button still stub.

## Patterns Established
- **Server Action pattern:** `"use server"` → `zodSchema.safeParse(input)` → `requireRole([...])` → `supabase.from(...).upsert(...)` → `revalidatePath()`
- **Money pattern:** satang cents `Math.round(n*100)`, use `calcTax()` (exclusive/inclusive/none), convert back with `/100`.
- **Query pattern:** `import "server-only"` + `createClient()` + typed select
- **Form pattern:** `useForm({ resolver: zodResolver(schema), defaultValues })` + `useFieldArray` for line items; pass `resolver as never` and cast `onSubmit` with `data as never as Input` when zod `default()` quirks clash.
- **Table pattern:** Search input + "Add" Dialog (trigger button) + edit-dialog reuse + delete with loading state
- **Role gates:** `requireRole(["owner", "manager"])` for write; query-level RLS for read
- **DL:** generated in DB via `BEFORE INSERT` triggers (migration 03: PO-YYYY-NNNN, GR-YYYY-NNNN, LOT-YYYYMMDD-NNNN) — never in TypeScript.

## Database Tables (public schema)
Categories, Brands, Device_Models, Suppliers, Customers, Products, Product_Prices, Product_Device_Models, Inventory_Lots, Stock_Movements, Stock_Items, Purchase_Orders, Purchase_Order_Items, Goods_Receipts, Goods_Receipt_Items, Supplier_Products, Repair_Jobs, Repair_Job_Items, Sales_Orders, Sales_Order_Items, Claims, Claim_Items, Warranties, Commission_Entries, Audit_Logs, App_Settings, Profiles
+ views: v_stock_summary, v_claim_rate_by_product, v_supplier_price_compare

## Next Steps (Phase 2)
Purchasing flow: **PO → GR → inventory_lots → stock_movements + supplier_products**
- `suppliers` and `products` already exist; **PO is done**
- Still need: **GR form + lot creation on GR + stock_movements + supplier_products upsert**.

## Files NOT to Touch
- `src/components/ui/**` (shadcn primitives — wrap if you need changes)
- `supabase/migrations/*` (already applied to remote) — append new migrations via `supabase db push --linked`

## Commands
- `npm run build` — verify (single source of truth; per-file `tsc` has zod v4 + esModuleInterop noise)
- `npm run lint` — pre-existing noise
- `npx supabase db query --linked "SQL"` — query remote DB
- `npx supabase gen types typescript --linked --schema public 2>/dev/null > src/lib/supabase/database.types.ts` — regenerate (note `2>/dev/null` needed or npm header lands in file)
- `npx supabase db push --linked --include-all` — apply new migrations
- `node scripts/bootstrap-superadmin.mjs` — (re)create/reset superadmin user + profile
- `npm run dev` — `next dev` on :3000

## User Preferences
- English (brief, casual)
- Ponytail mode: full
- Save `SUPABASE_ACCESS_TOKEN` in `.env.local` (CLI reads it for `db query`)
- Prefers concrete diffs over essays
- Wants template-based scaffolding when it exists (reuse brand/product patterns, not handcode)

## Session Notes (2026-09-03)
- Commit chain this session: `ef11e0b` (Phase 0+1), `b6280bf` (real auth), `93aca4c` (PO scaffold). Remote branch `main → origin/main` is current.
- Gotchas: `src/proxy.ts` is the Next 16 auth guard (not root `proxy.ts` — delete that). `src/proxy.disabled.ts` is the stock template. `npm notice` lands in `database.types.ts` if gen command lacks `2>/dev/null`. zod 4 `default()` quirks need `resolver as never` + `handleSubmit(onSubmit as never)` in forms.
