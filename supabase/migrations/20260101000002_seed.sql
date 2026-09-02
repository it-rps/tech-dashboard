-- iRepair Stock & Service System — seed data
-- Master data: categories, device_models (iPhone X–17), brands, suppliers, customers, app_settings

-- App settings single row
insert into app_settings (id) values (1);

-- Categories
insert into categories (slug, name_th, name_en, sort_order) values
  ('battery',  'แบตเตอรี่', 'Battery',  1),
  ('tagon',    'แท็กออน',  'TagOn',    2),
  ('adhesive', 'ซีลิกอน',  'Adhesive', 3),
  ('seal',     'ซีลน้ำ',   'Seal',     4),
  ('screen',   'หน้าจอ',    'Screen',   5),
  ('other',    'อื่นๆ',    'Other',    6);

-- Device models: iPhone X–17 + iPad + MacBook
insert into device_models (device_type, name, series, release_year, sort_order) values
  ('iphone', 'iPhone X',   'X series',     2017, 10),
  ('iphone', 'iPhone 11',  '11 series',    2019, 11),
  ('iphone', 'iPhone 12',  '12 series',    2020, 12),
  ('iphone', 'iPhone 13',  '13 series',    2021, 13),
  ('iphone', 'iPhone 14',  '14 series',    2022, 14),
  ('iphone', 'iPhone 15',  '15 series',    2023, 15),
  ('iphone', 'iPhone 16',  '16 series',    2024, 16),
  ('iphone', 'iPhone 17',  '17 series',    2025, 17),
  ('ipad',   'iPad',       'Standard',     2018, 20),
  ('ipad',   'iPad Air',   'Air series',   2019, 21),
  ('macbook', 'MacBook Air', 'Air series', 2020, 30),
  ('macbook', 'MacBook Pro', 'Pro series', 2016, 31);

-- Brands
insert into brands (name, note) values
  ('Apple',        'Original Apple parts'),
  ('SV Telecom',   'Thai supplier — phone / parts'),
  ('PJ Soft',      'Thai supplier — accessories'),
  ('ITM',          'Dealer partner — internal customer');

-- Suppliers (matching SKILL.md: SV Telecom, PJ Soft, ITM as customer)
insert into suppliers (code, name, shop_name, phone, lead_time_days, rating, note) values
  ('SV', 'SV Telecom', 'SV Telecom', '02-1234-5678', 1, 5, 'Main phone/parts supplier'),
  ('PJ', 'PJ Soft',    'PJ Soft',    '02-8765-4321', 2, 4, 'Accessories & adhesives');

-- Customers
insert into customers (code, name, kind, commission_eligible, phone) values
  ('ITM', 'ITM', 'dealer',   true,  '06-1234-5678'),
  ('WAL', 'ลูกค้าปกติ', 'walkin',   true,  '09-9999-9999'),
  ('INT', 'Internal Stock', 'internal', false, '02-0000-0000');

-- Default profile for bootstrap (first user becomes owner)
-- This runs through auth.users; profiles are auto-created by the trigger
