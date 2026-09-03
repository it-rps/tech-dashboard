# iRepair — Session State (2026-09-03)

## Current Phase
**Phase 0–5: COMPLETE**
**Phase 6: PENDING (Claims)**
**Phase 7: COMPLETE (Dashboard + 9 reports)**
**Phase 8: PENDING (i18n, RLS audit, responsive polish, audit_logs)**

## Stack
- Next.js 16.3.4 (Turbopack), React, TypeScript
- Supabase (linked remote: `olneiasqahinffkqctbk`)
- Zod 4, react-hook-form, shadcn/ui
- App Router with `(main)` route group

## Commits this session
| Hash | Description |
|---|---|
| `f69eaf7` | feat(sales): SO doc_no trigger + create_sales_order RPC + /dashboard/sales + receipt print |
| `fc07066` | feat(dashboard): phase 7 UI — overview KPIs + 8 report tabs |
| `12d8ad3` | feat(dashboard): phase 7 migration — 9 report views + KPI snapshot |
| `53253bf` | feat(repair): draw-parts-later + deliver (done→delivered) + e2e script |

## Migrations (all applied to remote)
1. `20260101000000_init.sql` — schema
2. `20260101000001_rls.sql` — RLS policies
3. `20260101000002_seed.sql` — seed data (brands, categories, device_models, suppliers, customers)
4. `20260101000003_doc_no_and_phase2.sql` — doc_no triggers (PO/GR/LOT)
5. `20260101000004_receive_goods_rpc.sql` — `receive_goods()` RPC
6. `20260101000005_adjust_stock_rpc.sql` — `adjust_stock()` RPC (in/out on a lot)
7. `20260101000006_repair_rpcs.sql` — `issue_stock_fifo()` + `close_repair_job()` + doc_no trigger for JOB
8. `20260101000007_reserve_stock_rpc.sql` — `reserve_stock()` RPC (qty_reserved only, Rule Set B)
9. `20260101000008_dashboard_views.sql` — 9 report views (low_stock, sales_by_day, top_products_sold, repair_revenue, tech_commission, warranty_expiry, aging_stock, stock_value_by_brand, dashboard_kpis)
10. `20260101000009_sales_order_rpc.sql` — `create_sales_order()` RPC + SO doc_no trigger

## RPCs available
| Function | Purpose |
|---|---|
| `receive_goods(...)` | GR → lots + stock_movements + PO status |
| `adjust_stock(...)` | adjust_in/adjust_out on a specific lot |
| `reserve_stock(product_id, qty)` | FIFO reserve (qty_reserved only, no deduction) |
| `issue_stock_fifo(product_id, qty, ref_table, ref_id, movement, imei)` | FIFO deduction + stock_movements |
| `close_repair_job(job_id, labor_fee, discount, actor_id)` | Full close: FIFO issue + totals + warranty + commission |
| `create_sales_order(...)` | Sales: header + items + FIFO deduction + VAT calc |

## What's built
### Phase 4 — Repair Jobs (COMPLETE)
**Route:** `/dashboard/repair-orders`
- **Create job:** intake dialog → customer + device + IMEI + symptom + items (optional)
- **Add parts later:** `AddPartsButton` → dialog with product/qty/price, calls `addRepairJobItems` (reserves stock)
- **Close job:** `CloseJobButton` → labor/discount → `close_repair_job` RPC (FIFO + warranty + commission)
- **Deliver:** `DeliverButton` → `done→delivered`, server-side status guard via `.eq("status","done")`
- **Files:** `actions.ts` (CRUD + RPCs), `_lib/schema.ts`, `_components/repair-orders-table.tsx`

### Phase 5 — Sales (COMPLETE)
**Route:** `/dashboard/sales`
- **Create sale:** dialog with customer + price_tier + VAT toggle (none/inclusive/exclusive) + discount + multi-item
- **Receipt:** `/dashboard/sales/[id]` — print-friendly view with browser `window.print()`
- **DB:** `create_sales_order` RPC handles everything (insert header + items + FIFO deduction + VAT calc)
- **Doc no:** `SO-YYYY-NNNN` via BEFORE INSERT trigger
- **Files:** `actions.ts`, `_lib/schema.ts`, `_components/sales-orders-table.tsx`, `[id]/page.tsx`, `[id]/actions.ts`

### Phase 7 — Dashboard + Reports (COMPLETE)
**Route:** `/dashboard` (overview) + `/dashboard/reports` (8 tabs)
- **Overview:** KPI grid from `v_dashboard_kpis` view (stock value, low stock, open jobs, revenue, warranty, commission)
- **Reports tabs:** low-stock, sales-by-day, top-products, repair-revenue, tech-commission, warranty-expiry, aging-stock, stock-by-brand
- **Views:** 9 SQL views in migration `20260101000008`, plus `v_dashboard_kpis` single-row snapshot
- **Files:** `_lib/dashboard-queries.ts`, `_components/kpi-grid.tsx`, `_components/reports-tabs.tsx`, `reports/page.tsx`
- **Styling:** Uses `/dashboard/default` pattern — `@container/main`, gradient Cards, icon tiles

### Sidebar nav updated
- Dashboards: Overview, Reports
- Master Data: Brands, Categories, Device Models, Suppliers, Customers, Products, Stock, Repair Orders, **Sales** (new)

## Remaining work
| Phase | Scope | Status |
|---|---|---|
| 6 | Claims: defective stock → send to supplier → receive replacement | PENDING |
| 8 | Full i18n, RLS audit, responsive polish, audit_logs | PENDING |

## Patterns established
- **Server Action:** `"use server"` → zodSchema.safeParse → requireRole → supabase/RPC → revalidatePath
- **Money:** satang cents (Math.round(n*100)), use calcTax() (exclusive/inclusive/none), formatTHB()
- **Query:** `import "server-only"` + createClient() + typed
- **Form:** useForm + Controller (NOT defaultValue + hidden input for selects) + zodResolver
- **Role gates:** requireRole(["owner","manager"]) for write; canSeeCost for read
- **Doc numbers:** in DB via BEFORE INSERT triggers — never TS
- **RPC pattern:** complex multi-table ops → single Postgres function
- **Insert with trigger-generated columns:** use `const payload: any = {...}` to avoid TS errors
- **Deliver transition:** server-side `.eq("status","done")` guard in update (no race with other states)
- **Sales table has NO status column** — sold_at is set by default; receipt view = order detail

## Key gotchas
- `inventory_lots` column is `lot_no`, NOT `doc_no` (despite being generated by trigger like PO/GR)
- `inventory_lots.qty_remaining` exists directly — no need to aggregate from `stock_movements`
- `stock_movements` has no `lot_no` column (lot_id → inventory_lots.id)
- Pre-existing broken `tsc --noEmit` lint script (module resolution errors) — ignore; use `npm run build` for real checks
- `sales_orders` has NO `status` column — no paid/delivered tracking, just `sold_at`
- `commission_entries.period_month` is `date`, not text
- `@/lib/auth/guard` and `@/lib/supabase/server` show TS2307 in lint but work fine in build

## Commands
- `npm run build` — verify (single source of truth)
- `npm run lint` — pre-existing zod v4 noise, ignore
- `npx supabase db query --linked "SQL"` — query remote DB
- `npx supabase gen types typescript --linked --schema public 2>/dev/null > src/lib/supabase/database.types.ts` — regenerate types after migration
- `npx supabase db push --linked --include-all` — apply new migrations
- `node scripts/bootstrap-superadmin.mjs` — reset superadmin

## Files created this session
```
src/app/(main)/dashboard/sales/
├── page.tsx                      # Server: list sales, @container/main style
├── actions.ts                    # Server Actions: createSalesOrder, getSalesOrders, getCustomersForSelect, getProductsForSales
├── _lib/schema.ts                # Zod: createSalesOrderSchema, salesOrderItemSchema
├── _components/sales-orders-table.tsx  # Client: table + intake dialog + VAT toggle + live calc
└── [id]/
    ├── page.tsx                  # Server: receipt preview with print button
    ├── actions.ts                # Server: getReceipt
    └── _components/print-button.tsx  # Client: window.print()

src/app/(main)/dashboard/
├── _lib/dashboard-queries.ts     # Server-only: 8 query helpers for report views
├── _components/kpi-grid.tsx      # Client: 6 KPI cards from v_dashboard_kpis
├── _components/reports-tabs.tsx  # Client: 8 tabs with table sections
└── reports/page.tsx              # Server: fetches all 8 views, renders ReportsTabs

supabase/migrations/
├── 20260101000008_dashboard_views.sql   # 9 views
└── 20260101000009_sales_order_rpc.sql   # create_sales_order RPC + SO doc_no trigger
```
