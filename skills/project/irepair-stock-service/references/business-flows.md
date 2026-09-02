# Business Flows (implement exactly as written)

### 7.1 Purchasing → Receiving

```
PO (draft) → ordered → [Goods Receipt, can receive partially] → partial/received
  ↓ every GR item creates 1 inventory_lot (condition = 'good')
  ↓ calculate landed_unit_cost
  ↓ insert stock_movements (movement_type = 'receipt', qty = +N)
  ↓ upsert supplier_products.last_price + last_purchased_at
  ↓ update purchase_order_items.qty_received
  ↓ if every line is fully received → po.status = 'received', else 'partial'
```

All of this must run in a **single transaction** (a Postgres function / RPC). Never fire multiple separate queries from the client.

### 7.2 Repair Job (battery swap) — the shop's main flow

```
1. Intake       → repair_jobs (status='received') + device_imei (required)
                   job_kind comes from customers.kind → sets price_tier automatically
2. Draw parts   → repair_job_items (is_issued=false)
                   → inventory_lots.qty_reserved += qty   ← reservation only
                   → no stock_movements row yet
3. Close job    → call issue_stock_fifo() for every line
   (done)         → repair_job_items.is_issued = true, save lot_id + unit_cost
                   → stock_items.installed_device_imei = job.device_imei (if track_serial)
                   → create warranties (start = close date, days = product.warranty_days ?? default)
                   → calculate parts_cost_total / parts_total / grand_total / gross_profit
                   → if customers.commission_eligible = true → create commission_entries
                        rate = app_settings.commission_per_unit (snapshot)
                        qty  = 1 per device (not per part line)
4. Deliver      → status='delivered', delivered_at = now()
```

**Cancelling a job:** if not yet `is_issued` → just release `qty_reserved`. If stock was already deducted → create an `adjust_in` movement to return it to the original lot.

### 7.3 Defective Claim

```
Defect found → transfer_condition: good → defective_pending_claim (qty_remaining moves to a sub-lot)
Create claim → claim_items → send to supplier (status='sent')
             → movement 'claim_out', condition_to='sent_to_supplier'
Replacement received → create a new inventory_lot (unit_cost = original lot's cost, qty = resolved_qty)
             → movement 'claim_in', claim_items.replacement_lot_id
Supplier rejects → condition = 'scrap' → written off as an expense
```

### 7.4 Document Numbers

Format: `{PREFIX}-{YYYY}-{NNNN}` (`PO`, `GR`, `JOB`, `SO`, `CLM`, `LOT`) — generate in the database using a per-year sequence. Never generate document numbers on the client (race condition).

