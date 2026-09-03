# iRepair — Session Plan

## Status: Phase 0 COMPLETE ✅

### Done this session
- [x] Supabase project linked: `olneiasqahinffkqctbk`
- [x] Migrations pushed to remote (schema + RLS + seed)
- [x] Types regenerated from remote DB: `database.types.ts`
- [x] Auth guard: `requireUser()`, `requireRole()`, `canSeeCost()`
- [x] Money utils: `round2()`, `calcTax()`, `formatTHB()` (integer satang math)
- [x] Build passes: `npm run build` ✅
- [x] Brands CRUD scaffolded (Phase 1 start)
  - page.tsx, actions.ts, _lib/schema.ts, _components/brands-table.tsx
  - Server Action + Zod + requireRole + revalidatePath pattern established

### Next (Phase 1 — Master Data CRUD)
1. Finish brands (verify on live DB, test add/edit/delete)
2. Categories CRUD
3. Device models CRUD
4. Suppliers CRUD
5. Customers CRUD
6. Products CRUD + price tiers + device model links

## Key Files
- Schema refs: `skills/project/irepair-stock-service/references/`
- AGENTS.md — always read first (DoD, rules)
- `.env.local` — Supabase keys (do not commit)
- `src/lib/` — guard.ts, money.ts, supabase/{server,client,admin}.ts
- `supabase/migrations/` — init, rls, seed

## Rules (from AGENTS.md + Skill)
- Every mutation → Server Action + Zod + requireRole + revalidatePath
- Money: numeric(12,2) DB, integer satang TS
- Cost visibility filtered at query layer, not UI
- Stock moves → RPC (single transaction)
- No `any`, use Database types from database.types.ts
