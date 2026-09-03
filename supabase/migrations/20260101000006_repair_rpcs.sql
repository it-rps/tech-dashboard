-- iRepair — repair RPCs + doc_no trigger
-- ponytail: single RPC for FIFO deduction + job close (Rule Set A)
-- ponytail: doc_no generated in DB, never TypeScript (Rule Set H)

-- 1. FIFO stock deduction (from costing-logic.md §6.2)
create or replace function issue_stock_fifo(
  p_product_id uuid,
  p_qty        integer,
  p_ref_table  text,
  p_ref_id     uuid,
  p_movement   movement_type,
  p_imei       text default null
) returns table (lot_id uuid, qty_taken integer, unit_cost numeric)
language plpgsql security definer set search_path = public as $$
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
end; $$;

revoke all on function issue_stock_fifo(uuid, integer, text, uuid, movement_type, text) from public;
grant execute on function issue_stock_fifo(uuid, integer, text, uuid, movement_type, text) to authenticated;

-- 2. Doc number generator for repair_jobs (JOB-YYYY-NNNN)
create or replace function generate_repair_job_doc_no()
returns text language plpgsql set search_path = public as $$
declare
  v_year text := to_char(current_date, 'YYYY');
  v_seq  int;
begin
  select nextval('repair_job_doc_no_seq') into v_seq;
  return 'JOB-' || v_year || '-' || lpad(v_seq::text, 4, '0');
end; $$;

-- per-year sequence
create sequence if not exists repair_job_doc_no_seq;

-- trigger BEFORE INSERT
create or replace function repair_jobs_set_doc_no()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.doc_no is null or new.doc_no = '' then
    new.doc_no := generate_repair_job_doc_no();
  end if;
  return new;
end; $$;

drop trigger if exists repair_jobs_set_doc_no_trg on repair_jobs;
create trigger repair_jobs_set_doc_no_trg
before insert on repair_jobs
for each row execute function repair_jobs_set_doc_no();

-- 3. Close repair job — single transaction
create or replace function close_repair_job(
  p_job_id       uuid,
  p_labor_fee    numeric,
  p_discount     numeric,
  p_actor_id     uuid
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_job record;
  v_item record;
  v_lot record;
  v_warranty_days int;
  v_comm_per_unit numeric;
  v_comm_eligible boolean;
  v_parts_total numeric := 0;
  v_parts_cost  numeric := 0;
  v_vat_base    numeric;
  v_vat_amt     numeric;
  v_grand       numeric;
  v_gross       numeric;
begin
  -- lock the job
  select * into v_job from repair_jobs where id = p_job_id for update;
  if not found then raise exception 'JOB_NOT_FOUND'; end if;
  if v_job.status = 'done' or v_job.status = 'delivered' then
    raise exception 'JOB_ALREADY_CLOSED';
  end if;

  -- device_imei is required (Rule Set L)
  if v_job.device_imei is null or v_job.device_imei = '' then
    raise exception 'MIMEI_REQUIRED: device IMEI must be set before closing';
  end if;

  -- get settings snapshot (Rule Set D.6)
  select commission_per_unit into v_comm_per_unit from app_settings where id = 1;
  select commission_eligible into v_comm_eligible
    from customers where id = v_job.customer_id;

  -- issue stock for each line (FIFO), compute totals
  for v_item in
    select rji.*, p.track_serial, p.warranty_days
    from repair_job_items rji
    join products p on p.id = rji.product_id
    where rji.repair_job_id = p_job_id
      and rji.is_issued = false
  loop
    -- FIFO issue for each qty
    for v_lot in
      select * from issue_stock_fifo(
        v_item.product_id, v_item.qty,
        'repair_jobs', p_job_id,
        'issue_repair', v_job.device_imei
      )
    loop
      v_parts_cost := v_parts_cost + (v_lot.qty_taken * v_lot.unit_cost);
      v_parts_total := v_parts_total + (v_item.qty * v_item.unit_price);
    end loop;

    -- mark line issued
    update repair_job_items
      set is_issued = true,
          unit_cost = v_parts_cost / nullif(v_item.qty, 0)  -- avg FIFO cost for this line
      where id = v_item.id;

    -- warranty (Rule Set I)
    v_warranty_days := coalesce(v_item.warranty_days,
                        (select default_warranty_days from app_settings where id = 1));
    if v_warranty_days > 0 then
      insert into warranties
        (source_table, source_id, product_id, lot_id, stock_item_id,
         customer_id, device_imei, start_date, days, note)
      values
        ('repair_jobs', p_job_id, v_item.product_id, null, null,
         v_job.customer_id, v_job.device_imei, current_date, v_warranty_days,
         'Repair job ' || v_job.doc_no || ' — ' || v_item.qty || 'x ' || v_item.product_id);
    end if;

    -- stock_items for serial-tracked (Rule Set L)
    if v_item.track_serial then
      insert into stock_items
        (lot_id, product_id, condition, installed_device_imei, repair_job_id, created_by)
      values
        (null, v_item.product_id, 'good', v_job.device_imei, p_job_id, p_actor_id);
    end if;
  end loop;

  -- calculate totals (Rule Set K: calcTax pattern)
  if v_job.tax_mode = 'inclusive' then
    v_vat_base := (v_parts_total + p_labor_fee - p_discount) / (1 + coalesce(v_job.vat_rate, 7) / 100);
    v_vat_amt := round((v_parts_total + p_labor_fee - p_discount - v_vat_base)::numeric, 2);
  elsif v_job.tax_mode = 'exclusive' then
    v_vat_base := v_parts_total + p_labor_fee - p_discount;
    v_vat_amt := round(v_vat_base * coalesce(v_job.vat_rate, 7) / 100, 2);
  else
    v_vat_base := v_parts_total + p_labor_fee - p_discount;
    v_vat_amt := 0;
  end if;

  v_grand := v_parts_total + p_labor_fee - p_discount + v_vat_amt;
  v_gross := v_parts_total - v_parts_cost + p_labor_fee - p_discount;

  -- update job totals + status
  update repair_jobs
    set status = 'done',
        closed_at = now(),
        labor_fee = p_labor_fee,
        discount = p_discount,
        parts_total = v_parts_total,
        parts_cost_total = v_parts_cost,
        grand_total = v_grand,
        gross_profit = v_gross,
        technician_id = coalesce(v_job.technician_id, p_actor_id)
    where id = p_job_id;

  -- commission (Rule Set D)
  if v_comm_eligible and v_job.job_kind in ('dealer','walkin') then
    insert into commission_entries
      (repair_job_id, technician_id, customer_id, qty, rate, amount, period_month)
    values
      (p_job_id, coalesce(v_job.technician_id, p_actor_id), v_job.customer_id,
       1, v_comm_per_unit, v_comm_per_unit, date_trunc('month', now())::date);
  end if;
end; $$;

revoke all on function close_repair_job(uuid, numeric, numeric, uuid) from public;
grant execute on function close_repair_job(uuid, numeric, numeric, uuid) to authenticated;