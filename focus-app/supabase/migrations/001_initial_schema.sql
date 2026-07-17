-- FOCUS v2.0 — Initial Database Schema
-- Run: supabase db push or apply via Supabase Dashboard

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique,
  display_name text,
  role text not null default 'guest' check (role in ('guest', 'user', 'researcher', 'admin', 'super_admin')),
  avatar_url text,
  is_anonymous boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

-- Devices table (separated from cognitive data)
create table if not exists public.devices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  browser text not null,
  browser_version text not null,
  os text not null,
  os_version text not null,
  platform text not null,
  screen_width integer not null,
  screen_height integer not null,
  pixel_ratio real not null default 1,
  refresh_rate integer not null default 60,
  touch_support boolean not null default false,
  pointer_type text not null default 'unknown',
  cpu_cores integer not null default 0,
  memory_gb real,
  language text not null,
  timezone text not null,
  user_agent text not null,
  collected_at timestamptz not null default now()
);

-- Calibrations table
create table if not exists public.calibrations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  refresh_rate integer not null,
  display_lag_ms real not null,
  input_lag_ms real not null,
  confidence real not null default 0.5,
  platform text not null,
  browser_name text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- Sessions table
create table if not exists public.sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  calibration_id uuid not null references public.calibrations(id) on delete cascade,
  plugin_id text not null,
  status text not null default 'draft' check (status in ('draft', 'running', 'paused', 'completed', 'archived', 'synced', 'failed')),
  measurements jsonb,
  scientific_results jsonb,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz,
  version text not null default '0.1.0-alpha'
);

-- Surveys table
create table if not exists public.surveys (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  age_range text,
  gender text,
  country text,
  state text,
  education text,
  occupation text,
  sleep_hours real,
  coffee_per_day integer,
  exercise_frequency text,
  dominant_hand text,
  gaming_frequency text,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_sessions_user_id on public.sessions(user_id);
create index if not exists idx_sessions_status on public.sessions(status);
create index if not exists idx_sessions_created_at on public.sessions(created_at desc);
create index if not exists idx_devices_user_id on public.devices(user_id);
create index if not exists idx_calibrations_user_id on public.calibrations(user_id);
create index if not exists idx_surveys_user_id on public.surveys(user_id);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at before update on public.users
  for each row execute function update_updated_at();

create trigger sessions_updated_at before update on public.sessions
  for each row execute function update_updated_at();

-- Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.devices enable row level security;
alter table public.calibrations enable row level security;
alter table public.sessions enable row level security;
alter table public.surveys enable row level security;

-- Users: can read own profile, admins can read all
create policy "Users read own profile" on public.users
  for select using (auth.uid() = id);

create policy "Admins read all users" on public.users
  for select using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

-- Sessions: users can CRUD own sessions
create policy "Users manage own sessions" on public.sessions
  for all using (auth.uid() = user_id);

create policy "Admins read all sessions" on public.sessions
  for select using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'super_admin', 'researcher')
    )
  );

-- Devices: users can CRUD own devices
create policy "Users manage own devices" on public.devices
  for all using (auth.uid() = user_id);

-- Calibrations: users can CRUD own calibrations
create policy "Users manage own calibrations" on public.calibrations
  for all using (auth.uid() = user_id);

-- Surveys: users can CRUD own surveys
create policy "Users manage own surveys" on public.surveys
  for all using (auth.uid() = user_id);
