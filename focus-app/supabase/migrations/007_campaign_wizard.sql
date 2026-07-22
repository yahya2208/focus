-- FOCUS v2.0 — Campaign Wizard fields
-- Adds location_type and description for the campaign creation wizard

alter table public.campaigns add column if not exists location_type text;
alter table public.campaigns add column if not exists description text;
alter table public.campaigns add column if not exists country text;
alter table public.campaigns add column if not exists state_name text;
alter table public.campaigns add column if not exists city text;
alter table public.campaigns add column if not exists district text;
