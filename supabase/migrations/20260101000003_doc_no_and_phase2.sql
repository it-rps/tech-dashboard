-- iRepair — doc_no generators + purchase order RLS helpers
-- ponytail: kept as a single migration per phase, idempotent.

-- ─── doc_no generators ───────────────────────────────────────────────
-- PO-YYYY-NNNN (per day count)
create or replace function generate_purchase_order_doc_no() returns text
language plpgsql as $$
declare
  doc text;
begin
  doc := format('PO-%s-%s',
    to_char(current_date, 'YYYY'),
    lpad(((select count(*) from purchase_orders where order_date::date = current_date) + 1)::text, 4, '0'));
  return doc;
end; $$;

-- GR-YYYY-NNNN (per day count)
create or replace function generate_goods_receipt_doc_no() returns text
language plpgsql as $$
declare
  doc text;
begin
  doc := format('GR-%s-%s',
    to_char(current_date, 'YYYY'),
    lpad(((select count(*) from goods_receipts where received_date::date = current_date) + 1)::text, 4, '0'));
  return doc;
end; $$;

-- LOT-YYYYMMDD-NNNN (per day)
create or replace function generate_lot_no() returns text
language plpgsql as $$
declare
  doc text;
begin
  doc := format('LOT-%s-%s',
    to_char(current_date, 'YYYYMMDD'),
    lpad(((select count(*) from inventory_lots where received_at::date = current_date) + 1)::text, 4, '0'));
  return doc;
end; $$;

-- ─── Defaults via BEFORE INSERT trigger ───────────────────────────────
-- purchase_orders
create or replace function purchase_orders_set_doc_no() returns trigger
language plpgsql as $$
begin
  if new.doc_no is null or new.doc_no = '' then
    new.doc_no := generate_purchase_order_doc_no();
  end if;
  return new;
end; $$;
drop trigger if exists purchase_orders_set_doc_no_trg on purchase_orders;
create trigger purchase_orders_set_doc_no_trg
  before insert on purchase_orders
  for each row execute function purchase_orders_set_doc_no();

-- goods_receipts
create or replace function goods_receipts_set_doc_no() returns trigger
language plpgsql as $$
begin
  if new.doc_no is null or new.doc_no = '' then
    new.doc_no := generate_goods_receipt_doc_no();
  end if;
  return new;
end; $$;
drop trigger if exists goods_receipts_set_doc_no_trg on goods_receipts;
create trigger goods_receipts_set_doc_no_trg
  before insert on goods_receipts
  for each row execute function goods_receipts_set_doc_no();

-- inventory_lots
create or replace function inventory_lots_set_lot_no() returns trigger
language plpgsql as $$
begin
  if new.lot_no is null or new.lot_no = '' then
    new.lot_no := generate_lot_no();
  end if;
  return new;
end; $$;
drop trigger if exists inventory_lots_set_lot_no_trg on inventory_lots;
create trigger inventory_lots_set_lot_no_trg
  before insert on inventory_lots
  for each row execute function inventory_lots_set_lot_no();
