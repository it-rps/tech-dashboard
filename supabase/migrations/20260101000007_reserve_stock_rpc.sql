-- iRepair — reserve_stock RPC (FIFO reservation, qty_reserved++ only)
-- ponytail: Rule Set B — stock deduction is two-phase (reserve, then issue on close)

create or replace function reserve_stock(
  p_product_id uuid,
  p_qty        integer
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_remaining integer := p_qty;
  v_lot record;
  v_take integer;
begin
  if p_qty <= 0 then raise exception 'qty must be > 0'; end if;

  for v_lot in
    select id, qty_remaining
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
      set qty_reserved = qty_reserved + v_take
      where id = v_lot.id;

    v_remaining := v_remaining - v_take;
  end loop;

  if v_remaining > 0 then
    raise exception 'STOCK_INSUFFICIENT: product % short by % units (reserve)', p_product_id, v_remaining;
  end if;
end; $$;

revoke all on function reserve_stock(uuid, integer) from public;
grant execute on function reserve_stock(uuid, integer) to authenticated;