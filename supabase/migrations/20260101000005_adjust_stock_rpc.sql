-- iRepair — adjust_stock RPC (adjust_in / adjust_out in one transaction)
-- ponytail: server action calls ONE RPC; never multiple queries from client.
-- ponytail: cost math in numeric(12,2) on the DB side.

create or replace function adjust_stock(
  p_product_id      uuid,
  p_qty_delta       integer,  -- positive = adjust_in, negative = adjust_out
  p_unit_cost       numeric,
  p_lot_id          uuid,
  p_note            text,
  p_condition_from  stock_condition default 'good',
  p_condition_to    stock_condition default 'good'
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_abs_qty integer := abs(p_qty_delta);
  v_sign   text;
  v_movement_type movement_type;
  v_available integer;
begin
  if v_abs_qty <= 0 then
    raise exception 'INVALID_QTY: must be non-zero';
  end if;

  if p_qty_delta > 0 then
    v_movement_type := 'adjust_in';
    v_sign := '+';
  else
    v_movement_type := 'adjust_out';
    v_sign := '-';
  end if;

  -- for adjust_out: ensure we have enough qty_remaining
  if p_qty_delta < 0 then
    select qty_remaining into v_available
      from inventory_lots where id = p_lot_id;
    if v_available is null then
      raise exception 'LOT_NOT_FOUND';
    end if;
    if v_available < v_abs_qty then
      raise exception 'INSUFFICIENT_STOCK: lot has %, need %', v_available, v_abs_qty;
    end if;
  end if;

  -- stock movement record
  insert into stock_movements (
    product_id, lot_id, movement_type, qty, unit_cost,
    condition_from, condition_to, note, created_by
  ) values (
    p_product_id, p_lot_id, v_movement_type, p_qty_delta, p_unit_cost,
    p_condition_from, p_condition_to, p_note, auth.uid()
  );

  -- update lot qty_remaining
  update inventory_lots
    set qty_remaining = qty_remaining + p_qty_delta
    where id = p_lot_id;

  -- update product qty_good from v_stock_summary (aggregate stays consistent)
  -- (no product-level qty column; v_stock_summary computes from movements)
end; $$;

revoke all on function adjust_stock(uuid, integer, numeric, uuid, text, stock_condition, stock_condition) from public;
grant execute on function adjust_stock(uuid, integer, numeric, uuid, text, stock_condition, stock_condition) to authenticated;
