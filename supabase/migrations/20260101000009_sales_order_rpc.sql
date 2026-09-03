-- Phase 5: sales_orders doc_no generator + create_sales_order RPC
-- SO-YYYY-NNNN (per day)

create or replace function generate_sales_order_doc_no() returns text
language plpgsql as $$
declare
  doc text;
begin
  doc := format('SO-%s-%s',
    to_char(current_date, 'YYYY'),
    lpad(((select count(*) from sales_orders where sold_at::date = current_date) + 1)::text, 4, '0'));
  return doc;
end; $$;

create or replace function sales_orders_set_doc_no() returns trigger
language plpgsql as $$
begin
  if new.doc_no is null or new.doc_no = '' then
    new.doc_no := generate_sales_order_doc_no();
  end if;
  return new;
end; $$;

drop trigger if exists trg_sales_orders_doc_no on sales_orders;
create trigger trg_sales_orders_doc_no
  before insert on sales_orders
  for each row execute function sales_orders_set_doc_no();

-- create_sales_order: validates, inserts header+items, FIFO issue via issue_stock_fifo,
-- computes subtotal/vat/grand_total/cost_total/gross_profit from server side (single source of truth).
create or replace function create_sales_order(
  p_customer_id uuid,
  p_price_tier price_tier,
  p_tax_mode tax_mode,
  p_vat_rate numeric,
  p_discount numeric,
  p_note text,
  p_items jsonb, -- [{product_id, qty, unit_price}]
  p_actor_id uuid
) returns uuid
language plpgsql
security definer
as $$
declare
  v_order_id uuid;
  v_subtotal numeric(12,2) := 0;
  v_vat numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
  v_cost_total numeric(12,2) := 0;
  v_item record;
  v_calc record;
  v_qty int;
  v_unit_price numeric(12,2);
begin
  -- header
  insert into sales_orders (customer_id, price_tier, tax_mode, vat_rate, discount, note, created_by)
  values (p_customer_id, p_price_tier, p_tax_mode, p_vat_rate, p_discount, p_note, p_actor_id)
  returning id into v_order_id;

  -- items
  for v_item in
    select (i->>'product_id')::uuid as product_id,
           (i->>'qty')::int as qty,
           (i->>'unit_price')::numeric(12,2) as unit_price
    from jsonb_array_elements(p_items) i
  loop
    v_qty := v_item.qty;
    v_unit_price := v_item.unit_price;
    -- FIFO issue: returns total cost for this line
    select * into v_calc from issue_stock_fifo(
      v_item.product_id,
      v_qty,
      'sales_orders',
      v_order_id,
      'sale',
      null
    );
    -- record line
    insert into sales_order_items (sales_order_id, product_id, lot_id, stock_item_id, qty, unit_cost, unit_price)
    values (v_order_id, v_item.product_id, v_calc.lot_id, null, v_qty, (v_calc.total_cost / v_qty)::numeric(12,2), v_unit_price);

    v_subtotal := v_subtotal + (v_qty * v_unit_price);
    v_cost_total := v_cost_total + v_calc.total_cost;
  end loop;

  v_subtotal := round2(v_subtotal);
  v_subtotal := v_subtotal - p_discount;
  if v_subtotal < 0 then v_subtotal := 0; end if;

  -- tax
  if p_tax_mode = 'none' then
    v_vat := 0;
    v_total := v_subtotal;
  elsif p_tax_mode = 'inclusive' then
    -- v_subtotal already includes VAT; back out VAT
    v_vat := round2(v_subtotal - (v_subtotal / (1 + p_vat_rate / 100)));
    v_total := v_subtotal;
  else -- exclusive
    v_vat := round2(v_subtotal * p_vat_rate / 100);
    v_total := v_subtotal + v_vat;
  end if;

  update sales_orders
  set subtotal = v_subtotal, vat_amount = v_vat, grand_total = v_total,
      cost_total = v_cost_total, gross_profit = (v_total - v_cost_total)
  where id = v_order_id;

  return v_order_id;
end; $$;

-- ponytail: round2 helper (also exists in app code; safe duplicate via or replace)
create or replace function round2(n numeric) returns numeric
language sql immutable as $$ select round(n, 2) $$;

revoke all on function create_sales_order(uuid, price_tier, tax_mode, numeric, numeric, text, jsonb, uuid) from public;
grant execute on function create_sales_order(uuid, price_tier, tax_mode, numeric, numeric, text, jsonb, uuid) to authenticated;