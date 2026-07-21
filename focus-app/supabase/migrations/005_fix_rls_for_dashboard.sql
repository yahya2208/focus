-- FOCUS v2.0 — Fix RLS for Research Console
-- Idempotent: safe to run multiple times.
-- All DROP POLICY IF EXISTS use exact names from migrations 001-004 + this file.

-- ============================================================
-- 1. DROP ALL POLICIES from ALL tables (old + new names)
-- ============================================================

-- Users
DROP POLICY IF EXISTS "Users read own profile" ON public.users;
DROP POLICY IF EXISTS "Admins read all users" ON public.users;
DROP POLICY IF EXISTS "Public read users" ON public.users;
DROP POLICY IF EXISTS "Bootstrap check super_admin" ON public.users;
DROP POLICY IF EXISTS "Bootstrap insert first user" ON public.users;
DROP POLICY IF EXISTS "Admins promote users" ON public.users;
DROP POLICY IF EXISTS "Authenticated read users" ON public.users;
DROP POLICY IF EXISTS "Admins update user roles" ON public.users;

-- Sessions
DROP POLICY IF EXISTS "Users manage own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Admins read all sessions" ON public.sessions;
DROP POLICY IF EXISTS "Researchers read all sessions" ON public.sessions;
DROP POLICY IF EXISTS "Admins manage all sessions" ON public.sessions;
DROP POLICY IF EXISTS "Anonymous insert sessions" ON public.sessions;
DROP POLICY IF EXISTS "Authenticated insert sessions" ON public.sessions;
DROP POLICY IF EXISTS "Authenticated read sessions" ON public.sessions;

-- Devices
DROP POLICY IF EXISTS "Users manage own devices" ON public.devices;
DROP POLICY IF EXISTS "Admins read all devices" ON public.devices;
DROP POLICY IF EXISTS "Anonymous insert devices" ON public.devices;
DROP POLICY IF EXISTS "Authenticated insert devices" ON public.devices;
DROP POLICY IF EXISTS "Authenticated read devices" ON public.devices;

-- Calibrations
DROP POLICY IF EXISTS "Users manage own calibrations" ON public.calibrations;
DROP POLICY IF EXISTS "Admins read all calibrations" ON public.calibrations;
DROP POLICY IF EXISTS "Anonymous insert calibrations" ON public.calibrations;
DROP POLICY IF EXISTS "Authenticated insert calibrations" ON public.calibrations;
DROP POLICY IF EXISTS "Authenticated read calibrations" ON public.calibrations;

-- Surveys
DROP POLICY IF EXISTS "Users manage own surveys" ON public.surveys;
DROP POLICY IF EXISTS "Admins read all surveys" ON public.surveys;
DROP POLICY IF EXISTS "Researchers read all surveys" ON public.surveys;
DROP POLICY IF EXISTS "Authenticated insert surveys" ON public.surveys;
DROP POLICY IF EXISTS "Authenticated read surveys" ON public.surveys;

-- Analytics events
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Anonymous insert analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Admins read all analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Authenticated read analytics events" ON public.analytics_events;

-- Campaigns
DROP POLICY IF EXISTS "Anyone can read active campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins manage campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated read campaigns" ON public.campaigns;

-- QR codes
DROP POLICY IF EXISTS "Anyone can read active qr codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Admins manage qr codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Anyone can update qr scan counts" ON public.qr_codes;
DROP POLICY IF EXISTS "Authenticated read qr codes" ON public.qr_codes;

-- ============================================================
-- 2. RECREATE POLICIES — USERS
-- ============================================================

CREATE POLICY "Authenticated read users" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Bootstrap insert first user" ON public.users
  FOR INSERT WITH CHECK (public.has_super_admin() = false);

CREATE POLICY "Admins update user roles" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- 3. RECREATE POLICIES — SESSIONS
-- ============================================================

CREATE POLICY "Authenticated insert sessions" ON public.sessions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated read sessions" ON public.sessions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users manage own sessions" ON public.sessions
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- ============================================================
-- 4. RECREATE POLICIES — DEVICES
-- ============================================================

CREATE POLICY "Authenticated insert devices" ON public.devices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated read devices" ON public.devices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users manage own devices" ON public.devices
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 5. RECREATE POLICIES — CALIBRATIONS
-- ============================================================

CREATE POLICY "Authenticated insert calibrations" ON public.calibrations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated read calibrations" ON public.calibrations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users manage own calibrations" ON public.calibrations
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 6. RECREATE POLICIES — SURVEYS
-- ============================================================

CREATE POLICY "Authenticated insert surveys" ON public.surveys
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated read surveys" ON public.surveys
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users manage own surveys" ON public.surveys
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 7. RECREATE POLICIES — ANALYTICS EVENTS
-- ============================================================

CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated read analytics events" ON public.analytics_events
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- 8. RECREATE POLICIES — CAMPAIGNS
-- ============================================================

CREATE POLICY "Authenticated read campaigns" ON public.campaigns
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage campaigns" ON public.campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- 9. RECREATE POLICIES — QR CODES
-- ============================================================

CREATE POLICY "Authenticated read qr codes" ON public.qr_codes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can update qr scan counts" ON public.qr_codes
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Admins manage qr codes" ON public.qr_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
