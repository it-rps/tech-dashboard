# Costing Logic (must be 100% correct)

The system supports 3 costing methods. The user picks a default in Settings, and can switch between methods when viewing reports.

| Method | Used for | Formula |
|---|---|---|
| FIFO | Actual cost of goods sold (default) | Deduct from the oldest `received_at` lot first |
| WAC | Value of remaining stock / overview reports | `Σ(qty × landed_cost) / Σ(qty)` |
| Last Cost | Setting sale prices / cost-increase alerts | `landed_unit_cost` of the most recent lot |

### 6.1 Landed Cost

```
landed_unit_cost = unit_cost + (GR shipping_cost × (this line's qty / total GR qty)) / this line's qty
```

If `shipping_cost = 0` → `landed_unit_cost = unit_cost` (the current case).

### 6.2 FIFO Stock-Deduction Function (used as an RPC)

```sql
create or replace function issue_stock_fifo(
  p_product_id uuid,
  p_qty        integer,
  p_ref_table  text,
  p_ref_id     uuid,
  p_movement   movement_type,
  p_imei       text default null
) returns table (lot_id uuid, qty_taken integer, unit_cost numeric)
language plpgsql security definer set search_path = public as $
declare
  v_remaining integer := p_qty;
  v_lot record;
  v_take integer;
begin
  if p_qty <= 0 then raise exception 'qty must be > 0'; end if;

  for v_lot in
    select id, qty_remaining, qty_reserved, landed_unit_cost
    from inventory_lots
    where product_id = p_product_id
      and condition  = 'good'
      and qty_remaining > 0
    order by received_at asc, id asc
    for update
  loop
    exit when v_remaining <= 0;
    v_take := least(v_remaining, v_lot.qty_remaining);

    update inventory_lots
      set qty_remaining = qty_remaining - v_take,
          qty_reserved  = greatest(0, qty_reserved - v_take)
      where id = v_lot.id;

    insert into stock_movements
      (product_id, lot_id, movement_type, qty, unit_cost,
       condition_from, condition_to, ref_table, ref_id, device_imei, created_by)
    values
      (p_product_id, v_lot.id, p_movement, -v_take, v_lot.landed_unit_cost,
       'good', 'good', p_ref_table, p_ref_id, p_imei, auth.uid());

    lot_id := v_lot.id; qty_taken := v_take; unit_cost := v_lot.landed_unit_cost;
    return next;
    v_remaining := v_remaining - v_take;
  end loop;

  if v_remaining > 0 then
    raise exception 'STOCK_INSUFFICIENT: product % short by % units', p_product_id, v_remaining;
  end if;
end;
$;
```

### 6.3 VAT (`src/lib/money.ts`)

```ts
export type TaxMode = "none" | "inclusive" | "exclusive";

/** Calculate VAT — returns amounts in baht, rounded to 2 decimal places */
export function calcTax(amount: number, mode: TaxMode, rate = 7) {
  const r = rate / 100;
  if (mode === "none")      return { base: round2(amount), vat: 0,                       total: round2(amount) };
  if (mode === "exclusive") return { base: round2(amount), vat: round2(amount * r),      total: round2(amount * (1 + r)) };
  // inclusive: the amount already includes VAT
  const base = amount / (1 + r);
  return { base: round2(base), vat: round2(amount - base), total: round2(amount) };
}

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const formatTHB = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(n);
```

