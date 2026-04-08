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

-- 3. Добавить новые столбцы для material_request_items (материалы)
alter table material_request_items
  add column if not exists manufacturer text,
  add column if not exists manager text,
  add column if not exists quantity numeric(15,4);
