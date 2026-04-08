-- Выполнить в Supabase SQL Editor ПОСЛЕ supabase_schema.sql

-- Добавить full_name в users
alter table users add column if not exists full_name text;

-- Проекты
create table projects (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text not null,
  related_names text,
  description text,
  status text default 'active',
  created_at timestamptz default now()
);

-- Разделы смет (привязаны к проекту)
create table estimate_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- Склады
create table warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Виды затрат
create table cost_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text default 'active',
  created_at timestamptz default now()
);

-- Счётчик номеров заявок
create sequence if not exists material_request_number_seq start 1;

-- Заявки на материалы
create table material_requests (
  id uuid primary key default gen_random_uuid(),
  request_number int not null default nextval('material_request_number_seq'),
  created_at timestamptz default now(),
  sent_at timestamptz,
  project_id uuid references projects(id),
  module text not null default 'object' check (module in ('object', 'material')),
  request_type text not null check (request_type in ('by_estimate', 'urgent', 'by_specification')),
  estimate_section_id uuid references estimate_sections(id),
  manual_estimate_section text,
  cost_type_id uuid references cost_types(id),
  warehouse_id uuid references warehouses(id),
  order_date_from date,
  order_date_to date,
  justification text,
  status text default 'draft',
  created_by uuid references users(id),
  updated_at timestamptz default now()
);

-- Позиции заявки
create table material_request_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references material_requests(id) on delete cascade,
  sort_order int not null default 0,
  material text,
  manufacturer text,
  manager text,
  unit text,
  quantity numeric(15,4),
  created_at timestamptz default now()
);

-- Комментарии к заявке
create table material_request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references material_requests(id) on delete cascade,
  user_id uuid references users(id),
  username text,
  addressed_to uuid references users(id),
  addressed_to_name text,
  text text not null,
  created_at timestamptz default now()
);

-- Файлы заявки (хранятся в Supabase Storage, bucket: material-request-files)
create table material_request_files (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references material_requests(id) on delete cascade,
  filename text not null,
  storage_path text not null,
  content_type text,
  size_bytes bigint,
  annotations jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- Этапы согласования заявки
create table approval_stages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references material_requests(id) on delete cascade,
  stage_order int not null default 0,
  stage_name text not null,
  approver_id uuid references users(id),
  approver_name text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'approved', 'rejected', 'returned')),
  comment text,
  decided_at timestamptz,
  created_at timestamptz default now()
);

-- RLS
alter table projects enable row level security;
alter table estimate_sections enable row level security;
alter table cost_types enable row level security;
alter table warehouses enable row level security;
alter table material_requests enable row level security;
alter table material_request_items enable row level security;
alter table material_request_comments enable row level security;
alter table material_request_files enable row level security;
alter table approval_stages enable row level security;

create policy "service_role_all" on projects for all using (true);
create policy "service_role_all" on estimate_sections for all using (true);
create policy "service_role_all" on cost_types for all using (true);
create policy "service_role_all" on warehouses for all using (true);
create policy "service_role_all" on material_requests for all using (true);
create policy "service_role_all" on material_request_items for all using (true);
create policy "service_role_all" on material_request_comments for all using (true);
create policy "service_role_all" on material_request_files for all using (true);
create policy "service_role_all" on approval_stages for all using (true);
