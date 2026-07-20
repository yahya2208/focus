-- FOCUS v2.0 — Admin Bootstrap Migration
-- Run after 001_initial_schema.sql
-- This migration adds admin bootstrap support

-- Function to check if any super_admin exists
create or replace function public.has_super_admin()
returns boolean as $$
  select exists (
    select 1 from public.users where role = 'super_admin'
  );
$$ language sql security definer stable;

-- Function to set a user as super_admin (only if no super_admin exists)
create or replace function public.bootstrap_super_admin(target_user_id uuid)
returns void as $$
begin
  if public.has_super_admin() then
    raise exception 'A super admin already exists. Use the admin dashboard for role management.';
  end if;

  update public.users
  set role = 'super_admin', updated_at = now()
  where id = target_user_id;

  if not found then
    raise exception 'User not found.';
  end if;
end;
$$ language plpgsql security definer;

-- Admin role management: promote a user
create or replace function public.admin_promote_user(
  target_user_id uuid,
  new_role text
)
returns void as $$
begin
  if not public.has_super_admin() then
    raise exception 'No super admin exists. Bootstrap required first.';
  end if;

  if new_role not in ('guest', 'user', 'researcher', 'admin', 'super_admin') then
    raise exception 'Invalid role: %', new_role;
  end if;

  update public.users
  set role = new_role, updated_at = now()
  where id = target_user_id;

  if not found then
    raise exception 'User not found.';
  end if;
end;
$$ language plpgsql security definer;

-- Allow admin/super_admin to read all users
create policy "Admins promote users" on public.users
  for update using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

-- Allow admin/super_admin to read all sessions for management
create policy "Admins manage all sessions" on public.sessions
  for all using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

-- Allow researcher to read all sessions (read-only)
create policy "Researchers read all sessions" on public.sessions
  for select using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'researcher'
    )
  );

-- Allow admin/super_admin to read all devices
create policy "Admins read all devices" on public.devices
  for select using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

-- Allow admin/super_admin to read all calibrations
create policy "Admins read all calibrations" on public.calibrations
  for select using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

-- Allow admin/super_admin to read all surveys
create policy "Admins read all surveys" on public.surveys
  for select using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

-- Allow researcher to read all surveys
create policy "Researchers read all surveys" on public.surveys
  for select using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'researcher'
    )
  );
