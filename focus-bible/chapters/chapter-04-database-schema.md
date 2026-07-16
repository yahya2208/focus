# Chapter 04: Database Schema & Data Architecture

## Overview

This chapter defines every database table, column, constraint, index, function, trigger, and Row Level Security policy for the FOCUS platform. The database runs on PostgreSQL 15+ hosted on Supabase, leveraging PostgREST for auto-generated REST APIs, Row Level Security for authorization, Realtime for live subscriptions, and Edge Functions for complex server-side logic.

## Design Principles

1. **UUID Primary Keys**: All tables use `uuid` primary keys (via `gen_random_uuid()`) to prevent enumeration attacks and enable distributed ID generation without coordination.
2. **Temporal Columns**: Every table includes `created_at` and `updated_at` timestamps managed by database triggers.
3. **Soft Deletes**: Critical data uses `deleted_at` timestamp instead of `DELETE` to preserve referential integrity and enable recovery.
4. **Referential Integrity**: Foreign keys enforce relationships. `ON DELETE` behavior is explicit for every relationship.
5. **Row Level Security**: Every table has RLS enabled. No table is accessible without explicit policy.
6. **Audit Trail**: Sensitive tables include an audit log trigger that records before/after state.
7. **Immutable Game Data**: Game session data, once completed, is append-only. No updates or deletes permitted on completed session data.

---

## Enum Types

```sql
-- Game category taxonomy
CREATE TYPE game_category AS ENUM (
  'reaction',      -- Reaction time games (Reaction Light Test)
  'memory',        -- Working memory games (Memory Matrix, N-Back)
  'attention',     -- Sustained attention games (PVT variants)
  'executive',     -- Executive function games (Stroop, Flanker)
  'social'         -- Social/collaborative games (future)
);

-- Game session lifecycle
CREATE TYPE session_status AS ENUM (
  'created',       -- Session record created, not yet started
  'active',        -- Session in progress
  'completed',     -- Session finished normally
  'abandoned',     -- User left without completing
  'syncing',       -- Being synchronized to server
  'synced',        -- Successfully synchronized
  'conflict'       -- Sync conflict detected
);

-- Trial lifecycle within a session
CREATE TYPE trial_state AS ENUM (
  'pending',             -- Trial not yet started
  'stimulus_displayed',  -- Stimulus shown, awaiting response
  'response_window',     -- Response window open
  'evaluated',           -- Response evaluated
  'completed'            -- Trial fully processed
);

-- Achievement rarity tiers
CREATE TYPE achievement_rarity AS ENUM (
  'common',      -- Easy to earn, 50 XP reward
  'uncommon',    -- Moderate difficulty, 100 XP reward
  'rare',        -- Challenging, 250 XP reward
  'epic',        -- Very challenging, 500 XP reward
  'legendary'    -- Extremely rare, 1000 XP reward
);

-- Subscription lifecycle
CREATE TYPE subscription_status AS ENUM (
  'active',      -- Subscription is active and paid
  'trialing',    -- In free trial period
  'past_due',    -- Payment failed, grace period
  'canceled',    -- User canceled, active until period end
  'expired'      -- Subscription fully expired
);

-- Leaderboard categorization
CREATE TYPE leaderboard_type AS ENUM (
  'global_alltime',    -- All-time global rankings
  'global_weekly',     -- Current week global rankings
  'global_monthly',    -- Current month global rankings
  'regional',          -- By country/region
  'friends',           -- Among user's friends
  'group',             -- Within a study group
  'seasonal',          -- Within a competitive season
  'game_specific',     -- Per-game leaderboard
  'skill_based'        -- Matched by skill rating
);

-- Friend relationship status
CREATE TYPE friend_status AS ENUM (
  'pending',    -- Request sent, awaiting response
  'accepted',   -- Friends confirmed
  'blocked'     -- One user blocked the other
);

-- Sync status for offline support
CREATE TYPE sync_status AS ENUM (
  'pending',    -- Awaiting synchronization
  'synced',     -- Successfully synchronized
  'conflict',   -- Conflict detected during sync
  'failed'      -- Sync attempt failed
);

-- Notification types
CREATE TYPE notification_type AS ENUM (
  'achievement',    -- Achievement unlocked
  'challenge',      -- Challenge related
  'friend',         -- Friend activity
  'streak',         -- Streak milestone or at risk
  'mission',        -- Mission available or completed
  'system',         -- System announcements
  'level_up',       -- Level advancement
  'record'          -- Personal record broken
);

-- Difficulty adaptation reason
CREATE TYPE adaptation_reason AS ENUM (
  'performance_improving',  -- User performing well, increase difficulty
  'performance_declining',  -- User struggling, decrease difficulty
  'fatigue_detected',       -- User showing fatigue signs
  'time_of_day',           -- Time-based adjustment
  'calibration',           -- Initial calibration
  'manual'                 -- User-selected difficulty
);

-- Input methods for cross-device support
CREATE TYPE input_method AS ENUM (
  'touch',       -- Touch screen (mobile/tablet)
  'mouse',       -- Mouse click (desktop/web)
  'keyboard',    -- Keyboard key press (desktop/web)
  'gamepad',     -- Game controller
  'stylus'       -- Stylus/pen input
);

-- Subscription tier
CREATE TYPE subscription_tier AS ENUM (
  'free',        -- Free tier with limited access
  'pro',         -- Individual premium subscription
  'enterprise'   -- Organization/school subscription
);
```

---

## Core Tables

### Table: `users`

Extended user profile that references Supabase Auth's `auth.users`. This table stores application-specific user data that extends the authentication record.

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  display_name    TEXT NOT NULL,
  avatar_url      TEXT,
  date_of_birth   DATE,
  country_code    TEXT,
  timezone        TEXT NOT NULL DEFAULT 'UTC',
  language        TEXT NOT NULL DEFAULT 'en-US',
  tier            subscription_tier NOT NULL DEFAULT 'free',
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  is_banned       BOOLEAN NOT NULL DEFAULT FALSE,
  ban_reason      TEXT,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_users_username ON users (username) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_email ON users (email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_country ON users (country_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created ON users (created_at);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Public profiles are readable by anyone
CREATE POLICY "users_select_public" ON users
  FOR SELECT USING (deleted_at IS NULL AND is_banned = FALSE);

-- New user created via trigger from auth.users
CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

**Row count estimate**: Grows with user base. Expect 100K-1M rows at scale.

### Table: `user_profiles`

Public-facing profile data. Separated from `users` to control what data is publicly visible.

```sql
CREATE TABLE user_profiles (
  user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio               TEXT DEFAULT '',
  profile_frame     TEXT DEFAULT 'default',
  badge_showcase    UUID[] DEFAULT '{}',   -- Array of up to 5 achievement IDs
  total_xp          BIGINT NOT NULL DEFAULT 0,
  current_level     INTEGER NOT NULL DEFAULT 1,
  current_streak    INTEGER NOT NULL DEFAULT 0,
  longest_streak    INTEGER NOT NULL DEFAULT 0,
  total_sessions    INTEGER NOT NULL DEFAULT 0,
  total_play_time   BIGINT NOT NULL DEFAULT 0,  -- milliseconds
  last_active_at    TIMESTAMPTZ,
  is_online         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_level ON user_profiles (current_level DESC);
CREATE INDEX idx_profiles_xp ON user_profiles (total_xp DESC);
CREATE INDEX idx_profiles_streak ON user_profiles (current_streak DESC);
CREATE INDEX idx_profiles_active ON user_profiles (last_active_at DESC) WHERE last_active_at IS NOT NULL;

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_public" ON user_profiles
  FOR SELECT USING (TRUE);

CREATE POLICY "profiles_update_own" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Table: `user_settings`

Private application settings. Only accessible by the user.

```sql
CREATE TABLE user_settings (
  user_id                   UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  -- Sound settings
  sound_enabled             BOOLEAN NOT NULL DEFAULT TRUE,
  sound_volume              NUMERIC(3,2) NOT NULL DEFAULT 0.70,
  music_volume              NUMERIC(3,2) NOT NULL DEFAULT 0.30,
  haptic_enabled            BOOLEAN NOT NULL DEFAULT TRUE,
  haptic_intensity          TEXT NOT NULL DEFAULT 'medium' CHECK (haptic_intensity IN ('off', 'light', 'medium', 'strong')),
  -- Visual settings
  theme                     TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'high_contrast', 'system')),
  reduced_motion            BOOLEAN NOT NULL DEFAULT FALSE,
  font_size                 TEXT NOT NULL DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large', 'extra_large')),
  color_blind_mode          TEXT DEFAULT 'none' CHECK (color_blind_mode IN ('none', 'deuteranopia', 'protanopia', 'tritanopia')),
  -- Game settings
  default_session_length    INTEGER NOT NULL DEFAULT 30 CHECK (default_session_length BETWEEN 10 AND 60),
  show_timer                BOOLEAN NOT NULL DEFAULT TRUE,
  auto_start_next_trial     BOOLEAN NOT NULL DEFAULT TRUE,
  -- Notification settings
  notifications_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  daily_reminder            BOOLEAN NOT NULL DEFAULT TRUE,
  daily_reminder_time       TIME DEFAULT '09:00:00',
  -- Privacy settings
  profile_visibility        TEXT NOT NULL DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends_only', 'private')),
  activity_visibility       TEXT NOT NULL DEFAULT 'public' CHECK (activity_visibility IN ('public', 'friends_only', 'private')),
  leaderboard_opt_in        BOOLEAN NOT NULL DEFAULT TRUE,
  analytics_opt_in          BOOLEAN NOT NULL DEFAULT TRUE,
  -- Accessibility
  screen_reader_mode        BOOLEAN NOT NULL DEFAULT FALSE,
  high_contrast_focus       BOOLEAN NOT NULL DEFAULT FALSE,
  -- Sync
  sync_wifi_only            BOOLEAN NOT NULL DEFAULT FALSE,
  sync_frequency            TEXT NOT NULL DEFAULT 'auto' CHECK (sync_frequency IN ('auto', 'manual', 'wifi_only')),
  -- Timestamps
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_select_own" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "settings_update_own" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "settings_insert_own" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Table: `user_preferences`

UI/UX preferences for layout, language, and personalization.

```sql
CREATE TABLE user_preferences (
  user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  sidebar_collapsed   BOOLEAN NOT NULL DEFAULT FALSE,
  sidebar_position    TEXT NOT NULL DEFAULT 'left' CHECK (sidebar_position IN ('left', 'right')),
  show_onboarding     BOOLEAN NOT NULL DEFAULT TRUE,
  onboarding_step     INTEGER NOT NULL DEFAULT 0,
  selected_games      UUID[] DEFAULT '{}',   -- Pinned games for quick access
  dashboard_layout    JSONB DEFAULT '{}',     -- Custom dashboard widget layout
  game_sort_order     TEXT NOT NULL DEFAULT 'popular' CHECK (game_sort_order IN ('popular', 'recent', 'name', 'level')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "preferences_select_own" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "preferences_update_own" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "preferences_insert_own" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Table: `user_subscriptions`

Subscription management for monetization.

```sql
CREATE TABLE user_subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier                  subscription_tier NOT NULL DEFAULT 'free',
  status                subscription_status NOT NULL DEFAULT 'active',
  provider              TEXT NOT NULL DEFAULT 'internal' CHECK (provider IN ('internal', 'stripe', 'apple', 'google', 'revenuecat')),
  provider_subscription_id TEXT,
  provider_customer_id  TEXT,
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  trial_end             TIMESTAMPTZ,
  canceled_at           TIMESTAMPTZ,
  cancel_reason         TEXT,
  payment_method        JSONB,  -- Encrypted payment method info
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON user_subscriptions (user_id);
CREATE INDEX idx_subscriptions_status ON user_subscriptions (status) WHERE status IN ('active', 'trialing', 'past_due');
CREATE INDEX idx_subscriptions_provider ON user_subscriptions (provider_subscription_id) WHERE provider_subscription_id IS NOT NULL;

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_insert_own" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## Game System Tables

### Table: `games`

Registry of all available games in the platform. This is system-managed data, not user-editable.

```sql
CREATE TABLE games (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,        -- URL-friendly identifier
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  short_desc      TEXT NOT NULL,
  category        game_category NOT NULL,
  icon            TEXT NOT NULL,               -- Icon identifier
  thumbnail_url   TEXT,                        -- Preview image URL
  cover_url       TEXT,                        -- Full cover image URL
  version         TEXT NOT NULL DEFAULT '1.0.0',
  min_level       INTEGER NOT NULL DEFAULT 1,  -- Minimum level to unlock
  is_free         BOOLEAN NOT NULL DEFAULT TRUE, -- Free or premium
  is_active       BOOLEAN NOT NULL DEFAULT TRUE, -- Visible in game library
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  capabilities    TEXT[] NOT NULL DEFAULT '{}', -- ['reaction', 'attention', 'focus']
  config          JSONB NOT NULL DEFAULT '{}', -- Game-specific configuration
  metadata        JSONB NOT NULL DEFAULT '{}', -- Additional metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_games_category ON games (category) WHERE is_active = TRUE;
CREATE INDEX idx_games_sort ON games (sort_order) WHERE is_active = TRUE;
CREATE INDEX idx_games_slug ON games (slug);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Games are publicly readable
CREATE POLICY "games_select_public" ON games
  FOR SELECT USING (is_active = TRUE);

-- Only service role can modify games
CREATE POLICY "games_admin_only" ON games
  FOR ALL USING (FALSE);  -- Service role bypasses RLS
```

### Table: `game_categories`

Category taxonomy for organizing games.

```sql
CREATE TABLE game_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  icon        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#2563EB',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE game_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_public" ON game_categories
  FOR SELECT USING (TRUE);
```

### Table: `game_difficulty_levels`

Difficulty level definitions per game.

```sql
CREATE TABLE game_difficulty_levels (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  level           INTEGER NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  parameters      JSONB NOT NULL DEFAULT '{}',  -- Game-specific difficulty parameters
  min_score       NUMERIC(5,2),                 -- Minimum score to unlock this level
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, level)
);

CREATE INDEX idx_difficulty_game ON game_difficulty_levels (game_id);

ALTER TABLE game_difficulty_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "difficulty_select_public" ON game_difficulty_levels
  FOR SELECT USING (TRUE);
```

### Table: `game_configurations`

Runtime configuration for games. Used for A/B testing and feature flags.

```sql
CREATE TABLE game_configurations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id       UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  config_key    TEXT NOT NULL,
  config_value  JSONB NOT NULL,
  description   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, config_key)
);

ALTER TABLE game_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "config_select_public" ON game_configurations
  FOR SELECT USING (is_active = TRUE);
```

---

## Progression Tables

### Table: `user_xp`

XP transaction log. Every XP earning is recorded here for audit trail.

```sql
CREATE TABLE user_xp (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,
  source      TEXT NOT NULL,  -- 'session', 'mission', 'achievement', 'streak', 'social', 'daily_login'
  source_id   UUID,          -- Reference to the specific source (session_id, achievement_id, etc.)
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_xp_user ON user_xp (user_id);
CREATE INDEX idx_xp_created ON user_xp (created_at DESC);
CREATE INDEX idx_xp_source ON user_xp (source, source_id) WHERE source_id IS NOT NULL;

-- Partitioning by month for performance at scale
-- In production: CREATE TABLE user_xp (...) PARTITION BY RANGE (created_at);

ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "xp_select_own" ON user_xp
  FOR SELECT USING (auth.uid() = user_id);
```

### Table: `user_levels`

Level definitions. System-managed, immutable after creation.

```sql
CREATE TABLE user_levels (
  level             INTEGER PRIMARY KEY,
  xp_required       BIGINT NOT NULL,    -- Cumulative XP required for this level
  title             TEXT NOT NULL,      -- Display title (e.g., "Novice", "Adept")
  rewards           JSONB DEFAULT '{}', -- Rewards unlocked at this level
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pre-populated with all levels
-- Level formula: xp_required(level) = FLOOR(100 * POWER(level, 1.5))
-- Level 1: 100, Level 5: 1118, Level 10: 3162, Level 25: 12500, Level 50: 35355, Level 100: 100000

ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "levels_select_public" ON user_levels
  FOR SELECT USING (TRUE);
```

### Table: `achievements`

Achievement definitions. System-managed.

```sql
CREATE TABLE achievements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  category        TEXT NOT NULL,  -- 'mastery', 'consistency', 'social', 'exploration', 'dedication', 'milestone'
  rarity          achievement_rarity NOT NULL DEFAULT 'common',
  icon            TEXT NOT NULL,
  xp_reward       INTEGER NOT NULL DEFAULT 50,
  conditions      JSONB NOT NULL,  -- Unlock conditions as JSON
  is_hidden       BOOLEAN NOT NULL DEFAULT FALSE,  -- Secret achievements
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_achievements_category ON achievements (category);
CREATE INDEX idx_achievements_rarity ON achievements (rarity);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achievements_select_public" ON achievements
  FOR SELECT USING (TRUE);
```

### Table: `achievement_categories`

Groups for organizing achievements.

```sql
CREATE TABLE achievement_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  icon        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE achievement_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achievement_cats_select_public" ON achievement_categories
  FOR SELECT USING (TRUE);
```

### Table: `user_achievements`

User achievement tracking with progress.

```sql
CREATE TABLE user_achievements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id  UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  is_unlocked     BOOLEAN NOT NULL DEFAULT FALSE,
  progress        JSONB DEFAULT '{}',  -- Current progress toward unlock
  unlocked_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements (user_id);
CREATE INDEX idx_user_achievements_unlocked ON user_achievements (user_id, is_unlocked) WHERE is_unlocked = TRUE;

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_achievements_select_own" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_achievements_insert_own" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_achievements_update_own" ON user_achievements
  FOR UPDATE USING (auth.uid() = user_id);
```

### Table: `user_streaks`

Daily streak tracking per user.

```sql
CREATE TABLE user_streaks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  streak_type     TEXT NOT NULL DEFAULT 'daily' CHECK (streak_type IN ('daily', 'game_specific')),
  game_id         UUID REFERENCES games(id) ON DELETE CASCADE,  -- NULL for general daily streak
  current_count   INTEGER NOT NULL DEFAULT 0,
  longest_count   INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE NOT NULL,
  freeze_count    INTEGER NOT NULL DEFAULT 0,  -- Available freeze uses
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, streak_type, game_id)
);

CREATE INDEX idx_streaks_user ON user_streaks (user_id);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "streaks_select_own" ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "streaks_insert_own" ON user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "streaks_update_own" ON user_streaks
  FOR UPDATE USING (auth.uid() = user_id);
```

### Table: `missions`

Daily mission definitions. System-managed templates.

```sql
CREATE TABLE missions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  category        TEXT NOT NULL,  -- 'play', 'perform', 'explore', 'social', 'focus', 'consistency'
  game_id         UUID REFERENCES games(id) ON DELETE SET NULL,  -- NULL for game-agnostic missions
  difficulty      TEXT NOT NULL DEFAULT 'normal' CHECK (difficulty IN ('easy', 'normal', 'hard')),
  xp_reward       INTEGER NOT NULL DEFAULT 15,
  target_value    INTEGER NOT NULL DEFAULT 1,  -- How many times to complete
  conditions      JSONB NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_missions_category ON missions (category) WHERE is_active = TRUE;

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "missions_select_public" ON missions
  FOR SELECT USING (is_active = TRUE);
```

### Table: `user_missions`

Daily mission assignments and progress per user.

```sql
CREATE TABLE user_missions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id      UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  assigned_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  progress        INTEGER NOT NULL DEFAULT 0,
  target_value    INTEGER NOT NULL,
  is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at    TIMESTAMPTZ,
  xp_awarded      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, mission_id, assigned_date)
);

CREATE INDEX idx_user_missions_user_date ON user_missions (user_id, assigned_date);
CREATE INDEX idx_user_missions_active ON user_missions (user_id, is_completed) WHERE is_completed = FALSE;

ALTER TABLE user_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_missions_select_own" ON user_missions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_missions_insert_own" ON user_missions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_missions_update_own" ON user_missions
  FOR UPDATE USING (auth.uid() = user_id);
```

### Table: `challenges`

Weekly challenge definitions. System-managed.

```sql
CREATE TABLE challenges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  category        TEXT NOT NULL,  -- 'endurance', 'mastery', 'social', 'variety', 'improvement'
  game_id         UUID REFERENCES games(id) ON DELETE SET NULL,
  xp_reward       INTEGER NOT NULL DEFAULT 100,
  target_value    INTEGER NOT NULL DEFAULT 1,
  duration_days   INTEGER NOT NULL DEFAULT 7,
  conditions      JSONB NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenges_select_public" ON challenges
  FOR SELECT USING (is_active = TRUE);
```

### Table: `user_challenges`

Weekly challenge tracking per user.

```sql
CREATE TABLE user_challenges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id    UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date        DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
  progress        INTEGER NOT NULL DEFAULT 0,
  target_value    INTEGER NOT NULL,
  is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at    TIMESTAMPTZ,
  xp_awarded      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, challenge_id, start_date)
);

CREATE INDEX idx_user_challenges_user ON user_challenges (user_id);
CREATE INDEX idx_user_challenges_active ON user_challenges (user_id, is_completed) WHERE is_completed = FALSE;

ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_challenges_select_own" ON user_challenges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_challenges_insert_own" ON user_challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_challenges_update_own" ON user_challenges
  FOR UPDATE USING (auth.uid() = user_id);
```

---

## Game Session Tables

### Table: `game_sessions`

Individual play sessions. Core data table for game analytics and scoring.

```sql
CREATE TABLE game_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  status          session_status NOT NULL DEFAULT 'created',
  mode            TEXT DEFAULT 'standard',  -- 'standard', 'calibration', 'practice', 'challenge'
  trial_count     INTEGER NOT NULL DEFAULT 0,
  completed_trials INTEGER NOT NULL DEFAULT 0,
  score           NUMERIC(8,2),
  focus_score     NUMERIC(5,2),            -- 0-100 composite score
  reaction_score  NUMERIC(5,2),            -- 0-100 reaction time score
  consistency_score NUMERIC(5,2),          -- 0-100 consistency score
  endurance_score NUMERIC(5,2),            -- 0-100 endurance score
  accuracy_score  NUMERIC(5,2),            -- 0-100 accuracy score
  xp_earned       INTEGER NOT NULL DEFAULT 0,
  input_method    input_method NOT NULL DEFAULT 'touch',
  device_info     JSONB DEFAULT '{}',      -- Device type, OS, screen size
  duration_ms     INTEGER,                 -- Total session duration in milliseconds
  is_personal_record BOOLEAN NOT NULL DEFAULT FALSE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON game_sessions (user_id);
CREATE INDEX idx_sessions_game ON game_sessions (game_id);
CREATE INDEX idx_sessions_user_game ON game_sessions (user_id, game_id);
CREATE INDEX idx_sessions_completed ON game_sessions (completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_sessions_score ON game_sessions (game_id, score DESC) WHERE score IS NOT NULL;
CREATE INDEX idx_sessions_status ON game_sessions (status);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select_own" ON game_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "sessions_insert_own" ON game_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions_update_own" ON game_sessions
  FOR UPDATE USING (auth.uid() = user_id);
```

### Table: `game_session_events`

Detailed event log per session. Append-only for data integrity.

```sql
CREATE TABLE game_session_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  trial_index     INTEGER,
  event_type      TEXT NOT NULL,  -- 'trial_started', 'stimulus_shown', 'response_received', 'trial_completed', 'session_started', 'session_completed'
  event_data      JSONB NOT NULL DEFAULT '{}',
  timestamp_ms    NUMERIC(12,3) NOT NULL,  -- Millisecond precision timestamp
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_session ON game_session_events (session_id);
CREATE INDEX idx_events_type ON game_session_events (event_type);
CREATE INDEX idx_events_trial ON game_session_events (session_id, trial_index) WHERE trial_index IS NOT NULL;

ALTER TABLE game_session_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_own" ON game_session_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_sessions.id = game_session_events.session_id
      AND game_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "events_insert_own" ON game_session_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_sessions.id = game_session_events.session_id
      AND game_sessions.user_id = auth.uid()
    )
  );

-- No UPDATE or DELETE policies - events are append-only
```

### Table: `game_scores`

Aggregated scores. One record per completed session.

```sql
CREATE TABLE game_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  session_id      UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  score           NUMERIC(8,2) NOT NULL,
  rank_percentile NUMERIC(5,2),           -- Percentile rank among all users
  metadata        JSONB DEFAULT '{}',     -- Game-specific score breakdown
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id)
);

CREATE INDEX idx_scores_user ON game_scores (user_id);
CREATE INDEX idx_scores_game_rank ON game_scores (game_id, score DESC);
CREATE INDEX idx_scores_user_game ON game_scores (user_id, game_id, score DESC);

ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scores_select_own" ON game_scores
  FOR SELECT USING (auth.uid() = user_id);

-- Scores readable for leaderboard (limited fields)
CREATE POLICY "scores_select_leaderboard" ON game_scores
  FOR SELECT USING (TRUE);
```

### Table: `game_records`

Personal records per user per game.

```sql
CREATE TABLE game_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  record_type     TEXT NOT NULL,  -- 'best_score', 'fastest_rt', 'best_consistency', 'longest_streak', 'best_focus'
  value           NUMERIC(10,3) NOT NULL,
  session_id      UUID REFERENCES game_sessions(id) ON DELETE SET NULL,
  achieved_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  previous_value  NUMERIC(10,3),         -- Previous record for comparison
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, game_id, record_type)
);

CREATE INDEX idx_records_user ON game_records (user_id);
CREATE INDEX idx_records_game ON game_records (game_id, record_type);

ALTER TABLE game_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "records_select_own" ON game_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "records_select_public" ON game_records
  FOR SELECT USING (TRUE);
```

### Table: `game_calibrations`

Skill calibration data per user per game.

```sql
CREATE TABLE game_calibrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  skill_rating    NUMERIC(6,2) NOT NULL DEFAULT 1000.00,  -- ELO-like rating
  confidence      NUMERIC(3,2) NOT NULL DEFAULT 0.50,     -- 0-1 confidence in rating
  calibration_trials INTEGER NOT NULL DEFAULT 0,
  baseline_rt     NUMERIC(8,2),           -- Baseline reaction time in ms
  baseline_sd     NUMERIC(8,2),           -- Baseline standard deviation
  last_calibration_at TIMESTAMPTZ,
  decay_factor    NUMERIC(3,2) NOT NULL DEFAULT 1.00,     -- Decay since last calibration
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, game_id)
);

CREATE INDEX idx_calibration_user ON game_calibrations (user_id);

ALTER TABLE game_calibrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calibrations_select_own" ON game_calibrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "calibrations_insert_own" ON game_calibrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "calibrations_update_own" ON game_calibrations
  FOR UPDATE USING (auth.uid() = user_id);
```

### Table: `game_adaptations`

Difficulty adaptation history. Records every adaptation change for analysis.

```sql
CREATE TABLE game_adaptations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  session_id      UUID REFERENCES game_sessions(id) ON DELETE SET NULL,
  old_difficulty  NUMERIC(4,2),
  new_difficulty  NUMERIC(4,2) NOT NULL,
  reason          adaptation_reason NOT NULL,
  performance_data JSONB DEFAULT '{}',   -- Recent performance metrics used for decision
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_adaptations_user ON game_adaptations (user_id, game_id);

ALTER TABLE game_adaptations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "adaptations_select_own" ON game_adaptations
  FOR SELECT USING (auth.uid() = user_id);
```

---

## Statistics Tables

### Table: `user_statistics`

Aggregated user statistics across all games.

```sql
CREATE TABLE user_statistics (
  user_id                 UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_sessions          INTEGER NOT NULL DEFAULT 0,
  total_play_time_ms      BIGINT NOT NULL DEFAULT 0,
  total_games_played      INTEGER NOT NULL DEFAULT 0,
  average_focus_score     NUMERIC(5,2) DEFAULT 0,
  average_reaction_time   NUMERIC(8,2) DEFAULT 0,  -- ms
  best_reaction_time      NUMERIC(8,2) DEFAULT 0,
  average_consistency     NUMERIC(5,2) DEFAULT 0,
  total_lapses            INTEGER NOT NULL DEFAULT 0,
  total_false_starts      INTEGER NOT NULL DEFAULT 0,
  games_played_today      INTEGER NOT NULL DEFAULT 0,
  last_played_at          TIMESTAMPTZ,
  favorite_game_id        UUID REFERENCES games(id),
  favorite_game_sessions  INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stats_select_own" ON user_statistics
  FOR SELECT USING (auth.uid() = user_id);
```

### Table: `daily_statistics`

Daily rollup of user activity.

```sql
CREATE TABLE daily_statistics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  sessions_count  INTEGER NOT NULL DEFAULT 0,
  play_time_ms    BIGINT NOT NULL DEFAULT 0,
  total_xp        INTEGER NOT NULL DEFAULT 0,
  average_score   NUMERIC(8,2) DEFAULT 0,
  best_score      NUMERIC(8,2) DEFAULT 0,
  games_played    TEXT[] DEFAULT '{}',    -- Array of game slugs played
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX idx_daily_user ON daily_statistics (user_id, date DESC);

ALTER TABLE daily_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_stats_select_own" ON daily_statistics
  FOR SELECT USING (auth.uid() = user_id);
```

### Table: `weekly_statistics`

Weekly rollup of user activity.

```sql
CREATE TABLE weekly_statistics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start      DATE NOT NULL,  -- Monday of the week
  sessions_count  INTEGER NOT NULL DEFAULT 0,
  play_time_ms    BIGINT NOT NULL DEFAULT 0,
  total_xp        INTEGER NOT NULL DEFAULT 0,
  average_score   NUMERIC(8,2) DEFAULT 0,
  best_score      NUMERIC(8,2) DEFAULT 0,
  improvement_pct NUMERIC(5,2) DEFAULT 0, -- Improvement from previous week
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);

CREATE INDEX idx_weekly_user ON weekly_statistics (user_id, week_start DESC);

ALTER TABLE weekly_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_stats_select_own" ON weekly_statistics
  FOR SELECT USING (auth.uid() = user_id);
```

### Table: `monthly_statistics`

Monthly rollup of user activity.

```sql
CREATE TABLE monthly_statistics (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year_month        TEXT NOT NULL,  -- '2026-07'
  sessions_count    INTEGER NOT NULL DEFAULT 0,
  play_time_ms      BIGINT NOT NULL DEFAULT 0,
  total_xp          INTEGER NOT NULL DEFAULT 0,
  average_score     NUMERIC(8,2) DEFAULT 0,
  best_score        NUMERIC(8,2) DEFAULT 0,
  improvement_pct   NUMERIC(5,2) DEFAULT 0,
  games_played      INTEGER NOT NULL DEFAULT 0,
  streak_days       INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year_month)
);

ALTER TABLE monthly_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monthly_stats_select_own" ON monthly_statistics
  FOR SELECT USING (auth.uid() = user_id);
```

### Table: `game_statistics`

Per-game aggregate statistics.

```sql
CREATE TABLE game_statistics (
  game_id                 UUID PRIMARY KEY REFERENCES games(id) ON DELETE CASCADE,
  total_sessions          BIGINT NOT NULL DEFAULT 0,
  total_users             BIGINT NOT NULL DEFAULT 0,
  average_score           NUMERIC(8,2) DEFAULT 0,
  median_score            NUMERIC(8,2) DEFAULT 0,
  std_deviation           NUMERIC(8,2) DEFAULT 0,
  average_reaction_time   NUMERIC(8,2) DEFAULT 0,
  average_focus_score     NUMERIC(5,2) DEFAULT 0,
  p10_score               NUMERIC(8,2) DEFAULT 0,  -- 10th percentile
  p25_score               NUMERIC(8,2) DEFAULT 0,
  p50_score               NUMERIC(8,2) DEFAULT 0,
  p75_score               NUMERIC(8,2) DEFAULT 0,
  p90_score               NUMERIC(8,2) DEFAULT 0,
  p99_score               NUMERIC(8,2) DEFAULT 0,
  last_updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE game_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_stats_select_public" ON game_statistics
  FOR SELECT USING (TRUE);
```

---

## Social Tables

### Table: `friendships`

Friend relationships between users.

```sql
CREATE TABLE friendships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          friend_status NOT NULL DEFAULT 'pending',
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (requester_id != addressee_id),
  UNIQUE (requester_id, addressee_id)
);

CREATE INDEX idx_friendships_requester ON friendships (requester_id);
CREATE INDEX idx_friendships_addressee ON friendships (addressee_id);
CREATE INDEX idx_friendships_status ON friendships (status);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friendships_select_own" ON friendships
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "friendships_insert_own" ON friendships
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "friendships_update_own" ON friendships
  FOR UPDATE USING (auth.uid() = addressee_id);
```

### Table: `friend_requests`

Pending friend requests (derived from friendships table, but kept for notification purposes).

```sql
CREATE TABLE friend_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friendship_id   UUID NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
  message         TEXT,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_friend_requests_addressee ON friend_requests (is_read) WHERE is_read = FALSE;

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friend_requests_select_own" ON friend_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE friendships.id = friend_requests.friendship_id
      AND friendships.addressee_id = auth.uid()
    )
  );
```

### Table: `leaderboards`

Leaderboard definitions.

```sql
CREATE TABLE leaderboards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  type            leaderboard_type NOT NULL,
  season_id       UUID,  -- References leaderboard_seasons if seasonal
  region_code     TEXT,  -- For regional leaderboards
  group_id        UUID,  -- For group leaderboards
  title           TEXT NOT NULL,
  period_start    TIMESTAMPTZ,
  period_end      TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leaderboards_game ON leaderboards (game_id);
CREATE INDEX idx_leaderboards_type ON leaderboards (type) WHERE is_active = TRUE;

ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaderboards_select_public" ON leaderboards
  FOR SELECT USING (is_active = TRUE);
```

### Table: `leaderboard_entries`

Rankings within leaderboards.

```sql
CREATE TABLE leaderboard_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_id  UUID NOT NULL REFERENCES leaderboards(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score           NUMERIC(8,2) NOT NULL,
  rank            INTEGER NOT NULL,
  rank_change     INTEGER DEFAULT 0,  -- Change from previous period
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (leaderboard_id, user_id)
);

CREATE INDEX idx_lb_entries_leaderboard ON leaderboard_entries (leaderboard_id, score DESC);
CREATE INDEX idx_lb_entries_user ON leaderboard_entries (user_id);
CREATE INDEX idx_lb_entries_rank ON leaderboard_entries (leaderboard_id, rank);

ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lb_entries_select_public" ON leaderboard_entries
  FOR SELECT USING (TRUE);
```

### Table: `leaderboard_seasons`

Seasonal periods for competitive play.

```sql
CREATE TABLE leaderboard_seasons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,          -- "Season 1: Neural Awakening"
  description     TEXT,
  theme           TEXT,                   -- Visual theme identifier
  start_date      TIMESTAMPTZ NOT NULL,
  end_date        TIMESTAMPTZ NOT NULL,
  rewards         JSONB DEFAULT '{}',     -- Season-specific rewards
  is_active       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE leaderboard_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seasons_select_public" ON leaderboard_seasons
  FOR SELECT USING (TRUE);
```

### Table: `groups`

Study groups / teams.

```sql
CREATE TABLE groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  avatar_url      TEXT,
  max_members     INTEGER NOT NULL DEFAULT 50,
  is_public       BOOLEAN NOT NULL DEFAULT TRUE,
  invite_code     TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  rules           JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_groups_owner ON groups (owner_id);
CREATE INDEX idx_groups_invite ON groups (invite_code);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groups_select_public" ON groups
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "groups_select_member" ON groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "groups_insert_own" ON groups
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "groups_update_owner" ON groups
  FOR UPDATE USING (auth.uid() = owner_id);
```

### Table: `group_members`

Group membership.

```sql
CREATE TABLE group_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX idx_group_members_user ON group_members (user_id);
CREATE INDEX idx_group_members_group ON group_members (group_id);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_members_select_member" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "group_members_insert_own" ON group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## Content Tables

### Table: `daily_mission_templates`

Templates for generating daily missions.

```sql
CREATE TABLE daily_mission_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id      UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  weight          NUMERIC(3,2) NOT NULL DEFAULT 1.00,  -- Selection weight
  min_level       INTEGER NOT NULL DEFAULT 1,
  max_level       INTEGER,  -- NULL = no max
  day_of_week     INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',  -- Days this can appear (0=Sunday)
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE daily_mission_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mission_templates_select_public" ON daily_mission_templates
  FOR SELECT USING (is_active = TRUE);
```

### Table: `weekly_challenge_templates`

Templates for generating weekly challenges.

```sql
CREATE TABLE weekly_challenge_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id    UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  weight          NUMERIC(3,2) NOT NULL DEFAULT 1.00,
  min_level       INTEGER NOT NULL DEFAULT 1,
  max_level       INTEGER,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE weekly_challenge_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenge_templates_select_public" ON weekly_challenge_templates
  FOR SELECT USING (is_active = TRUE);
```

### Table: `notifications`

User notifications.

```sql
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  data            JSONB DEFAULT '{}',     -- Additional context data
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications (user_id) WHERE is_read = FALSE;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);
```

### Table: `notification_preferences`

Per-type notification settings.

```sql
CREATE TABLE notification_preferences (
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                notification_type NOT NULL,
  in_app_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
  push_enabled        BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, type)
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_prefs_select_own" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notif_prefs_update_own" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);
```

---

## Analytics Tables

### Table: `analytics_events`

Raw event stream for analytics.

```sql
CREATE TABLE analytics_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  anonymous_id    TEXT,                   -- For pre-auth tracking
  event_name      TEXT NOT NULL,
  event_category  TEXT NOT NULL,
  properties      JSONB DEFAULT '{}',
  context         JSONB DEFAULT '{}',    -- Device, OS, browser, screen
  session_id      TEXT,                  -- Frontend session ID
  timestamp_ms    BIGINT NOT NULL,       -- Event timestamp in ms
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partitioned by month in production
CREATE INDEX idx_analytics_user ON analytics_events (user_id);
CREATE INDEX idx_analytics_name ON analytics_events (event_name);
CREATE INDEX idx_analytics_timestamp ON analytics_events (created_at DESC);

-- RLS: Only service role can access
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_insert_authenticated" ON analytics_events
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "analytics_select_admin" ON analytics_events
  FOR SELECT USING (FALSE);  -- Service role only
```

### Table: `feature_usage`

Feature adoption tracking.

```sql
CREATE TABLE feature_usage (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_name    TEXT NOT NULL,
  usage_count     INTEGER NOT NULL DEFAULT 1,
  first_used_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, feature_name)
);

CREATE INDEX idx_feature_usage_user ON feature_usage (user_id);

ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_usage_select_own" ON feature_usage
  FOR SELECT USING (auth.uid() = user_id);
```

### Table: `performance_metrics`

App performance data.

```sql
CREATE TABLE performance_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  metric_name     TEXT NOT NULL,  -- 'lcp', 'fid', 'cls', 'inp', 'ttfb', 'frame_drop'
  metric_value    NUMERIC(10,3) NOT NULL,
  context         JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_perf_metrics_name ON performance_metrics (metric_name, created_at DESC);

ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perf_metrics_insert" ON performance_metrics
  FOR INSERT WITH CHECK (TRUE);
```

### Table: `ab_test_assignments`

A/B test variant assignments.

```sql
CREATE TABLE ab_test_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  experiment_name TEXT NOT NULL,
  variant         TEXT NOT NULL,
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, experiment_name)
);

CREATE INDEX idx_ab_test_user ON ab_test_assignments (user_id);

ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ab_test_select_own" ON ab_test_assignments
  FOR SELECT USING (auth.uid() = user_id);
```

---

## Database Functions

### Function: `calculate_xp_for_level`

Calculates the XP required to reach a given level.

```sql
CREATE OR REPLACE FUNCTION calculate_xp_for_level(target_level INTEGER)
RETURNS BIGINT
LANGUAGE SQL IMMUTABLE
AS $$
  SELECT FLOOR(100 * POWER(target_level::numeric, 1.5))::BIGINT;
$$;
```

### Function: `advance_user_level`

Checks if user has enough XP to level up and processes the advancement.

```sql
CREATE OR REPLACE FUNCTION advance_user_level(p_user_id UUID)
RETURNS TABLE(new_level INTEGER, leveled_up BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
  current_xp BIGINT;
  current_level INTEGER;
  next_level_xp BIGINT;
  new_level_calc INTEGER;
BEGIN
  SELECT up.total_xp, up.current_level
  INTO current_xp, current_level
  FROM user_profiles up
  WHERE up.user_id = p_user_id;

  new_level_calc := current_level;

  LOOP
    next_level_xp := calculate_xp_for_level(new_level_calc + 1);
    EXIT WHEN current_xp < next_level_xp;
    new_level_calc := new_level_calc + 1;
  END LOOP;

  IF new_level_calc > current_level THEN
    UPDATE user_profiles
    SET current_level = new_level_calc,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    RETURN QUERY SELECT new_level_calc, TRUE;
  ELSE
    RETURN QUERY SELECT current_level, FALSE;
  END IF;
END;
$$;
```

### Function: `check_achievement_unlock`

Evaluates achievement conditions and unlocks if met.

```sql
CREATE OR REPLACE FUNCTION check_achievement_unlock(
  p_user_id UUID,
  p_achievement_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_conditions JSONB;
  v_progress JSONB;
  v_met BOOLEAN := TRUE;
  v_key TEXT;
  v_required NUMERIC;
  v_current NUMERIC;
BEGIN
  SELECT a.conditions INTO v_conditions
  FROM achievements a WHERE a.id = p_achievement_id;

  SELECT ua.progress INTO v_progress
  FROM user_achievements ua
  WHERE ua.user_id = p_user_id AND ua.achievement_id = p_achievement_id;

  IF v_conditions IS NULL THEN RETURN FALSE; END IF;

  FOR v_key IN SELECT jsonb_object_keys(v_conditions)
  LOOP
    v_required := (v_conditions ->> v_key)::NUMERIC;
    v_current := COALESCE((v_progress ->> v_key)::NUMERIC, 0);
    IF v_current < v_required THEN
      v_met := FALSE;
      EXIT;
    END IF;
  END LOOP;

  IF v_met THEN
    UPDATE user_achievements
    SET is_unlocked = TRUE,
        unlocked_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id AND achievement_id = p_achievement_id;
  END IF;

  RETURN v_met;
END;
$$;
```

### Function: `generate_daily_missions`

Generates daily missions for a user based on level and preferences.

```sql
CREATE OR REPLACE FUNCTION generate_daily_missions(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_level INTEGER;
  v_mission RECORD;
  v_count INTEGER := 0;
BEGIN
  SELECT current_level INTO v_level
  FROM user_profiles WHERE user_id = p_user_id;

  DELETE FROM user_missions
  WHERE user_id = p_user_id
  AND assigned_date = CURRENT_DATE;

  FOR v_mission IN
    SELECT m.*, dt.weight, dt.min_level, dt.max_level
    FROM missions m
    JOIN daily_mission_templates dt ON dt.mission_id = m.id
    WHERE m.is_active = TRUE
    AND dt.is_active = TRUE
    AND v_level >= dt.min_level
    AND (dt.max_level IS NULL OR v_level <= dt.max_level)
    AND EXTRACT(DOW FROM NOW()) = ANY(dt.day_of_week)
    ORDER BY RANDOM() * dt.weight DESC
    LIMIT 3
  LOOP
    INSERT INTO user_missions (user_id, mission_id, assigned_date, target_value)
    VALUES (p_user_id, v_mission.id, CURRENT_DATE, v_mission.target_value)
    ON CONFLICT (user_id, mission_id, assigned_date) DO NOTHING;

    v_count := v_count + 1;
  END LOOP;
END;
$$;
```

### Function: `update_leaderboard_rank`

Recalculates leaderboard rankings based on scores.

```sql
CREATE OR REPLACE FUNCTION update_leaderboard_rank(p_leaderboard_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (ORDER BY score DESC, created_at ASC) as new_rank,
           rank as old_rank
    FROM leaderboard_entries
    WHERE leaderboard_id = p_leaderboard_id
  )
  UPDATE leaderboard_entries le
  SET rank = r.new_rank,
      rank_change = r.old_rank - r.new_rank,
      updated_at = NOW()
  FROM ranked r
  WHERE le.id = r.id;
END;
$$;
```

### Function: `update_updated_at`

Trigger function that automatically sets `updated_at` on row modification.

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
```

Apply to all tables with `updated_at`:

```sql
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Apply to all other tables with updated_at column...
```

---

## Materialized Views

### View: `mv_leaderboard_global`

Pre-computed global leaderboard for fast queries.

```sql
CREATE MATERIALIZED VIEW mv_leaderboard_global AS
SELECT
  gs.game_id,
  gs.user_id,
  u.username,
  u.avatar_url,
  gs.score,
  gs.created_at,
  ROW_NUMBER() OVER (
    PARTITION BY gs.game_id
    ORDER BY gs.score DESC, gs.created_at ASC
  ) as rank
FROM game_scores gs
JOIN users u ON u.id = gs.user_id
WHERE u.deleted_at IS NULL
AND u.is_banned = FALSE;

CREATE UNIQUE INDEX idx_mv_lb_global ON mv_leaderboard_global (game_id, user_id, score);
CREATE INDEX idx_mv_lb_global_rank ON mv_leaderboard_global (game_id, rank);

-- Refresh every 15 minutes via pg_cron
SELECT cron.schedule('refresh-leaderboard', '*/15 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_leaderboard_global');
```

### View: `mv_user_rankings`

Pre-computed user rankings across all games.

```sql
CREATE MATERIALIZED VIEW mv_user_rankings AS
SELECT
  gs.user_id,
  gs.game_id,
  gs.score,
  gs.rank_percentile,
  RANK() OVER (PARTITION BY gs.game_id ORDER BY gs.score DESC) as global_rank,
  gs.created_at
FROM game_scores gs;

CREATE UNIQUE INDEX idx_mv_user_rankings ON mv_user_rankings (user_id, game_id, score);
```

---

## Migration Strategy

- Migrations stored in `supabase/migrations/` directory
- Naming convention: `YYYYMMDDHHMMSS_descriptive_name.sql`
- Every migration must be forward-compatible (no breaking changes in production)
- Zero-downtime pattern: Add column → populate → add constraint → remove old column (in separate migrations)
- Migration testing: Run against staging database before production
- Rollback scripts: Emergency-only, tested on staging first

## Backup Strategy

- Supabase provides automatic daily backups (7 days retention on Pro plan)
- Custom backup: pg_dump every 6 hours to separate storage
- Point-in-time recovery: Available via Supabase Pro plan
- Backup testing: Monthly restore test to verify integrity
- Cross-region backup for disaster recovery

## Data Retention

| Data Type | Retention Period | Action |
|-----------|-----------------|--------|
| User account data | Active account lifetime | Delete on account deletion (30 days grace) |
| Game sessions | 1 year detailed | Aggregate to monthly_statistics |
| Analytics events | 2 years raw | Archive to cold storage |
| Analytics aggregated | 5 years | Retain indefinitely |
| Audit logs | 1 year | Archive to cold storage |
| Error logs | 90 days | Auto-delete |
| Notifications | 30 days | Auto-delete read notifications |
| Backup | 90 days | Auto-delete old backups |

## Soft Delete Pattern

Tables using soft delete: `users` only. Game session data is never deleted (append-only for scientific integrity). Soft delete implementation:

```sql
-- Soft delete a user
UPDATE users SET deleted_at = NOW() WHERE id = user_id;

-- Cascade: All RLS policies check deleted_at IS NULL
-- Hard purge: Run after 30-day grace period
-- pg_cron job: DELETE FROM users WHERE deleted_at < NOW() - INTERVAL '30 days';
```

## Audit Logging

Sensitive operations are logged to an append-only audit table:

```sql
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,
  action      TEXT NOT NULL,       -- 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT'
  table_name  TEXT NOT NULL,
  record_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log (user_id, created_at DESC);
CREATE INDEX idx_audit_table ON audit_log (table_name, created_at DESC);

-- Append-only: No UPDATE or DELETE policies
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_insert_service" ON audit_log
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "audit_select_admin" ON audit_log
  FOR SELECT USING (FALSE);  -- Service role only
```

## Row Count Estimates (at Scale: 1M Users)

| Table | Estimated Rows | Growth Rate |
|-------|---------------|-------------|
| users | 1,000,000 | Linear with signups |
| user_profiles | 1,000,000 | 1:1 with users |
| user_settings | 1,000,000 | 1:1 with users |
| game_sessions | 50,000,000 | 50 per user average |
| game_session_events | 500,000,000 | ~10 events per session |
| game_scores | 50,000,000 | 1:1 with completed sessions |
| user_xp | 100,000,000 | ~2 XP transactions per session |
| user_achievements | 20,000,000 | ~20 achievements per user |
| leaderboard_entries | 10,000,000 | Multiple boards per user |
| analytics_events | 1,000,000,000 | ~100 events per user |
| notifications | 50,000,000 | ~50 per user lifetime |
| friendships | 5,000,000 | ~5 friends per user average |
