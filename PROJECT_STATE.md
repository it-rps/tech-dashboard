# iRepair — Session State (2026-09-03)

## Current Phase
**Phase 0: COMPLETE**
**Phase 1: COMPLETE (Master Data CRUD)**
**Phase 2: COMPLETE (PO + GR)**
**Phase 3: IN PROGRESS (Stock overview done, GR testing pending)**

## Stack
- Next.js 16.3.4 (Turbopack), React, TypeScript
- Supabase (linked remote: `olneiasqahinffkqctbk`)
- Zod 4, react-hook-form, shadcn/ui
- App Router with `(main)` route group

## Commits this session
| Hash | Description |
|---|---|
| `2f6f67a` | Fix products add form — Controller for category/brand Select |
| `1ce33f5` | Phase 3: Stock overview — v_stock_summary + responsive table |
| `e24b61c` | Phase 2: GR scaffold — receive_goods RPC + CRUD page |
| `3371685` | Phase 2: GR migration (receive_goods RPC) |
| `3371685` | Phase 2: GR migration (receive_goods RPC) |

## Migrations (all applied to remote)
1. `20260101000000_init.sql` — schema
2. `20260101000001_rls.sql` — RLS policies
3. `20260101000002_seed.sql` — seed data (brands, categories, device_models, suppliers, customers)
4. `20260101000003_doc_no_and_phase2.sql` — doc_no triggers (PO/GR/LOT)
5. `20260101000004_receive_goods_rpc.sql` — `receive_goods()` RPC (single transaction: GR + lots + stock_movements + supplier_products + PO status)

## Phase 0 — Done
- Migrations created, pushed via `supabase db push --linked`
- `src/lib/supabase/database.types.ts` regenerated
- Auth: `reqquireUser()`, `requireRole()`, `canSeeCost()` in `src/lib/auth/guard.ts`
- `src/lib/money.ts` — `round2()`, `calcTax()`, `formatTHB()` (satang cents)
- `.env.local` has `SUPABASE_ACCESS_TOKEN` + Supabase URLs
- Superadmin: `sayz.1ost@gmail.com` / `Lolipop-11` — profile role `owner`, created by `scripts/bootstrap-superadmin.mjs`

## Phase 1 — Master Data CRUD (all working)
Same shape per entity at `src/app/(main)/dashboard/<name>/` with:
- `page.tsx` — page wrapper
- `actions.ts` — Server Actions (upsert/delete, Zod + requireRole + revalidatePath)
- `_lib/schema.ts` — Zod schema + Row type
- `_lib/queries.ts` — server queries
- `_components/<name>-table.tsx` — client table + form dialog

Entities: Brands, Categories, Device Models, Suppliers, Customers, Products (+ price tiers + device model links)

**Products bug fixed**: Select used `defaultValue` + hidden input → always sent `""`. Switched to `Controller`.

## Phase 2 — Purchasing
- PO (`/dashboard/purchase-orders`): supplier_id, expected_date, tax_mode, vat_rate, shipping_cost, other_cost, items[]
- **GR** (`/dashboard/goods-receipts`): completed
  - `receive_goods` RPC handles full GR flow in single transaction:
    1. Insert GR header (doc_no auto `GR-YYYY-NNNN`)
    2. Insert GR items
    3. Insert inventory_lots (landed_unit_cost calculated: unit_cost + shipping/total_qty share)
    4. Insert stock_movements (`movement_type='receipt'`, +qty)
    5. Upsert supplier_products.last_price
    6. Update purchase_order_items.qty_received
    7. Update PO status: received / partial / ordered
  - Sidebar updated: Purchase Orders + Goods Receipts under Master Data
  - `src/components/shared/data-table/table-skeleton.tsx` created (used by Stock page)

## Phase 3 — Stock
- `/dashboard/stock` — reads v_stock_summary view
- `src/app/(main)\dashboard\stock\queries.ts` / `actions.ts` / `page.tsx` / `_components/stock-table.tsx`
- Cost columns hidden from technician/viewer (canSeeCost gate at query layer)
- Responsive: card view <md, table >=md, view-mode toggle (auto/table/card)
- Low-stock badge, tabular-nums on money (formatTHB)

## Patterns
- **Server Action**: `"use server"` → zodSchema.safeParse → requireRole → supabase → revalidatePath
- **Money**: satang cents (Math.round(n*100)), use calcTax() (exclusive/inclusive/none)
- **Query**: `import "server-only"` + createClient() + typed
- **Form**: useForm + Controller (NOT defaultValue + hidden input for selects) + zodResolver
- **Role gates**: requireRole(["owner","manager"]) for write; query-level canSeeCost for read
- **Doc numbers**: in DB via BEFORE INSERT triggers — never TS
- **RPC pattern**: complex multi-table operations → single Postgres function (receive_goods)

## Commands
- `npm run build` — verify (single source of truth)
- `npm run lint` — pre-existing zod v4 noise
- `npx supabase db query --linked "SQL"` — query remote DB
- `npx supabase gen types typescript --linked --schema public 2>/dev/null > src/lib/supabase/database.types.ts`
- `npx supabase db push --linked --include-all` — apply new migrations
- `node scripts/bootstrap-superadmin.mjs` — reset superadmin

## Next Steps
1. **Phase 3**: lots detail page, stock adjustments (adjust_in/out)
2. **Phase 4**: Repair jobs (intake → reserve → close FIFO → warranty → commission)
3. **Phase 3**: GR end-to-end test (no products/lots yet to test with — GR page works, needs real PO+items to fully verify)
