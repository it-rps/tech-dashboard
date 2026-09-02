-- iRepair Stock & Service System — initial schema
-- See references/database-schema.md and references/business-context.md

-- 5.1 Enums
create type user_role as enum ('owner','manager','technician','viewer');
create type party_kind as enum ('dealer','walkin','internal');
create type price_tier as enum ('wholesale','retail');
create type tax_mode as enum ('none','inclusive','exclusive');
create type stock_condition as enum ('good','defective_pending_claim','scrap','sent_to_supplier');
create type movement_type as enum ('receipt','issue_sale','issue_repair','adjust_in','adjust_out','claim_out','claim_in','return_in','transfer_condition');
create type po_status as enum ('draft','ordered','partial','received','cancelled');
create type job_status as enum ('received','diagnosing','waiting_parts','in_progress','done','delivered','cancelled');
create type claim_status as enum ('open','sent','replaced','refunded','rejected','closed');
create type costing_method as enum ('fifo','wac','last');

-- 5.2 Core tables
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'viewer',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table app_settings (
  id smallint primary key default 1 check (id = 1),
  vat_rate numeric(5,2) not null default 7.00,
  default_tax_mode tax_mode not null default 'none',
  commission_per_unit numeric(12,2) not null default 50.00,
  default_warranty_days integer not null default 90,
  costing_method costing_method not null default 'fifo',
  low_stock_default integer not null default 5,
  dead_stock_days integer not null default 90,
  updated_at timestamptz not null default now()
);

create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name_th text not null,
  name_en text not null,
  slug text not null unique,
  requires_imei boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table device_models (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  device_type text not null,
  series text,
  release_year integer,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  unique (name, device_type)
);

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  shop_name text,
  address text,
  phone text,
  line_id text,
  contact_person text,
  tax_id text,
  bank_account text,
  payment_terms_days integer not null default 0,
  lead_time_days integer,
  rating smallint check (rating between 1 and 5),
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  kind party_kind not null default 'walkin',
  default_price_tier price_tier not null default 'retail',
  commission_eligible boolean not null default true,
  phone text, line_id text, address text, tax_id text,
  credit_limit numeric(12,2) not null default 0,
  credit_terms_days integer not null default 0,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  barcode text unique,
  name_th text not null,
  name_en text not null,
  category_id uuid not null references categories(id),
  brand_id uuid references brands(id),
  capacity_mah integer,
  requires_tagon boolean not null default false,
  track_serial boolean not null default false,
  warranty_days integer,
  reorder_point integer not null default 0,
  unit text not null default 'ชิ้น',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_device_models (
  product_id uuid references products(id) on delete cascade,
  device_model_id uuid references device_models(id) on delete cascade,
  primary key (product_id, device_model_id)
);

create table product_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  tier price_tier not null,
  price numeric(12,2) not null check (price >= 0),
  effective_from date not null default current_date,
  created_at timestamptz not null default now()
);
create index on product_prices (product_id, tier, effective_from desc);

create table supplier_products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  supplier_sku text,
  last_price numeric(12,2),
  last_purchased_at timestamptz,
  unique (supplier_id, product_id)
);

create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  doc_no text not null unique,
  supplier_id uuid not null references suppliers(id),
  status po_status not null default 'draft',
  order_date date not null default current_date,
  expected_date date,
  tax_mode tax_mode not null default 'none',
  vat_rate numeric(5,2) not null default 7.00,
  shipping_cost numeric(12,2) not null default 0,
  other_cost numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null default 0,
  vat_amount numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  note text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  product_id uuid not null references products(id),
  qty_ordered integer not null check (qty_ordered > 0),
  qty_received integer not null default 0,
  unit_cost numeric(12,2) not null check (unit_cost >= 0),
  line_total numeric(12,2) generated always as (qty_ordered * unit_cost) stored
);

create table goods_receipts (
  id uuid primary key default gen_random_uuid(),
  doc_no text not null unique,
  purchase_order_id uuid references purchase_orders(id),
  supplier_id uuid not null references suppliers(id),
  received_date date not null default current_date,
  shipping_cost numeric(12,2) not null default 0,
  note text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table goods_receipt_items (
  id uuid primary key default gen_random_uuid(),
  goods_receipt_id uuid not null references goods_receipts(id) on delete cascade,
  purchase_order_item_id uuid references purchase_order_items(id),
  product_id uuid not null references products(id),
  qty integer not null check (qty > 0),
  unit_cost numeric(12,2) not null
);

create table inventory_lots (
  id uuid primary key default gen_random_uuid(),
  lot_no text not null unique,
  product_id uuid not null references products(id),
  supplier_id uuid references suppliers(id),
  goods_receipt_item_id uuid references goods_receipt_items(id),
  received_at timestamptz not null default now(),
  qty_received integer not null check (qty_received > 0),
  qty_remaining integer not null check (qty_remaining >= 0),
  qty_reserved integer not null default 0 check (qty_reserved >= 0),
  unit_cost numeric(12,2) not null,
  landed_unit_cost numeric(12,2) not null,
  condition stock_condition not null default 'good',
  warranty_days integer,
  note text,
  constraint lot_qty_valid check (qty_remaining <= qty_received)
);
create index on inventory_lots (product_id, condition, received_at);

create table stock_items (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references inventory_lots(id) on delete cascade,
  product_id uuid not null references products(id),
  serial_no text,
  condition stock_condition not null default 'good',
  installed_device_imei text,
  repair_job_id uuid,
  sales_order_id uuid,
  created_at timestamptz not null default now(),
  unique (product_id, serial_no)
);

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  lot_id uuid references inventory_lots(id),
  stock_item_id uuid references stock_items(id),
  movement_type movement_type not null,
  qty integer not null,
  unit_cost numeric(12,2) not null default 0,
  condition_from stock_condition,
  condition_to stock_condition,
  ref_table text,
  ref_id uuid,
  device_imei text,
  note text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index on stock_movements (product_id, created_at desc);
create index on stock_movements (ref_table, ref_id);

create table repair_jobs (
  id uuid primary key default gen_random_uuid(),
  doc_no text not null unique,
  customer_id uuid not null references customers(id),
  job_kind party_kind not null,
  device_model_id uuid references device_models(id),
  device_imei text not null,
  device_color text,
  passcode text,
  symptom text,
  diagnosis text,
  status job_status not null default 'received',
  price_tier price_tier not null default 'retail',
  labor_fee numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  tax_mode tax_mode not null default 'none',
  vat_rate numeric(5,2) not null default 7.00,
  parts_total numeric(12,2) not null default 0,
  parts_cost_total numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  gross_profit numeric(12,2) not null default 0,
  received_at timestamptz not null default now(),
  closed_at timestamptz,
  delivered_at timestamptz,
  technician_id uuid references profiles(id),
  note text,
  created_by uuid references profiles(id)
);
create index on repair_jobs (status, received_at desc);
create index on repair_jobs (customer_id, received_at desc);

create table repair_job_items (
  id uuid primary key default gen_random_uuid(),
  repair_job_id uuid not null references repair_jobs(id) on delete cascade,
  product_id uuid not null references products(id),
  lot_id uuid references inventory_lots(id),
  stock_item_id uuid references stock_items(id),
  qty integer not null default 1 check (qty > 0),
  unit_cost numeric(12,2) not null default 0,
  unit_price numeric(12,2) not null default 0,
  is_optional boolean not null default false,
  is_issued boolean not null default false
);

create table sales_orders (
  id uuid primary key default gen_random_uuid(),
  doc_no text not null unique,
  customer_id uuid not null references customers(id),
  price_tier price_tier not null default 'retail',
  sold_at timestamptz not null default now(),
  tax_mode tax_mode not null default 'none',
  vat_rate numeric(5,2) not null default 7.00,
  discount numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null default 0,
  vat_amount numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  cost_total numeric(12,2) not null default 0,
  gross_profit numeric(12,2) not null default 0,
  note text,
  created_by uuid references profiles(id)
);

create table sales_order_items (
  id uuid primary key default gen_random_uuid(),
  sales_order_id uuid not null references sales_orders(id) on delete cascade,
  product_id uuid not null references products(id),
  lot_id uuid references inventory_lots(id),
  stock_item_id uuid references stock_items(id),
  qty integer not null check (qty > 0),
  unit_cost numeric(12,2) not null default 0,
  unit_price numeric(12,2) not null
);

create table warranties (
  id uuid primary key default gen_random_uuid(),
  source_table text not null,
  source_id uuid not null,
  product_id uuid not null references products(id),
  lot_id uuid references inventory_lots(id),
  stock_item_id uuid references stock_items(id),
  customer_id uuid references customers(id),
  device_imei text,
  start_date date not null default current_date,
  days integer not null,
  end_date date generated always as (start_date + days) stored,
  is_void boolean not null default false,
  note text
);
create index on warranties (device_imei);
create index on warranties (end_date);

create table claims (
  id uuid primary key default gen_random_uuid(),
  doc_no text not null unique,
  supplier_id uuid not null references suppliers(id),
  status claim_status not null default 'open',
  opened_at timestamptz not null default now(),
  sent_at timestamptz,
  closed_at timestamptz,
  note text,
  created_by uuid references profiles(id)
);

create table claim_items (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  product_id uuid not null references products(id),
  lot_id uuid references inventory_lots(id),
  stock_item_id uuid references stock_items(id),
  qty integer not null check (qty > 0),
  reason text,
  replacement_lot_id uuid references inventory_lots(id),
  resolved_qty integer not null default 0
);

create table commission_entries (
  id uuid primary key default gen_random_uuid(),
  repair_job_id uuid references repair_jobs(id) on delete cascade,
  technician_id uuid references profiles(id),
  customer_id uuid references customers(id),
  qty integer not null default 1,
  rate numeric(12,2) not null,
  amount numeric(12,2) generated always as (qty * rate) stored,
  period_month date not null,
  is_paid boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index on commission_entries (period_month, technician_id);

create table audit_logs (
  id bigserial primary key,
  table_name text not null,
  record_id uuid,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  actor_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- 5.3 Required views
create or replace view v_stock_summary as
select
  p.id as product_id, p.sku, p.name_th, p.name_en, p.reorder_point,
  c.slug as category_slug, b.name as brand_name,
  coalesce(sum(l.qty_remaining) filter (where l.condition = 'good'), 0) as qty_good,
  coalesce(sum(l.qty_reserved) filter (where l.condition = 'good'), 0) as qty_reserved,
  coalesce(sum(l.qty_remaining) filter (where l.condition = 'good'), 0)
    - coalesce(sum(l.qty_reserved) filter (where l.condition = 'good'), 0) as qty_available,
  coalesce(sum(l.qty_remaining) filter (where l.condition = 'defective_pending_claim'), 0) as qty_defective,
  coalesce(sum(l.qty_remaining) filter (where l.condition = 'scrap'), 0) as qty_scrap,
  case when coalesce(sum(l.qty_remaining) filter (where l.condition='good'),0) > 0
    then round(sum(l.qty_remaining * l.landed_unit_cost) filter (where l.condition='good')
             / sum(l.qty_remaining) filter (where l.condition='good'), 2)
    else 0 end as wac_cost,
  (select l2.landed_unit_cost from inventory_lots l2
    where l2.product_id = p.id order by l2.received_at desc limit 1) as last_cost,
  coalesce(sum(l.qty_remaining * l.landed_unit_cost) filter (where l.condition='good'), 0) as stock_value
from products p
left join categories c on c.id = p.category_id
left join brands b on b.id = p.brand_id
left join inventory_lots l on l.product_id = p.id
where p.is_active
group by p.id, c.slug, b.name;

create or replace view v_supplier_price_compare as
select
  sp.product_id, p.sku, p.name_th,
  s.id as supplier_id, s.name as supplier_name,
  sp.last_price, sp.last_purchased_at,
  rank() over (partition by sp.product_id order by sp.last_price asc) as price_rank
from supplier_products sp
join suppliers s on s.id = sp.supplier_id and s.is_active
join products p on p.id = sp.product_id
where sp.last_price is not null;

create or replace view v_claim_rate_by_product as
select
  p.id as product_id, p.sku, p.name_th,
  coalesce(sold.qty, 0) as qty_sold,
  coalesce(claimed.qty, 0) as qty_claimed,
  case when coalesce(sold.qty,0) > 0
       then round(coalesce(claimed.qty,0)::numeric / sold.qty * 100, 2)
       else 0 end as claim_rate_pct
from products p
left join (
  select product_id, sum(abs(qty)) qty from stock_movements
  where movement_type in ('issue_sale','issue_repair') group by product_id
) sold on sold.product_id = p.id
left join (
  select product_id, sum(qty) qty from claim_items group by product_id
) claimed on claimed.product_id = p.id;
