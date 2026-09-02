# iRepair Stock & Service System — Always-On Rules

> Read this every session, before doing anything. This file stays short
> on purpose — it's loaded every turn, so only rules that apply to
> literally every task live here. Task-specific detail (schema, costing,
> code patterns, etc.) lives in the `irepair-stock-service` Skill and
> its `references/` files — that content loads only when a task matches
> it, so don't duplicate it here and don't skip reading it when relevant.

---

## Rules of Engagement

- **Never hallucinate the folder structure.** Before creating a new
  file, run `ls` on the real `src/app/` folder to see the actual
  route-group names, then place the new file following that same
  pattern. Do not assume folder names.
- **Never edit files in `src/components/ui/**`** (shadcn primitives)
  unless the user explicitly asks. If a change is needed, wrap it in a
  new component instead.
- **Never add a new dependency** unless it is already listed in the
  Skill's `references/tech-stack.md`. Ask first.
- **Never create fake sample data in production code.** Mock data may
  only live in `seed.sql` and `*.test.ts` files.
- **Never use `any`.** Use the types generated from Supabase
  (`src/lib/supabase/database.types.ts`).
- **Every mutation must go through a Server Action** with `"use server"`
  + Zod validation + a permission check + `revalidatePath()`.
- **Store all money as `numeric(12,2)` in the database**, and calculate
  using integer satang (cents) on the TypeScript side. Never use
  `float` to calculate a price and save it directly.
- **Any judgment call** ("should this be an RPC?", "which costing
  method?", "where does this file go?") → check the Skill's
  `references/decision-rules.md` before guessing. Do not proceed on a
  guess when a matching rule exists there.
- **Before saying a task is finished**, check every item in
  "Definition of Done" below.

---

## Definition of Done ✅

Every item below must pass before a task is considered finished. Also
run through **Rule Set Z** in the Skill's `references/decision-rules.md`
— it's the project-specific extension of this same checklist.

- [ ] `npm typecheck` passes — no `any`, no `@ts-ignore`
- [ ] `npm lint` passes
- [ ] Every mutation goes through Server Action + Zod + `requireRole()`
      + `revalidatePath()`
- [ ] Full error handling: loading state, empty state, error state
- [ ] Tested at widths 375 / 768 / 1024 / 1440 — no horizontal page
      scroll
- [ ] Checked in both light and dark mode
- [ ] All UI text lives in the i18n files (`th.json` and `en.json`)
- [ ] If the schema changed → new migration created + `supabase gen
      types` rerun
- [ ] If costing logic changed → tested against the real job example
      (Skill's `references/business-context.md` section 1.2), confirming
      480 / 800 / 320 / commission 50
- [ ] RLS policy covers every new table
- [ ] Money values use `tabular-nums` and `formatTHB()`

---

## Build Order

Work through phases in order. Do not skip ahead. Let the user test each
phase before moving to the next.

| Phase | Scope |
|---|---|
| 0 | Set up Supabase; migrations (schema §5.1–5.4, Skill's `references/database-schema.md`); seed data (categories, device_models X–17, brands, SV Telecom, PJ Soft, ITM); generate types; Auth + guard |
| 1 | Master data CRUD: brands, categories, device_models, suppliers, customers, products + price tiers + product↔model links |
| 2 | Purchasing: PO → GR → inventory_lots → stock_movements + supplier_products |
| 3 | Stock: stock overview page, lots, adjustments, all 3 costing methods, barcode scan |
| 4 | Repair jobs: intake → reserve parts → close job (FIFO) → warranty → commission |
| 5 | Sales/billing: sales_orders + VAT toggle + print receipt |
| 6 | Claims: defective stock → send to supplier → receive replacement |
| 7 | Dashboard + all 9 reports |
| 8 | Full i18n, RLS audit, responsive polish on every page, audit_logs |

---

## When Unsure — Ask Like This

```
❓ Need confirmation
Context: working on [feature]
Issue: neither CLAUDE.md nor the Skill's references specify [this]
Options:
  A) ... (pros/cons)
  B) ... (pros/cons)
Recommendation: A, because ...
```

Never guess and keep writing code — especially for: costing formulas,
commission rules, RLS policies, and schema changes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
