-- Phase 7: Dashboard views (low-stock, sales-by-day, top-products,
-- repair-revenue, tech-commission, warranty-expiry, aging-stock,
-- stock-value-by-brand).
--
-- 1. Low stock: qty_available < reorder_point
create or replace view v_low_stock as
select
  product_id,
  sku,
  name_th,
  brand_name,
  category_slug,
  qty_available,
  reorder_point,
  (reorder_point - qty_available) as shortage
from v_stock_summary
where reorder_point > 0 and qty_available < reorder_point
order by (reorder_point - qty_available) desc;

-- 2. Sales by day (last 30 days)
create or replace view v_sales_by_day as
select
  date_trunc('day', sold_at)::date as day,
  count(*) as orders,
  sum(subtotal) as revenue,
  sum(vat_amount) as vat
from sales_orders
where sold_at >= current_date - interval '30 days'
group by 1
order by 1;

-- 3. Top products sold (last 30 days)
create or replace view v_top_products_sold as
select
  p.id as product_id,
  p.sku,
  p.name_th,
  sum(soi.qty) as qty_sold,
  sum(soi.qty * soi.unit_price) as revenue
from sales_order_items soi
join products p on p.id = soi.product_id
join sales_orders so on so.id = soi.sales_order_id
where so.sold_at >= current_date - interval '30 days'
group by p.id, p.sku, p.name_th
order by revenue desc
limit 20;

-- 4. Repair revenue (last 30 days)
create or replace view v_repair_revenue as
select
  date_trunc('day', closed_at)::date as day,
  count(*) as jobs,
  sum(parts_total) as parts_revenue,
  sum(labor_fee) as labor_revenue,
  sum(grand_total) as total,
  sum(gross_profit) as profit
from repair_jobs
where status in ('done','delivered')
  and closed_at >= current_date - interval '30 days'
group by 1
order by 1;

-- 5. Technician commission (current month)
create or replace view v_tech_commission as
select
  pr.id as technician_id,
  pr.full_name,
  count(ce.id) as jobs,
  sum(ce.amount) as commission,
  bool_or(ce.is_paid) as any_paid
from commission_entries ce
join profiles pr on pr.id = ce.technician_id
where ce.period_month = date_trunc('month', current_date)::date
group by pr.id, pr.full_name
order by commission desc;

-- 6. Warranty expiry upcoming (next 30 days, not yet expired)
create or replace view v_warranty_expiry as
select
  w.id,
  w.customer_id,
  c.name as customer_name,
  w.device_imei,
  w.product_id,
  p.name_th as product_name,
  w.start_date,
  w.end_date,
  (w.end_date - current_date) as days_left
from warranties w
left join customers c on c.id = w.customer_id
left join products p on p.id = w.product_id
where w.end_date >= current_date
  and w.end_date <= current_date + interval '30 days'
order by w.end_date;

-- 7. Aging stock: lots with qty_remaining > 0, oldest first
create or replace view v_aging_stock as
select
  il.id as lot_id,
  il.lot_no,
  p.name_th as product_name,
  p.sku,
  il.qty_remaining,
  il.landed_unit_cost,
  (il.qty_remaining * il.landed_unit_cost) as lot_value,
  il.received_at,
  (current_date - il.received_at::date) as age_days
from inventory_lots il
join products p on p.id = il.product_id
where il.qty_remaining > 0
order by il.received_at;

-- 8. Stock value by brand
create or replace view v_stock_value_by_brand as
select
  coalesce(brand_name, '(no brand)') as brand,
  count(*) as products,
  sum(stock_value) as total_value,
  sum(qty_available) as total_qty
from v_stock_summary
group by brand_name
order by total_value desc;

-- 9. Today snapshot KPIs (single-row)
create or replace view v_dashboard_kpis as
select
  (select sum(stock_value) from v_stock_summary) as total_stock_value,
  (select sum(qty_available) from v_stock_summary) as total_qty_available,
  (select count(*) from v_low_stock) as low_stock_count,
  (select count(*) from repair_jobs where status not in ('done','delivered')) as open_jobs,
  (select count(*) from v_warranty_expiry where days_left <= 7) as warranty_expiring_soon,
  (select sum(grand_total) from repair_jobs where closed_at::date = current_date) as today_repair_revenue,
  (select sum(amount) from commission_entries where period_month = date_trunc('month', current_date)::date and not is_paid) as unpaid_commission;