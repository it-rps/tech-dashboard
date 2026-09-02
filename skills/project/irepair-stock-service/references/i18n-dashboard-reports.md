# i18n, Dashboard & Reports

## i18n (Thai / English)

- Uses `next-intl` — default locale is `th`
- Every UI string must come from `messages/th.json` and `messages/en.json`. Never hardcode Thai text in a component.
- Namespaced keys: `products.title`, `jobs.status.in_progress`
- The database stores both languages only for master data the user sees often (`name_th` / `name_en`)
- Dates: `formatDateTH()` (uses `date-fns/locale/th`). Money: `formatTHB()`
- Language switch button lives in the header (shown from `lg` up; on mobile it's inside the menu Sheet)

---

## Dashboard & Reports (required content)

### 11.1 Dashboard Page (`/dashboard`)

**KPI row (4 cards):** Today's sales · This month's gross profit · Open repair jobs · Products below reorder point

**Charts:**
- Sales & gross profit (area chart, 30 days) — full width
- Daily repair job count, split by `job_kind` (stacked bar)
- Top 10 best-selling products — toggle "by quantity / by profit" (horizontal bar)
- Stock value by category (donut/pie)

**Summary tables:** latest 10 repair jobs · low-stock products

### 11.2 Reports Page (`/dashboard/reports`)

| Report | Content |
|---|---|
| Sales & profit | Daily/weekly/monthly + date range picker + CSV export |
| Best sellers | Top N by quantity / by profit |
| Battery cost trend | Line chart, cost per model over time + compare all suppliers on one chart (1 line = 1 supplier) |
| Stock value | Total + by category + by costing method (FIFO/WAC/Last) |
| Low stock | `qty_available <= reorder_point` |
| Dead stock | No movement for > N days (from settings) |
| Purchases by supplier | Total amount + order count + average price |
| Claim rate | `v_claim_rate_by_product` + compare by supplier |
| Commissions | Monthly summary by customer/technician + "Mark as paid" button |

> The **Commissions** page matters a lot — the owner checks it most often. It must work well on mobile: large totals at the top, job list below.

