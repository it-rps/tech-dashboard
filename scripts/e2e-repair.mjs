#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Missing env vars');
const supabase = createClient(url, key);
async function main() {
  console.log('=== E2E Repair Flow ===');
  // 1) pick product + lot with stock
  const { data: lotsRaw } = await supabase
    .from('inventory_lots')
    .select('id, lot_no, qty_remaining, landed_unit_cost, product_id')
    .gt('qty_remaining', 0)
    .order('created_at')
    .limit(1);
  const lot = lotsRaw[0];
  if (!lot) throw new Error('no stock available');
  const { data: product } = await supabase.from('products').select('id, name_th, sku, track_serial, warranty_days').eq('id', lot.product_id).single();
  console.log('product:', product.name_th, 'sku:', product.sku, 'lot:', lot.lot_no, 'qty:', lot.qty_remaining, 'cost:', lot.landed_unit_cost);
  // 2) customer (dealer with commission_eligible=true)
  const { data: customers } = await supabase.from('customers').select('id, name, kind, default_price_tier, commission_eligible').eq('is_active', true).limit(3);
  const cust = customers.find(c => c.kind === 'dealer') || customers[0];
  if (!cust) throw new Error('no customer');
  console.log('customer:', cust.name, 'kind:', cust.kind, 'tier:', cust.default_price_tier);
  // 3) device model
  const { data: dm } = await supabase.from('device_models').select('id, name').eq('is_active', true).limit(1);
  const model = dm[0];
  console.log('model:', model?.name ?? 'none');
  // 4) technician
  const { data: techs } = await supabase.from('profiles').select('id, full_name').in('role', ['owner','manager','technician']).eq('is_active', true).limit(1);
  const tech = techs[0];
  console.log('technician:', tech?.full_name ?? 'none');
  // 5) create job
  const imei = '359' + Date.now().toString().slice(-12);
  const { data: job, error: jErr } = await supabase.from('repair_jobs').insert({
    customer_id: cust.id,
    job_kind: cust.kind,
    device_model_id: model?.id ?? null,
    device_imei: imei,
    symptom: 'Battery drain',
    diagnosis: 'Swollen battery',
    technician_id: tech?.id ?? null,
    tax_mode: 'none',
    vat_rate: 7,
    created_by: tech?.id ?? null,
  }).select('id, doc_no, status, job_kind').single();
  if (jErr) throw jErr;
  console.log('job created:', job.doc_no, 'status:', job.status, 'kind:', job.job_kind);
  // 6) add item + reserve
  const { error: iErr } = await supabase.from('repair_job_items').insert({
    repair_job_id: job.id, product_id: product.id, qty: 1, unit_price: 1500.00, is_optional: false,
  });
  if (iErr) throw iErr;
  const { error: rErr } = await supabase.rpc('reserve_stock', { p_product_id: product.id, p_qty: 1 });
  if (rErr) throw rErr;
  console.log('reserved 1x', product.name_th);
  // 7) verify reservation on lot
  const { data: lotRsv } = await supabase.from('inventory_lots').select('qty_remaining, qty_reserved').eq('id', lot.id).single();
  console.log('lot after reserve: remaining', lotRsv.qty_remaining, 'reserved', lotRsv.qty_reserved);
  // 8) close job (FIFO + warranty + commission)
  const { error: cErr } = await supabase.rpc('close_repair_job', { p_job_id: job.id, p_labor_fee: 500, p_discount: 0, p_actor_id: tech?.id ?? null });
  if (cErr) throw cErr;
  console.log('job closed');
  // 9) verify job
  const { data: closed } = await supabase.from('repair_jobs').select('status, labor_fee, parts_total, parts_cost_total, grand_total, gross_profit, closed_at').eq('id', job.id).single();
  console.log('status:', closed.status);
  console.log('labor:', closed.labor_fee, 'parts(price):', closed.parts_total, 'parts(cost):', closed.parts_cost_total, 'total:', closed.grand_total, 'profit:', closed.gross_profit);
  // 10) verify stock movement
  const { data: movs } = await supabase.from('stock_movements').select('movement_type, qty, unit_cost, reference_table').eq('reference_table', 'repair_jobs').eq('reference_id', job.id);
  console.log('stock movements:', movs.length);
  movs.forEach(m => console.log(' ', m.movement_type, 'qty:', m.qty, 'cost:', m.unit_cost, 'ref:', m.reference_table));
  // 11) verify warranty
  const { data: warr } = await supabase.from('warranties').select('id, product_id, customer_id, device_imei, start_date, end_date, days').eq('source_table', 'repair_jobs').eq('source_id', job.id);
  console.log('warranty:', warr.length ? `${warr[0].days} days until ${warr[0].end_date}` : 'NONE');
  // 12) verify commission
  const { data: comm } = await supabase.from('commission_entries').select('id, technician_id, qty, rate, amount, is_paid').eq('repair_job_id', job.id);
  console.log('commission:', comm.length ? `qty:${comm[0].qty} rate:${comm[0].rate} amount:${comm[0].amount} paid:${comm[0].is_paid}` : 'NONE');
  // 13) deliver
  const { error: dErr } = await supabase.from('repair_jobs').update({ status: 'delivered', delivered_at: new Date().toISOString() }).eq('id', job.id).eq('status', 'done');
  if (dErr) throw dErr;
  const { data: final } = await supabase.from('repair_jobs').select('status, delivered_at').eq('id', job.id).single();
  console.log('final:', final.status, 'delivered_at:', final.delivered_at);
  console.log('\n=== ALL PASSED ===');
  console.log(`${job.doc_no} | ${cust.name} | ${product.name_th} | total ${closed.grand_total} | profit ${closed.gross_profit} | commission ${comm[0]?.amount ?? 0} | warranty ${warr[0]?.days ?? 0}d`);
}
main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
