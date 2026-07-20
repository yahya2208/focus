# Database Schema

FOCUS v2.0 uses PostgreSQL via Supabase. All tables have Row Level Security (RLS) enabled.

## Entity Relationship Diagram

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  users   │────<│   devices    │────<│ calibrations │
│          │     │              │     │              │
│ id (PK)  │     │ id (PK)      │     │ id (PK)      │
│ email    │     │ user_id (FK) │     │ user_id (FK) │
│ role     │     │ browser      │     │ device_id(FK)│
│ ...      │     │ os           │     │ refresh_rate │
└──────────┘     │ screen_size  │     │ display_lag  │
     │           │ ...          │     │ input_lag    │
     │           └──────────────┘     │ confidence   │
     │                                └──────────────┘
     │
     ├────<┌──────────────┐
     │     │   sessions   │
     │     │              │
     │     │ id (PK)      │
     │     │ user_id (FK) │
     │     │ device_id(FK)│
     │     │ calibr_id(FK)│
     │     │ measurements │ (JSONB)
     │     │ sci_results  │ (JSONB)
     │     │ status       │
     │     │ ...          │
     │     └──────────────┘
     │
     └────<┌──────────────┐
           │   surveys    │
           │              │
           │ id (PK)      │
           │ user_id (FK) │
           │ age_range    │
           │ gender       │
           │ country      │
           │ ...          │
           └──────────────┘
```

## Tables

### `users`
Stores user accounts and roles.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Supabase auth user ID |
| `email` | `text` UNIQUE | User email (null for guests) |
| `display_name` | `text` | Display name |
| `role` | `text` NOT NULL | One of: `guest`, `user`, `researcher`, `admin`, `super_admin` |
| `avatar_url` | `text` | Profile picture URL |
| `is_anonymous` | `boolean` | True for guest/anonymous users |
| `created_at` | `timestamptz` | Account creation time |
| `updated_at` | `timestamptz` | Last update time |
| `last_login_at` | `timestamptz` | Last login time |

### `devices`
Hardware/software fingerprint of the user's device.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Device record ID |
| `user_id` | `uuid` FK→users | Owner |
| `browser` | `text` | Browser name |
| `browser_version` | `text` | Browser version |
| `os` | `text` | Operating system |
| `os_version` | `text` | OS version |
| `platform` | `text` | Platform type (desktop, mobile, tablet) |
| `screen_width` | `integer` | Screen width in pixels |
| `screen_height` | `integer` | Screen height in pixels |
| `pixel_ratio` | `real` | Device pixel ratio |
| `refresh_rate` | `integer` | Display refresh rate (Hz) |
| `touch_support` | `boolean` | Touch input available |
| `pointer_type` | `text` | Primary input device |
| `cpu_cores` | `integer` | CPU logical cores |
| `memory_gb` | `real` | Device memory (GB) |
| `language` | `text` | Browser language |
| `timezone` | `text` | User timezone |
| `user_agent` | `text` | Full user agent string |
| `collected_at` | `timestamptz` | When device info was collected |

### `calibrations`
Device calibration results for accurate timing.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Calibration record ID |
| `user_id` | `uuid` FK→users | Owner |
| `device_id` | `uuid` FK→devices | Device used |
| `refresh_rate` | `integer` | Measured refresh rate |
| `display_lag_ms` | `real` | Measured display lag (ms) |
| `input_lag_ms` | `real` | Measured input lag (ms) |
| `confidence` | `real` | Calibration confidence (0-1) |
| `platform` | `text` | Platform string |
| `browser_name` | `text` | Browser name |
| `created_at` | `timestamptz` | When calibrated |
| `expires_at` | `timestamptz` | When calibration expires |

### `sessions`
Measurement sessions with results.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Session ID |
| `user_id` | `uuid` FK→users | Owner |
| `device_id` | `uuid` FK→devices | Device used |
| `calibration_id` | `uuid` FK→calibrations | Calibration used |
| `plugin_id` | `text` | Game plugin identifier |
| `status` | `text` | `draft`/`running`/`paused`/`completed`/`archived`/`synced`/`failed` |
| `measurements` | `jsonb` | Raw reaction times and derived metrics |
| `scientific_results` | `jsonb` | Statistical analysis results |
| `metadata` | `jsonb` | Version, build info |
| `created_at` | `timestamptz` | Session start |
| `updated_at` | `timestamptz` | Last update |
| `finished_at` | `timestamptz` | Session end |
| `version` | `text` | App version |

### `surveys`
Demographic and lifestyle questionnaires.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Survey ID |
| `user_id` | `uuid` FK→users | Owner |
| `age_range` | `text` | Age range |
| `gender` | `text` | Gender |
| `country` | `text` | Country |
| `state` | `text` | State/region |
| `education` | `text` | Education level |
| `occupation` | `text` | Occupation |
| `sleep_hours` | `real` | Average sleep hours |
| `coffee_per_day` | `integer` | Coffee consumption |
| `exercise_frequency` | `text` | Exercise frequency |
| `dominant_hand` | `text` | Handedness |
| `gaming_frequency` | `text` | Gaming frequency |
| `created_at` | `timestamptz` | When submitted |

## Row Level Security (RLS) Policies

| Table | Policy | Rule |
|-------|--------|------|
| users | Users read own profile | `auth.uid() = id` |
| users | Admins read all users | role in (admin, super_admin) |
| users | Admins promote users | role in (admin, super_admin) — UPDATE only |
| sessions | Users manage own sessions | `auth.uid() = user_id` — ALL operations |
| sessions | Admins read all sessions | role in (admin, super_admin) |
| sessions | Admins manage all sessions | role in (admin, super_admin) — ALL operations |
| sessions | Researchers read all sessions | role = researcher |
| devices | Users manage own devices | `auth.uid() = user_id` |
| devices | Admins read all devices | role in (admin, super_admin) |
| calibrations | Users manage own calibrations | `auth.uid() = user_id` |
| calibrations | Admins read all calibrations | role in (admin, super_admin) |
| surveys | Users manage own surveys | `auth.uid() = user_id` |
| surveys | Admins read all surveys | role in (admin, super_admin) |
| surveys | Researchers read all surveys | role = researcher |

## Role Hierarchy

```
super_admin  →  Full access. Can manage all users and data.
admin        →  Can read all data. Can promote users to researcher/analyst/viewer.
researcher   →  Read-only access to all sessions, surveys, devices.
user         →  Can manage own data only.
guest        →  Anonymous, no persistent data.
```
