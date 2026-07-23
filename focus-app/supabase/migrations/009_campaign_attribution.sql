-- 009_campaign_attribution.sql
-- Single Source of Truth: campaign.id (UUID) is the only campaign identifier.
-- short_code is ONLY used in external URLs.

-- ──────────────────────────────────────────────
-- 1. Add campaign_id to sessions table
-- ──────────────────────────────────────────────
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_campaign_id ON sessions(campaign_id);

-- ──────────────────────────────────────────────
-- 2. Add campaign_id to analytics_events table
-- ──────────────────────────────────────────────
ALTER TABLE analytics_events
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_events_campaign_id ON analytics_events(campaign_id);

-- ──────────────────────────────────────────────
-- 3. RPC: increment qr_codes counters atomically
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_qr_counter(
  p_campaign_id uuid,
  p_column text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_column = 'scan_count' THEN
    UPDATE qr_codes SET scan_count = scan_count + 1, updated_at = now() WHERE campaign_id = p_campaign_id;
  ELSIF p_column = 'game_start_count' THEN
    UPDATE qr_codes SET game_start_count = game_start_count + 1, updated_at = now() WHERE campaign_id = p_campaign_id;
  ELSIF p_column = 'game_complete_count' THEN
    UPDATE qr_codes SET game_complete_count = game_complete_count + 1, updated_at = now() WHERE campaign_id = p_campaign_id;
  ELSIF p_column = 'registration_count' THEN
    UPDATE qr_codes SET registration_count = registration_count + 1, updated_at = now() WHERE campaign_id = p_campaign_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_qr_counter(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION increment_qr_counter(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_qr_counter(uuid, text) TO service_role;

-- ──────────────────────────────────────────────
-- 4. Backfill: populate campaign_id on sessions from metadata
-- ──────────────────────────────────────────────
-- This handles any existing sessions that were saved with campaign_source in metadata.
-- We match by campaign short_code stored in metadata.campaign_source to campaigns.short_code.
UPDATE sessions s
SET campaign_id = c.id
FROM campaigns c
WHERE s.campaign_id IS NULL
  AND s.metadata->>'campaign_source' IS NOT NULL
  AND s.metadata->>'campaign_source' != ''
  AND c.short_code = s.metadata->>'campaign_source';

-- ──────────────────────────────────────────────
-- 5. Backfill: populate campaign_id on analytics_events from event_data
-- ──────────────────────────────────────────────
UPDATE analytics_events ae
SET campaign_id = c.id
FROM campaigns c
WHERE ae.campaign_id IS NULL
  AND ae.event_data->>'campaignId' IS NOT NULL
  AND ae.event_data->>'campaignId' != ''
  AND c.short_code = ae.event_data->>'campaignId';

UPDATE analytics_events ae
SET campaign_id = c.id
FROM campaigns c
WHERE ae.campaign_id IS NULL
  AND ae.event_data->>'campaign' IS NOT NULL
  AND ae.event_data->>'campaign' != ''
  AND c.short_code = ae.event_data->>'campaign';

-- ──────────────────────────────────────────────
-- 6. Backfill: populate qr_codes.scan_count from analytics_events
-- ──────────────────────────────────────────────
UPDATE qr_codes qr
SET scan_count = sub.cnt
FROM (
  SELECT campaign_id, COUNT(*)::int AS cnt
  FROM analytics_events
  WHERE event_type = 'qr_scanned'
    AND campaign_id IS NOT NULL
  GROUP BY campaign_id
) sub
WHERE qr.campaign_id = sub.campaign_id;

UPDATE qr_codes qr
SET game_complete_count = sub.cnt
FROM (
  SELECT campaign_id, COUNT(*)::int AS cnt
  FROM analytics_events
  WHERE event_type = 'game_completed'
    AND campaign_id IS NOT NULL
  GROUP BY campaign_id
) sub
WHERE qr.campaign_id = sub.campaign_id;

-- RLS for sessions and analytics_events is already configured in migration 005.
