# File Structure (colocation-first)

Follow the template convention: every feature keeps its page + components + logic inside its own route folder. Reference template: https://github.com/arhamkhnz/next-shadcn-admin-dashboard

```text
src/
├── app/
│   └── (main)/                      # ← check the real name in the project first
│       └── dashboard/
│           ├── page.tsx             # Main dashboard (KPIs + charts)
│           ├── _components/         # components used only on this page
│           │   ├── kpi-cards.tsx
│           │   └── sales-profit-chart.tsx
│           ├── products/
│           │   ├── page.tsx
│           │   ├── _components/
│           │   │   ├── product-table.tsx
│           │   │   ├── product-columns.tsx
│           │   │   ├── product-card-list.tsx   # card mode for mobile
│           │   │   └── product-form-dialog.tsx
│           │   ├── _lib/
│           │   │   ├── queries.ts   # data reads (server-only)
│           │   │   └── schema.ts    # zod schema
│           │   └── actions.ts       # "use server"
│           ├── inventory/           # lots, remaining stock, adjustments
│           ├── purchase-orders/
│           ├── goods-receipts/
│           ├── repair-jobs/
│           ├── sales/
│           ├── claims/
│           ├── customers/
│           ├── suppliers/
│           ├── commissions/
│           ├── reports/
│           └── settings/
├── components/
│   ├── ui/                          # shadcn — never edit
│   └── shared/                      # only for things used by 2+ features
│       ├── data-table/              # TanStack wrapper + responsive logic
│       ├── view-toggle.tsx          # table ⇄ card
│       ├── money.tsx
│       ├── barcode-scanner.tsx
│       └── empty-state.tsx
├── lib/
│   ├── supabase/
│   │   ├── server.ts                # createServerClient (cookies)
│   │   ├── client.ts                # browser client
│   │   ├── admin.ts                 # service role — server only
│   │   └── database.types.ts        # auto-generated, never edit by hand
│   ├── auth/guard.ts                # requireUser / requireRole
│   ├── money.ts                     # money math + VAT
│   ├── costing.ts                   # FIFO / WAC / last cost (TypeScript side)
│   └── format.ts                    # formatTHB, formatDateTH
├── i18n/
│   ├── request.ts
│   └── messages/{th.json,en.json}
└── types/domain.ts                  # shared enums/unions
```

**Placement rules:**

- Used in one place only → `_components/` inside that folder.
- Used by 2+ features → `src/components/shared/`.
- A folder starting with `_` is private and never becomes a route.
- File names: `kebab-case.tsx`. Component names: `PascalCase`. Function names: `camelCase`.

