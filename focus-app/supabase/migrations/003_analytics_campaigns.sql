-- FOCUS v2.0 — Analytics Events & Campaigns
-- Adds event tracking and QR campaign management

-- Analytics Events table (append-only event log)
create table if not exists public.analytics_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  session_id uuid references public.sessions(id) on delete set null,
  event_type text not null,
  event_data jsonb not null default '{}',
  device_id text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Campaigns table (QR campaigns)
create table if not exists public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  source text,
  location text,
  school text,
  company text,
  event text,
  language text,
  version text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- QR Codes table (individual QR codes linked to campaigns)
create table if not exists public.qr_codes (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.campaigns(id) on delete set null,
  code text unique not null,
  referral_code text,
  url text not null,
  scan_count integer not null default 0,
  game_start_count integer not null default 0,
  game_complete_count integer not null default 0,
  registration_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for analytics_events
create index if not exists idx_analytics_events_user_id on public.analytics_events(user_id);
create index if not exists idx_analytics_events_session_id on public.analytics_events(session_id);
create index if not exists idx_analytics_events_event_type on public.analytics_events(event_type);
create index if not exists idx_analytics_events_created_at on public.analytics_events(created_at desc);
create index if not exists idx_analytics_events_user_type on public.analytics_events(user_id, event_type);

-- Indexes for campaigns
create index if not exists idx_campaigns_is_active on public.campaigns(is_active);
create index if not exists idx_qr_codes_campaign_id on public.qr_codes(campaign_id);
create index if not exists idx_qr_codes_code on public.qr_codes(code);
create index if not exists idx_qr_codes_referral_code on public.qr_codes(referral_code);

-- Updated_at triggers
create trigger campaigns_updated_at before update on public.campaigns
  for each row execute function update_updated_at();

create trigger qr_codes_updated_at before update on public.qr_codes
  for each row execute function update_updated_at();

-- RLS
alter table public.analytics_events enable row level security;
alter table public.campaigns enable row level security;
alter table public.qr_codes enable row level security;

-- Analytics events: anyone can insert (for anonymous tracking), admins/researchers can read all
create policy "Anyone can insert analytics events" on public.analytics_events
  for insert with check (true);

create policy "Admins read all analytics events" on public.analytics_events
  for select using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'super_admin', 'researcher')
    )
  );

-- Campaigns: admins can manage, anyone can read active ones
create policy "Anyone can read active campaigns" on public.campaigns
  for select using (is_active = true);

create policy "Admins manage campaigns" on public.campaigns
  for all using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

-- QR codes: admins can manage, anyone can read active ones, anyone can update scan counts
create policy "Anyone can read active qr codes" on public.qr_codes
  for select using (is_active = true);

create policy "Admins manage qr codes" on public.qr_codes
  for all using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

create policy "Anyone can update qr scan counts" on public.qr_codes
  for update using (true) with check (true);
