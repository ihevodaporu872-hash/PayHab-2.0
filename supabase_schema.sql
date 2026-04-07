-- Выполнить в Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Отделы
create table departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references departments(id),
  created_at timestamptz default now()
);

-- Должности
create table positions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Сотрудники
create table employees (
  id uuid primary key default gen_random_uuid(),
  last_name text not null,
  first_name text not null,
  middle_name text,
  department_id uuid references departments(id),
  position_id uuid references positions(id),
  tab_number text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Карты доступа
create table cards (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  card_number text not null unique,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Пользователи системы (для JWT-авторизации)
create table users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz default now()
);

-- RLS (Row Level Security) — отключён, доступ через service_role key
alter table departments enable row level security;
alter table positions enable row level security;
alter table employees enable row level security;
alter table cards enable row level security;
alter table users enable row level security;

-- Политики: полный доступ для service_role
create policy "service_role_all" on departments for all using (true);
create policy "service_role_all" on positions for all using (true);
create policy "service_role_all" on employees for all using (true);
create policy "service_role_all" on cards for all using (true);
create policy "service_role_all" on users for all using (true);
