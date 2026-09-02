# Decision Rules — Unambiguous If/Then

Every judgment call hidden in this project's other reference files,
converted into an explicit rule. When unsure what to do, find the
matching rule here FIRST — do not guess, and do not re-derive a rule
from general best practice if a specific rule exists below that
overrides it.

---

## RULE SET A — Where does mutation/business logic live?

Check in this exact order. Stop at the first match.

1. Does the action touch `inventory_lots`, `stock_items`, or
   `stock_movements` — i.e. does it move real stock (receive, issue,
   adjust, claim, transfer condition)? → It MUST be a single Postgres
   function (RPC), called with `security definer`, run as ONE
   transaction. Never issue multiple separate Supabase client calls
   from the Server Action to touch these tables — see
   `references/costing-logic.md` section 6.2 (`issue_stock_fifo`) and
   `references/business-flows.md` section 7.1 for the pattern.
2. Does the action span more than one table where a partial failure
   would leave data inconsistent (e.g. closing a repair job: it must
   deduct stock AND create a warranty AND create a commission entry AND
   update job totals — all or nothing)? → Also a single RPC. This is
   why `closeRepairJob` in `references/code-patterns.md` section 8.3
   calls one RPC (`close_repair_job`) rather than doing four separate
   `.update()`/`.insert()` calls from TypeScript.
3. Does the action touch exactly one table, with no stock/money
   consistency risk (e.g. toggling `products.is_active`, updating a
   customer's phone number)? → A plain Server Action doing a direct
   Supabase `.update()`/`.insert()` call is fine — no RPC needed.
4. Regardless of 1–3, every mutation — RPC-backed or not — is still
   called FROM a Server Action following the exact template in
   `references/code-patterns.md` section 8.3 (permission check → Zod
   validate → call → `revalidatePath`). The RPC/no-RPC decision is
   about what happens *inside* the Server Action, not whether to use
   one.
5. Every RPC that mutates stock is `security definer` (so RLS on the
   underlying tables doesn't need to grant direct table writes to every
   role) but the Server Action calling it still performs its own
   `requireRole()` check first — never rely on the RPC alone to enforce
   permissions.

---

## RULE SET B — Stock deduction timing (reserve vs. actual)

1. Parts drawn for a repair job (`repair_job_items` created) →
   increment `inventory_lots.qty_reserved` only. Do NOT insert a
   `stock_movements` row yet. Do NOT decrement `qty_remaining` yet.
2. Job closed (`status` → `done`) → call `issue_stock_fifo()` (or the
   wrapping `close_repair_job` RPC) for every line. This is the only
   point where `qty_remaining` actually decreases and a
   `stock_movements` row is created.
3. Job cancelled BEFORE close (parts were only reserved, never issued)
   → release the reservation only: decrement `qty_reserved` back down.
   No movement row needed, since none was ever created.
4. Job cancelled AFTER close (stock was already deducted) → create an
   `adjust_in` movement to return the qty to stock. Do NOT try to
   "undo" the original `issue_repair` movement by deleting it — the
   ledger in `stock_movements` is append-only; corrections are new
   rows, never edits or deletes of existing rows.
5. Sales orders follow the same reserve-then-deduct pattern only if the
   project adds an explicit reservation step for sales; if sales are
   deducted immediately at sale time (no separate reservation stage),
   call the FIFO issue function directly at `sales_orders` creation —
   check `references/business-flows.md` for whether a reservation stage
   exists for sales before assuming one.

---

## RULE SET C — Which costing method for which purpose?

Do not mix these up — using the wrong method changes reported numbers.

1. Recording the actual cost of a specific stock movement (what a
   repair job or sale actually cost) → **FIFO**, via
   `issue_stock_fifo()`. This is the only method that touches
   `stock_movements.unit_cost` for a real transaction.
2. Showing the value of stock currently on hand (stock overview,
   dashboard "stock value" KPI, `v_stock_summary.stock_value`) →
   **WAC** (`wac_cost` in the view), unless the user has explicitly
   switched the report to a different method for comparison purposes.
3. Setting a new sale price, or alerting that supplier cost has gone
   up → **Last Cost** (`last_cost` in `v_stock_summary`, or
   `supplier_products.last_price`).
4. `app_settings.costing_method` is the **default** shown in reports —
   it does not change which method FIFO-driven stock deduction uses
   (deduction is always FIFO, regardless of this setting; the setting
   only affects which number reports show by default, and the user can
   switch the report view between methods).

---

## RULE SET D — Job type → price tier → commission

1. `repair_jobs.job_kind` is set from `customers.kind` automatically at
   intake — never let the user pick job_kind independently of the
   customer record's kind, and never leave it to default without
   checking the customer.
2. `job_kind = 'dealer'` → `price_tier = 'wholesale'`, commission
   applies (if `customers.commission_eligible`, which defaults `true`
   for dealer/walkin customers).
3. `job_kind = 'walkin'` (SERVICE in the business-language table in
   `references/business-context.md`) → `price_tier = 'retail'`,
   commission applies.
4. `job_kind = 'internal'` → price tier uses **cost price** (not
   wholesale, not retail — check `references/business-context.md`
   section 1.1 before pricing an internal job as if it were a normal
   tier), and `customers.commission_eligible` must be `false` for the
   internal customer record — no commission entry is ever created for
   an internal job. If you find yourself about to create a
   `commission_entries` row for an internal job, stop — this is a bug.
5. Commission `qty` is always `1` per device closed, never `1` per
   `repair_job_items` line — a job with 4 part lines (battery, TagOn,
   2 adhesives) still generates exactly one commission entry with
   `qty = 1`.
6. Commission `rate` is a **snapshot** taken from
   `app_settings.commission_per_unit` at the moment the job closes —
   never compute commission later by re-reading current settings; a
   later settings change must not retroactively change past commission
   entries.

---

## RULE SET E — Cost visibility by role

1. Any query that could return cost-related columns (`unit_cost`,
   `landed_unit_cost`, `wac_cost`, `last_cost`, `parts_cost_total`,
   `gross_profit`, `stock_value`) → check `canSeeCost(role)` from
   `references/code-patterns.md` section 8.2 BEFORE building the
   `select` column list. See the pattern in section 8.4
   (`getStockSummary`): the column list itself branches on role.
2. Never filter cost fields out only in the React component (e.g.
   conditionally rendering a `<TableCell>`). If the column was fetched
   from Supabase, it already reached the client/server-rendered HTML
   and can be inspected — the filtering must happen in the query layer
   (`_lib/queries.ts`), before the data is returned to the component.
3. `technician` and `viewer` roles never see cost/profit fields, per the
   permission matrix in `references/database-schema.md` section 5.4.
   `owner` and `manager` see everything. If a new role is ever added,
   default it to NOT seeing cost until explicitly told otherwise.

---

## RULE SET F — New database view vs. querying directly

1. Is the same aggregation/join needed by 2+ different pages or reports
   (e.g. stock summary used by both the Products page and the Dashboard
   low-stock KPI)? → Add it to an existing view, or create a new
   `v_*` view in `references/database-schema.md` section 5.3, rather
   than duplicating the aggregation SQL in multiple `_lib/queries.ts`
   files.
2. Is it a one-off query needed by exactly one page, with no complex
   aggregation? → Query directly in that page's `_lib/queries.ts`. Do
   NOT create a new view for a single simple `select ... where`.
3. Never modify `v_stock_summary`, `v_supplier_price_compare`, or
   `v_claim_rate_by_product`'s existing output columns without checking
   every page/report that already reads them — these are the required
   views listed in `references/database-schema.md` and
   `references/i18n-dashboard-reports.md`; changing their shape can
   silently break a report.

---

## RULE SET G — File placement for a new piece of code

1. Is it a data **read** with no side effects? → goes in
   `_lib/queries.ts` for that route, imported with `import
   "server-only"` at the top — NOT `"use server"` (that directive is
   for Server Actions specifically, not arbitrary server-only code).
2. Is it a data **write** (insert/update/delete) or anything calling an
   RPC that mutates data? → goes in `actions.ts` for that route, with
   `"use server"` at the top, following the exact template in
   `references/code-patterns.md` section 8.3.
3. Is it a component used on exactly one page? →
   `app/(main)/dashboard/<route>/_components/`.
4. Is it a component used by 2+ features? →
   `src/components/shared/`.
5. Is it a shadcn primitive that needs a behavior change? → do NOT edit
   the file under `src/components/ui/`. Create a new wrapping component
   elsewhere that composes the primitive instead.
6. Before creating ANY new file, run `ls` on the real `src/app/`
   directory first (per Rule 0 in `SKILL.md`) — do not assume a route
   group name like `(main)` is correct without checking.

---

## RULE SET H — Document number generation

1. `PO-YYYY-NNNN`, `GR-YYYY-NNNN`, `JOB-YYYY-NNNN`, `SO-YYYY-NNNN`,
   `CLM-YYYY-NNNN`, `LOT-YYYY-NNNN` are ALWAYS generated inside the
   database (a per-year sequence in the same RPC/transaction that
   creates the row), never computed in TypeScript and passed in.
2. If you are writing a `create*` RPC for any of these document types
   and it does not yet generate its own number, that is a gap — add the
   sequence logic to the RPC rather than generating the number in the
   Server Action, even "temporarily."

---

## RULE SET I — Warranty days resolution

1. When creating a `warranties` row at job close or sale, resolve
   `days` in this order: `products.warranty_days` if it is not null →
   otherwise `app_settings.default_warranty_days`. Never hardcode 90
   days directly in application code — that number only exists as the
   *default value* of the settings column.
2. `end_date` is a generated column (`start_date + days`) — never
   compute or store it separately in application code.

---

## RULE SET J — Claim status transitions

Valid transitions only — do not skip states or invent new ones:

1. Defect found on good stock → `transfer_condition` movement,
   `condition: good → defective_pending_claim`. This happens BEFORE a
   `claims` row necessarily exists (defective stock can sit in this
   condition before being batched into a claim).
2. Claim created + sent → `claims.status = 'sent'`, movement
   `claim_out`, `condition_to = 'sent_to_supplier'`.
3. Replacement arrives → create a NEW `inventory_lots` row (cost =
   the ORIGINAL lot's `unit_cost`, not a new negotiated price, unless
   the user states the replacement has a different cost), movement
   `claim_in`, and set `claim_items.replacement_lot_id`.
4. Supplier rejects the claim → `condition = 'scrap'`, written off as a
   loss — do NOT return it to `good` condition, and do not leave it in
   `sent_to_supplier` indefinitely.
5. `claim_items.resolved_qty` must equal `qty` before the claim as a
   whole can move to `status = 'closed'` — a claim with partially
   resolved items stays `'sent'` or a similar in-progress status, not
   `'closed'`.

---

## RULE SET K — Money handling

1. Every money column in the database is `numeric(12,2)`. Never
   `float`/`real`, never a plain JS `number` written directly to a
   numeric column without going through the rounding helper.
2. Calculations happening in TypeScript that involve multiplication or
   percentages (VAT, discounts) → use `calcTax()`/`round2()` from
   `references/costing-logic.md` section 6.3 — never hand-roll
   float math for money.
3. Display: always `formatTHB()` + `tabular-nums` className, per
   `references/code-patterns.md` and `references/responsive-spec.md`
   section 9.6 — never a raw `${amount}` string.

---

## RULE SET L — Serial number / IMEI requirements

1. A repair job can NEVER be closed without `device_imei` set — this is
   a hard business rule, not just a UI validation nicety. If a
   `close_repair_job` RPC is being written, it must reject the close if
   `device_imei` is null/empty, even if application-layer Zod
   validation is also supposed to catch it.
2. `stock_items` (serial-tracked items) are only created for products
   where `products.track_serial = true`. Do not create a `stock_items`
   row for a product with `track_serial = false` — batteries/adhesives
   that aren't individually serialized should never get one.
3. TagOn is an OPTIONAL line item (`repair_job_items.is_optional`) —
   not every job has one. Never require a TagOn line to close a job
   unless `products.requires_tagon` is true for a specific installed
   product AND the job actually includes that product.

---

## RULE SET M — Responsive view mode

1. Default view mode is `"auto"` — table below `md` breakpoint is
   NEVER shown; card list is shown below `md`, full table from `md` up,
   controlled by pure CSS (`md:hidden` / `hidden md:block`), not a JS
   media query. See `references/responsive-spec.md` section 9.4.
2. If the user manually toggles to `"table"` on mobile, wrap it in
   `overflow-x-auto` with a `min-w-[720px]` inner container — never let
   a forced table view break out and cause the whole page to scroll
   horizontally (Rule Set per `references/responsive-spec.md` section
   9.6: "Never let the whole page scroll horizontally").
3. Any new data table added to the project follows this same
   auto/card/table pattern by default — do not build a table-only view
   with no mobile fallback.

---

## RULE SET Z — Before marking any task "done"

This is the project-specific version of the Definition of Done in
`SKILL.md` — go through both lists. Do not skip any line.

- [ ] Any code touching `inventory_lots`/`stock_items`/
      `stock_movements` is inside a single RPC, not multiple client
      calls (Rule Set A)
- [ ] Stock is only actually deducted at job close / sale, never at
      draw/reserve time (Rule Set B)
- [ ] The correct costing method was used for the specific purpose —
      FIFO for actual COGS, WAC for stock value, Last for pricing
      (Rule Set C)
- [ ] `job_kind`/price tier/commission eligibility trace back to
      `customers.kind`/`commission_eligible`, not hardcoded or guessed
      (Rule Set D)
- [ ] Cost/profit fields are filtered by role in the query layer, not
      just hidden in the UI (Rule Set E)
- [ ] No duplicated aggregation SQL that should have been a shared view
      (Rule Set F)
- [ ] New files are placed correctly (`_lib/queries.ts` vs
      `actions.ts` vs `_components/` vs `shared/`) per Rule Set G
- [ ] Document numbers are generated in the database, not in TypeScript
      (Rule Set H)
- [ ] Warranty days resolved from `products.warranty_days ??
      app_settings.default_warranty_days`, not hardcoded (Rule Set I)
- [ ] Any claim-status change follows a valid transition (Rule Set J)
- [ ] All money math goes through `calcTax()`/`round2()`/`formatTHB()`,
      never raw float math or string interpolation (Rule Set K)
- [ ] `device_imei` required before closing a repair job; `stock_items`
      only created when `track_serial = true` (Rule Set L)
- [ ] New tables/data views follow the auto/card/table responsive
      pattern with no horizontal page scroll (Rule Set M)

If any box cannot be checked, say so explicitly instead of silently
skipping it — per `SKILL.md`'s "When Unsure" format if the correct
answer isn't already covered by a rule above.
