-- RLS policies + helper function
create or replace function auth_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and is_active)
$$;

-- Enable RLS on every table
do $$ declare t text; begin
  foreach t in array array[
    'profiles','app_settings','brands','categories','device_models','suppliers','customers',
    'products','product_device_models','product_prices','supplier_products',
    'purchase_orders','purchase_order_items','goods_receipts','goods_receipt_items',
    'inventory_lots','stock_items','stock_movements',
    'repair_jobs','repair_job_items','sales_orders','sales_order_items',
    'warranties','claims','claim_items','commission_entries','audit_logs'
  ] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- Generic policies: authenticated active users can read, owner/manager can write
-- Profiles: users can read all, only owner/manager can update roles
create policy "profiles_read" on profiles for select to authenticated using (is_active_user());
create policy "profiles_write" on profiles for all to authenticated
  using (auth_role() in ('owner','manager')) with check (auth_role() in ('owner','manager'));

-- Helper to create read/write policies for other tables
do $$ declare t text; begin
  foreach t in array array[
    'app_settings','brands','categories','device_models','suppliers','customers',
    'products','product_device_models','product_prices','supplier_products',
    'purchase_orders','purchase_order_items','goods_receipts','goods_receipt_items',
    'inventory_lots','stock_items','stock_movements',
    'repair_jobs','repair_job_items','sales_orders','sales_order_items',
    'warranties','claims','claim_items','commission_entries','audit_logs'
  ] loop
    execute format('create policy %I_read on %I for select to authenticated using (is_active_user())', t||'_read', t);
    execute format('create policy %I_write on %I for all to authenticated using (auth_role() in (''owner'',''manager'')) with check (auth_role() in (''owner'',''manager''))', t||'_write', t);
  end loop;
end $$;

-- Allow technicians to manage repair jobs (narrow exception)
create policy "repair_jobs_tech_write" on repair_jobs for all to authenticated
  using (auth_role() in ('owner','manager','technician')) with check (auth_role() in ('owner','manager','technician'));
create policy "repair_job_items_tech_write" on repair_job_items for all to authenticated
  using (auth_role() in ('owner','manager','technician')) with check (auth_role() in ('owner','manager','technician'));
