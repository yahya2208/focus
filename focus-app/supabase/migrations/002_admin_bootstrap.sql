-- FOCUS v2.0 — Admin Bootstrap Migration
-- Run after 001_initial_schema.sql

-- Function to check if any super_admin exists
CREATE OR REPLACE FUNCTION public.has_super_admin()
RETURNS boolean AS $$
  SELECT exists (SELECT 1 FROM public.users WHERE role = 'super_admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to set a user as super_admin (only if no super_admin exists)
CREATE OR REPLACE FUNCTION public.bootstrap_super_admin(target_user_id uuid)
RETURNS void AS $$
BEGIN
  IF public.has_super_admin() THEN
    RAISE EXCEPTION 'A super admin already exists.';
  END IF;
  UPDATE public.users SET role = 'super_admin', updated_at = now() WHERE id = target_user_id;
  IF NOT found THEN RAISE EXCEPTION 'User not found.'; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin role management: promote a user
CREATE OR REPLACE FUNCTION public.admin_promote_user(target_user_id uuid, new_role text)
RETURNS void AS $$
BEGIN
  IF NOT public.has_super_admin() THEN
    RAISE EXCEPTION 'No super admin exists.';
  END IF;
  IF new_role NOT IN ('guest', 'user', 'researcher', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;
  UPDATE public.users SET role = new_role, updated_at = now() WHERE id = target_user_id;
  IF NOT found THEN RAISE EXCEPTION 'User not found.'; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create public.users row on Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, role, is_anonymous)
  VALUES (
    NEW.id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data ->> 'display_name', ''),
    coalesce(NEW.raw_user_meta_data ->> 'role', 'guest'),
    coalesce((NEW.raw_user_meta_data ->> 'is_anonymous')::boolean, true)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create auth signup trigger (drop first to avoid duplicate errors)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Drop and recreate all new policies to avoid conflicts
DO $$ BEGIN
  DROP POLICY IF EXISTS "Bootstrap check super_admin" ON public.users;
  DROP POLICY IF EXISTS "Bootstrap insert first user" ON public.users;
  DROP POLICY IF EXISTS "Admins promote users" ON public.users;
  DROP POLICY IF EXISTS "Admins manage all sessions" ON public.sessions;
  DROP POLICY IF EXISTS "Researchers read all sessions" ON public.sessions;
  DROP POLICY IF EXISTS "Admins read all devices" ON public.devices;
  DROP POLICY IF EXISTS "Admins read all calibrations" ON public.calibrations;
  DROP POLICY IF EXISTS "Admins read all surveys" ON public.surveys;
  DROP POLICY IF EXISTS "Researchers read all surveys" ON public.surveys;
END $$;

-- Users: allow reading super_admin rows (for bootstrap check)
CREATE POLICY "Bootstrap check super_admin" ON public.users
  FOR SELECT USING (role = 'super_admin');

-- Users: allow insert when no super_admin exists (bootstrap)
CREATE POLICY "Bootstrap insert first user" ON public.users
  FOR INSERT WITH CHECK (public.has_super_admin() = false);

-- Users: admins can update roles
CREATE POLICY "Admins promote users" ON public.users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Sessions: admins manage all
CREATE POLICY "Admins manage all sessions" ON public.sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Sessions: researchers read all
CREATE POLICY "Researchers read all sessions" ON public.sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'researcher')
  );

-- Devices: admins read all
CREATE POLICY "Admins read all devices" ON public.devices
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Calibrations: admins read all
CREATE POLICY "Admins read all calibrations" ON public.calibrations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Surveys: admins read all
CREATE POLICY "Admins read all surveys" ON public.surveys
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Surveys: researchers read all
CREATE POLICY "Researchers read all surveys" ON public.surveys
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'researcher')
  );
