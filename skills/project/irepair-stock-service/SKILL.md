---
name: irepair-stock-service
description: Single source of truth for the AI agent writing code on the iRepair Stock & Service System — a shop that buys/sells iPhone/iPad/MacBook and runs a battery-replacement and repair service (dealer/retail/internal jobs), built on Next.js App Router + TypeScript + Tailwind v4 + shadcn/ui + Supabase. Use this skill for ANY task on this project — schema/migrations, repair job / purchasing / sales / claims / commission logic, costing (FIFO/WAC/Last), RLS, Server Actions, pages/components, responsive layout, i18n (Thai/English), dashboard/reports. Do not guess or invent schema, fields, or business rules not defined here — check the matching reference file first.
---

# iRepair Stock & Service System — Project Skill

> This is the **single source of truth** for task-specific detail on
> this project. Do not guess. Do not invent any schema, field, or
> function that is not defined in the reference files below.
>
> The rules that apply to EVERY task (folder-structure discipline,
> Definition of Done, Build Order, "When Unsure" format) live in
> `AGENTS.md` at the project root, not here — that file loads every
> session; this Skill loads only when a task matches it. Read
> `AGENTS.md` first if you haven't already this session.

---

## Step Router — find your task, read the matching reference file(s) first

| Task involves... | Read this reference FIRST |
|---|---|
| Job types, commission rules, the ITM battery-swap example, glossary terms | `references/business-context.md` |
| Adding a dependency, confirming what's in the stack | `references/tech-stack.md` |
| Creating a new file/folder, deciding where something goes | `references/file-structure.md` |
| Any table, enum, view, or RLS policy — schema or migration work | `references/database-schema.md` |
| FIFO/WAC/Last cost, landed cost, VAT calculation | `references/costing-logic.md` |
| Purchasing→receiving, repair job intake→close, claims, document numbers | `references/business-flows.md` |
| Server Actions, Supabase client/auth guard, query layer, pages, charts, forms | `references/code-patterns.md` |
| Breakpoints, table columns per screen size, responsive components | `references/responsive-spec.md` |
| Thai/English strings, dashboard KPIs/charts, reports page | `references/i18n-dashboard-reports.md` |
| ANY judgment call — "should this be an RPC?", "which costing method?", "is this a view or a direct query?", "where does this file go?" | `references/decision-rules.md` FIRST, before answering |

**Do not write code for a task without reading its matching reference
file(s) first**, even if the pattern seems obvious — this project has
specific rules (commission logic, costing methods, RLS-by-role) that
differ from generic best practice and must match exactly.

**If a decision feels ambiguous, it is not yours to guess.** Open
`references/decision-rules.md` and find the matching Rule Set before
writing any code. This file exists specifically to remove judgment
calls from this project — use it every time, not just when told to.

## Bundled resources

- `references/decision-rules.md` — **check this first for any
  judgment call.** Every "should I do X or Y" question in this project
  converted into an explicit if/then rule (RPC vs. plain query, stock
  timing, costing method selection, cost visibility by role, view vs.
  direct query, file placement, and more).
- `references/business-context.md` — the business itself: job types
  (DEALER/SERVICE/INTERNAL), the real numeric test fixture, business
  rules that must never be violated, and the Thai↔code glossary.
- `references/tech-stack.md` — the exact allowed stack; nothing outside
  this list without asking first.
- `references/file-structure.md` — colocation-first folder convention
  and placement rules.
- `references/database-schema.md` — enums, all core tables, required
  views, and RLS setup + role permission matrix.
- `references/costing-logic.md` — FIFO/WAC/Last cost formulas, landed
  cost, the `issue_stock_fifo` RPC, and VAT calculation code.
- `references/business-flows.md` — purchasing→receiving,
  repair-job intake→close→deliver (with cancellation handling),
  defective claims, and document numbering rules.
- `references/code-patterns.md` — the only code style to copy: Supabase
  server client, auth guard, Server Action template, query layer, page
  pattern, chart pattern, form pattern.
- `references/responsive-spec.md` — breakpoints, per-component behavior
  at each breakpoint, table column visibility, and the responsive
  data-table pattern.
- `references/i18n-dashboard-reports.md` — i18n rules (Thai default),
  required dashboard KPIs/charts, and the required reports list.

## Also read

- `AGENTS.md` (project root) — Rules of Engagement, Definition of Done,
  Build Order, "When Unsure" format. Always-on, loaded every session —
  read it first if this is a fresh session and you haven't seen it yet.
