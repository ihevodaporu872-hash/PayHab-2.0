-- Миграция v3: Склады, обновление заявок-материалов

-- 1. Таблица складов
create table if not exists warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

alter table warehouses enable row level security;
create policy "service_role_all" on warehouses for all using (true);

-- 2. Новые поля в material_requests
alter table material_requests
  add column if not exists warehouse_id uuid references warehouses(id),
  add column if not exists order_date_from date,
  add column if not exists order_date_to date;

-- 3. Обновить constraint request_type (убрать over_estimate)
alter table material_requests drop constraint if exists material_requests_request_type_check;
alter table material_requests add constraint material_requests_request_type_check
  check (request_type in ('by_estimate', 'urgent', 'by_specification'));

-- 4. Обновить столбцы material_request_items
alter table material_request_items
  add column if not exists manufacturer text,
  add column if not exists manager text,
  add column if not exists quantity numeric(15,4);

-- Удалить старые столбцы (если нужно сохранить данные — закомментировать)
alter table material_request_items
  drop column if exists volume,
  drop column if exists consumption_rate,
  drop column if exists total_consumption,
  drop column if exists price,
  drop column if exists cost,
  drop column if exists new_volume,
  drop column if exists new_consumption_rate,
  drop column if exists new_total_consumption,
  drop column if exists new_price,
  drop column if exists new_cost;
