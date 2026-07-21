-- FOCUS v2.0 — Foundation Recovery Migration
-- Makes sessions device_id and calibration_id optional
-- so sessions can be saved without requiring prior device/calibration records

-- Make device_id and calibration_id nullable in sessions
ALTER TABLE public.sessions ALTER COLUMN device_id DROP NOT NULL;
ALTER TABLE public.sessions ALTER COLUMN calibration_id DROP NOT NULL;

-- Drop foreign key constraints so we can use string IDs or NULL
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_device_id_fkey;
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_calibration_id_fkey;

-- Add back as optional foreign keys
ALTER TABLE public.sessions ADD CONSTRAINT sessions_device_id_fkey
  FOREIGN KEY (device_id) REFERENCES public.devices(id) ON DELETE SET NULL;

ALTER TABLE public.sessions ADD CONSTRAINT sessions_calibration_id_fkey
  FOREIGN KEY (calibration_id) REFERENCES public.calibrations(id) ON DELETE SET NULL;

-- Allow anonymous users to insert sessions (for unauthenticated guests)
-- The existing policy requires auth.uid() = user_id, but anonymous users
-- may not have a public.users row yet. Add a policy for anonymous inserts.
DROP POLICY IF EXISTS "Anonymous insert sessions" ON public.sessions;
CREATE POLICY "Anonymous insert sessions" ON public.sessions
  FOR INSERT WITH CHECK (true);

-- Allow anonymous event tracking inserts  
DROP POLICY IF EXISTS "Anonymous insert analytics" ON public.analytics_events;
CREATE POLICY "Anonymous insert analytics" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

-- Allow anonymous device inserts
DROP POLICY IF EXISTS "Anonymous insert devices" ON public.devices;
CREATE POLICY "Anonymous insert devices" ON public.devices
  FOR INSERT WITH CHECK (true);

-- Allow anonymous calibration inserts
DROP POLICY IF EXISTS "Anonymous insert calibrations" ON public.calibrations;
CREATE POLICY "Anonymous insert calibrations" ON public.calibrations
  FOR INSERT WITH CHECK (true);

-- Allow reading own sessions by user_id (for any authenticated user)
DROP POLICY IF EXISTS "Users manage own sessions" ON public.sessions;
CREATE POLICY "Users manage own sessions" ON public.sessions
  FOR ALL USING (
    auth.uid() = user_id 
    OR user_id IS NULL
  );

-- Add referral_code to users for the referral engine
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_code text unique;

-- Allow unauthenticated users to read users (for referral code lookup)
DROP POLICY IF EXISTS "Public read users" ON public.users;
CREATE POLICY "Public read users" ON public.users
  FOR SELECT USING (true);
