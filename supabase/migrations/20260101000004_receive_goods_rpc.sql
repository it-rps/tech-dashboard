-- iRepair — receive_goods RPC (single transaction for GR flow)
-- ponytail: server action calls ONE RPC; never multiple queries from client.
-- ponytail: cost math in numeric(12,2) on the DB side.

create or replace function receive_goods(
  p_supplier_id          uuid,
  p_purchase_order_id    uuid,
  p_received_date        date,
  p_shipping_cost        numeric,
  p_note                 text,
  p_items                jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_gr_id          uuid;
  v_po_id          uuid := p_purchase_order_id;
  v_total_qty      integer := 0;
  v_item           jsonb;
  v_po_item_id     uuid;
  v_product_id     uuid;
  v_qty            integer;
  v_unit_cost      numeric;
  v_line_share     numeric;
  v_landed         numeric;
  v_lot_id         uuid;
  v_all_received   boolean := true;
  v_any_received   boolean := false;
  v_po_status      po_status;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_RECEIPT: at least one item required';
  end if;

  -- create the goods receipt header (doc_no from trigger)
  insert into goods_receipts (purchase_order_id, supplier_id, received_date, shipping_cost, note, created_by)
  values (v_po_id, p_supplier_id, coalesce(p_received_date, current_date), coalesce(p_shipping_cost, 0), p_note, auth.uid())
  returning id into v_gr_id;

  -- total qty for landed-cost allocation
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'qty')::integer;
    if v_qty is null or v_qty <= 0 then
      raise exception 'INVALID_QTY: qty must be > 0';
    end if;
    v_total_qty := v_total_qty + v_qty;
  end loop;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_po_item_id  := nullif(v_item->>'purchase_order_item_id','')::uuid;
    v_product_id  := (v_item->>'product_id')::uuid;
    v_qty         := (v_item->>'qty')::integer;
    v_unit_cost   := (v_item->>'unit_cost')::numeric;

    -- landed cost: unit_cost + (shipping × this line qty / total qty) / this line qty
    if coalesce(p_shipping_cost,0) > 0 and v_total_qty > 0 then
      v_line_share := p_shipping_cost * (v_qty::numeric / v_total_qty);
      v_landed := round((v_unit_cost + v_line_share / v_qty)::numeric, 2);
    else
      v_landed := round(v_unit_cost::numeric, 2);
    end if;

    -- goods_receipt_items row
    insert into goods_receipt_items (goods_receipt_id, purchase_order_item_id, product_id, qty, unit_cost)
    values (v_gr_id, v_po_item_id, v_product_id, v_qty, v_unit_cost);

    -- inventory_lot (one per GR line)
    insert into inventory_lots (product_id, supplier_id, goods_receipt_item_id, qty_received, qty_remaining, unit_cost, landed_unit_cost, condition)
    values (v_product_id, p_supplier_id, (select id from goods_receipt_items where goods_receipt_id = v_gr_id order by id desc limit 1),
            v_qty, v_qty, v_unit_cost, v_landed, 'good')
    returning id into v_lot_id;

    -- stock_movements (receipt, +qty)
    insert into stock_movements (product_id, lot_id, movement_type, qty, unit_cost, condition_from, condition_to, ref_table, ref_id, created_by)
    values (v_product_id, v_lot_id, 'receipt', v_qty, v_landed, 'good', 'good', 'goods_receipts', v_gr_id, auth.uid());

    -- upsert supplier_products
    insert into supplier_products (supplier_id, product_id, last_price, last_purchased_at)
    values (p_supplier_id, v_product_id, v_unit_cost, now())
    on conflict (supplier_id, product_id) do update
      set last_price = excluded.last_price,
          last_purchased_at = excluded.last_purchased_at;

    -- update PO line qty_received (if linked)
    if v_po_item_id is not null then
      update purchase_order_items
        set qty_received = qty_received + v_qty
        where id = v_po_item_id;
    end if;

    v_any_received := true;
  end loop;

  -- decide PO status from its lines
  if v_po_id is not null then
    select bool_and(coalesce(poi.qty_received,0) >= poi.qty_ordered) into v_all_received
      from purchase_order_items poi where poi.purchase_order_id = v_po_id;
    select bool_or(coalesce(poi.qty_received,0) > 0 and coalesce(poi.qty_received,0) < poi.qty_ordered) into v_any_received
      from purchase_order_items poi where poi.purchase_order_id = v_po_id;

    if v_all_received then
      v_po_status := 'received';
    elsif v_any_received then
      v_po_status := 'partial';
    else
      v_po_status := 'ordered';
    end if;

    update purchase_orders set status = v_po_status where id = v_po_id;
  end if;

  return v_gr_id;
end; $$;

-- only owner/manager can call
revoke all on function receive_goods(uuid, uuid, date, numeric, text, jsonb) from public;
grant execute on function receive_goods(uuid, uuid, date, numeric, text, jsonb) to authenticated;
