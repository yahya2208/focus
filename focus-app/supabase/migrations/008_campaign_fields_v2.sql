-- Migration 008: Campaign Manager v2 fields
-- Adds: goal, budget, venue, short_code, campaign_type, status, dates, logo, notes, qr_config, timeline, attachments, material, created_by

-- campaigns table additions
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS short_code text;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS goal text;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS budget numeric;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS budget_currency text DEFAULT 'USD';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS venue text;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS campaign_type text;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS start_date timestamptz;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS end_date timestamptz;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS material text;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS qr_config jsonb;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS timeline jsonb DEFAULT '[]'::jsonb;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS created_by text;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS last_edited_by text;

-- qr_codes table additions
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;

-- Unique index on short_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaigns_short_code ON campaigns(short_code) WHERE short_code IS NOT NULL;
