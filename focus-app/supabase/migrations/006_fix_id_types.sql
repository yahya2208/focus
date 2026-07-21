-- FOCUS v2.0 — Fix sessions.id type: uuid → text
-- The app now generates valid UUIDs via crypto.randomUUID(),
-- but sessions.id column was uuid which rejected older string IDs.
-- Changing to text allows both old and new ID formats.

-- Drop foreign key from analytics_events → sessions before type change
ALTER TABLE public.analytics_events
  DROP CONSTRAINT IF EXISTS analytics_events_session_id_fkey;

-- Change sessions.id from uuid to text
ALTER TABLE public.sessions ALTER COLUMN id TYPE text;

-- Change analytics_events.session_id from uuid to text
ALTER TABLE public.analytics_events ALTER COLUMN session_id TYPE text;

-- Re-add foreign key (both columns now text)
ALTER TABLE public.analytics_events
  ADD CONSTRAINT analytics_events_session_id_fkey
  FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;
