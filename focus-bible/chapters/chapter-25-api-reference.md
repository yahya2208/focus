# Chapter 25: API Reference

## Overview

The FOCUS Platform exposes a comprehensive RESTful API built on Hono running inside Cloudflare Workers, with Supabase PostgreSQL as the backing store and Supabase Auth for identity. Every endpoint follows a uniform contract: JSON request and response bodies, standard HTTP methods, bearer-token authentication where required, and a consistent error envelope. This chapter documents every publicly consumable endpoint grouped by domain. Each entry includes the HTTP method, canonical URL, prose description, authentication requirement, fully typed request and response schemas in TypeScript, the set of status/error codes the caller should expect, rate-limit quotas, and row-level-security (RLS) implications.

Base URL for all endpoints:

```
https://api.focusgame.app/v1
```

All timestamps are ISO-8601 strings. All monetary values are integers in the smallest unit (cents). All IDs are UUIDs encoded as 36-character hyphenated strings unless otherwise noted.

---

## 1. Auth API

Authentication is powered by Supabase Auth. Tokens are JWTs issued by Supabase and verified at the edge by the Hono middleware. The `Authorization` header carries a `Bearer <access_token>` on every authenticated request. Refresh tokens are httpOnly secure cookies set by the server during login flows.

### Shared Types

```typescript
type UUID = string; // "550e8400-e29b-41d4-a716-446655440000"

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds until access_token expiry
  token_type: "Bearer";
}

interface AuthError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

interface AuthResponse {
  data: {
    user: User | null;
    session: AuthTokens | null;
  };
  error: AuthError | null;
}

interface User {
  id: UUID;
  email: string;
  phone?: string;
  email_confirmed_at: string | null;
  phone_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  app_metadata: Record<string, unknown>;
  user_metadata: {
    display_name?: string;
    avatar_url?: string;
    locale?: string;
  };
  role: "authenticated" | "anon";
  aud: string;
}
```

### 1.1 POST `/auth/signup`

Create a new user account with email and password.

- **Method:** `POST`
- **URL:** `/auth/signup`
- **Auth required:** No
- **Rate limit:** 5 requests per 60 seconds per IP

```typescript
interface SignupRequest {
  email: string;         // valid email, max 254 chars
  password: string;      // min 8, max 128 chars; must contain upper, lower, digit, special
  data?: {
    display_name?: string; // 1-30 chars, alphanumeric + spaces
    locale?: string;       // ISO 639-1, default "en"
  };
  captcha_token?: string; // Turnstile token when CAPTCHA is enabled
}

interface SignupResponse {
  data: {
    user: User;
    session: null; // null until email confirmed
  };
  error: null;
}

interface SignupErrorResponse {
  data: {
    user: null;
    session: null;
  };
  error: AuthError;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `AUTH_001` | Invalid email format |
| 400 | `AUTH_002` | Password too weak |
| 400 | `AUTH_003` | Password confirmation mismatch |
| 409 | `AUTH_004` | Email already registered |
| 429 | `AUTH_005` | Too many signup attempts |
| 500 | `AUTH_006` | Email provider unreachable |

**RLS:** No RLS applied; endpoint creates the auth user and a corresponding row in `public.profiles`.

---

### 1.2 POST `/auth/login`

Authenticate an existing user with email and password.

- **Method:** `POST`
- **URL:** `/auth/login`
- **Auth required:** No
- **Rate limit:** 10 requests per 60 seconds per email

```typescript
interface LoginRequest {
  email: string;
  password: string;
  captcha_token?: string;
}

interface LoginResponse {
  data: {
    user: User;
    session: AuthTokens;
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `AUTH_010` | Missing required field |
| 401 | `AUTH_011` | Invalid email or password |
| 401 | `AUTH_012` | Email not confirmed |
| 401 | `AUTH_013` | Account suspended |
| 429 | `AUTH_014` | Too many login attempts, account temporarily locked |
| 500 | `AUTH_015` | Auth service unavailable |

**RLS:** No RLS; Supabase Auth handles credential verification.

---

### 1.3 POST `/auth/magic-link`

Send a passwordless magic link to the user's email.

- **Method:** `POST`
- **URL:** `/auth/magic-link`
- **Auth required:** No
- **Rate limit:** 3 requests per 60 seconds per email

```typescript
interface MagicLinkRequest {
  email: string;
  captcha_token?: string;
}

interface MagicLinkResponse {
  data: {
    message: string; // "If the email exists, a magic link has been sent"
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `AUTH_020` | Invalid email format |
| 429 | `AUTH_021` | Too many magic link requests |
| 500 | `AUTH_022` | Email delivery failed |

**RLS:** No RLS applied.

---

### 1.4 POST `/auth/oauth/:provider`

Initiate an OAuth 2.0 flow with the given provider.

- **Method:** `POST`
- **URL:** `/auth/oauth/:provider`
- **Auth required:** No
- **Rate limit:** 10 requests per 60 seconds per IP

```typescript
type OAuthProvider = "google" | "apple" | "github" | "discord";

interface OAuthRequest {
  provider: OAuthProvider;
  redirect_to?: string; // post-auth redirect, must be on allowlist
}

interface OAuthResponse {
  data: {
    url: string; // OAuth authorization URL to redirect the user to
    provider: OAuthProvider;
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `AUTH_030` | Unsupported provider |
| 400 | `AUTH_031` | Invalid redirect_to domain |
| 500 | `AUTH_032` | OAuth provider configuration error |

**RLS:** No RLS applied.

---

### 1.5 POST `/auth/logout`

Invalidate the current session.

- **Method:** `POST`
- **URL:** `/auth/logout`
- **Auth required:** Yes (Bearer token)
- **Rate limit:** 30 requests per 60 seconds per user

```typescript
interface LogoutRequest {
  scope?: "local" | "global"; // local = this session only, global = all sessions
}

interface LogoutResponse {
  data: {
    message: string;
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 401 | `AUTH_040` | Token expired or invalid |
| 500 | `AUTH_041` | Failed to revoke session |

---

### 1.6 GET `/auth/session`

Retrieve the current session and user profile.

- **Method:** `GET`
- **URL:** `/auth/session`
- **Auth required:** Yes
- **Rate limit:** 60 requests per 60 seconds per user

```typescript
interface SessionResponse {
  data: {
    user: User;
    session: AuthTokens;
    profile: Profile;
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 401 | `AUTH_050` | No active session |
| 401 | `AUTH_051` | Token expired |

**RLS:** Reads from `public.profiles` where `profiles.id = auth.uid()`.

---

### 1.7 POST `/auth/refresh`

Refresh an expired access token using the refresh token.

- **Method:** `POST`
- **URL:** `/auth/refresh`
- **Auth required:** No (refresh token in body or cookie)
- **Rate limit:** 30 requests per 60 seconds per refresh token

```typescript
interface RefreshRequest {
  refresh_token: string;
}

interface RefreshResponse {
  data: AuthTokens;
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 401 | `AUTH_060` | Invalid or expired refresh token |
| 401 | `AUTH_061` | Refresh token has been revoked |
| 429 | `AUTH_062` | Too many refresh attempts |

---

### 1.8 POST `/auth/forgot-password`

Request a password reset email.

- **Method:** `POST`
- **URL:** `/auth/forgot-password`
- **Auth required:** No
- **Rate limit:** 3 requests per 60 seconds per email

```typescript
interface ForgotPasswordRequest {
  email: string;
  captcha_token?: string;
}

interface ForgotPasswordResponse {
  data: {
    message: string;
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `AUTH_070` | Invalid email format |
| 429 | `AUTH_071` | Too many reset requests |
| 500 | `AUTH_072` | Failed to send reset email |

---

### 1.9 POST `/auth/reset-password`

Set a new password using the token from the reset email.

- **Method:** `POST`
- **URL:** `/auth/reset-password`
- **Auth required:** No (requires reset token)
- **Rate limit:** 5 requests per 60 seconds per token

```typescript
interface ResetPasswordRequest {
  token: string;
  password: string;
  password_confirm: string;
}

interface ResetPasswordResponse {
  data: {
    message: string;
    session: AuthTokens;
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `AUTH_080` | Passwords do not match |
| 400 | `AUTH_081` | Password too weak |
| 400 | `AUTH_082` | Invalid or expired reset token |
| 429 | `AUTH_083` | Too many reset attempts |

---

### 1.10 POST `/auth/verify-email`

Confirm the user's email address using the verification token.

- **Method:** `POST`
- **URL:** `/auth/verify-email`
- **Auth required:** No (requires verification token)
- **Rate limit:** 5 requests per 60 seconds per token

```typescript
interface VerifyEmailRequest {
  token: string;
  type: "signup" | "email_change" | "magiclink";
}

interface VerifyEmailResponse {
  data: {
    message: string;
    session: AuthTokens;
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `AUTH_090` | Invalid or expired token |
| 400 | `AUTH_091` | Token already used |
| 500 | `AUTH_092` | Failed to verify email |

---

### 1.11 POST `/auth/2fa/enable`

Begin two-factor authentication enrollment. Returns a TOTP secret and QR code URL.

- **Method:** `POST`
- **URL:** `/auth/2fa/enable`
- **Auth required:** Yes
- **Rate limit:** 5 requests per 60 seconds per user

```typescript
interface Enable2FARequest {
  password: string; // confirm current password
}

interface Enable2FAResponse {
  data: {
    secret: string; // TOTP secret (base32)
    qr_code_url: string; // otpauth:// URI for QR generation
    backup_codes: string[]; // 8 one-time recovery codes
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `AUTH_100` | 2FA already enabled |
| 401 | `AUTH_101` | Incorrect password |
| 401 | `AUTH_102` | Token expired |

---

### 1.12 POST `/auth/2fa/verify`

Verify a TOTP code to finalize 2FA enrollment or to log in with 2FA.

- **Method:** `POST`
- **URL:** `/auth/2fa/verify`
- **Auth required:** Conditionally (during enrollment: yes; during login: via interim token)
- **Rate limit:** 10 requests per 60 seconds per user

```typescript
interface Verify2FARequest {
  code: string; // 6-digit TOTP code
  factor_id?: string; // required during enrollment flow
  interim_token?: string; // provided during login with 2FA
}

interface Verify2FAResponse {
  data: {
    session: AuthTokens;
    enabled: boolean;
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `AUTH_110` | Invalid 2FA code |
| 400 | `AUTH_111` | Code expired (TOTP window passed) |
| 401 | `AUTH_112` | Too many failed attempts, factor locked for 30 min |
| 401 | `AUTH_113` | Interim token invalid |

---

### 1.13 POST `/auth/2fa/disable`

Disable two-factor authentication for the current user.

- **Method:** `POST`
- **URL:** `/auth/2fa/disable`
- **Auth required:** Yes
- **Rate limit:** 3 requests per 60 seconds per user

```typescript
interface Disable2FARequest {
  password: string;
  code: string; // current TOTP code or a backup code
}

interface Disable2FAResponse {
  data: {
    message: string;
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `AUTH_120` | 2FA not enabled |
| 401 | `AUTH_121` | Incorrect password or code |
| 429 | `AUTH_122` | Too many disable attempts |

---

## 2. Profile API

Profiles extend the Supabase Auth user with game-specific data. The `profiles` table stores display name, level, XP, streak, avatar URL, preferences, and more.

### Shared Types

```typescript
interface Profile {
  id: UUID;
  display_name: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  streak_days: number;
  longest_streak: number;
  preferred_difficulty: Difficulty;
  preferred_game_mode: GameMode;
  total_score: number;
  games_played: number;
  achievements_count: number;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  bio: string | null;
  country_code: string | null;
  platform: Platform;
  last_active_at: string;
}

type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";
type GameMode = "focus_shift" | "endurance" | "sprint" | "tutorial";
type Platform = "web" | "ios" | "android" | "desktop";
```

### 2.1 GET `/profile`

Get the authenticated user's full profile.

- **Method:** `GET`
- **URL:** `/profile`
- **Auth required:** Yes
- **Rate limit:** 60 per 60s per user

```typescript
interface GetProfileResponse {
  data: Profile;
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 401 | `AUTH_050` | No active session |
| 404 | `PROFILE_001` | Profile not found (data integrity issue) |

**RLS:** `SELECT` on `profiles` where `profiles.id = auth.uid()`.

---

### 2.2 PATCH `/profile`

Update profile fields. Only provided fields are modified.

- **Method:** `PATCH`
- **URL:** `/profile`
- **Auth required:** Yes
- **Rate limit:** 10 per 60s per user

```typescript
interface UpdateProfileRequest {
  display_name?: string;    // 1-30 chars
  bio?: string;             // max 500 chars, nullable
  preferred_difficulty?: Difficulty;
  preferred_game_mode?: GameMode;
  country_code?: string;    // ISO 3166-1 alpha-2, nullable
  is_public?: boolean;
  locale?: string;          // ISO 639-1
}

interface UpdateProfileResponse {
  data: Profile;
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `PROFILE_010` | Display name contains forbidden characters |
| 400 | `PROFILE_011` | Bio exceeds 500 characters |
| 409 | `PROFILE_012` | Display name already taken |

**RLS:** `UPDATE` on `profiles` where `profiles.id = auth.uid()`.

---

### 2.3 DELETE `/profile`

Permanently delete the user's account and all associated data. Initiates a 30-day grace period.

- **Method:** `DELETE`
- **URL:** `/profile`
- **Auth required:** Yes
- **Rate limit:** 1 per 3600s per user (cooldown)

```typescript
interface DeleteAccountRequest {
  password: string;
  confirmation: string; // must equal "DELETE MY ACCOUNT"
}

interface DeleteAccountResponse {
  data: {
    deletion_scheduled_at: string;
    grace_period_days: number;
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `PROFILE_020` | Confirmation text does not match |
| 401 | `PROFILE_021` | Incorrect password |

**RLS:** `DELETE` on `profiles` where `profiles.id = auth.uid()`; cascading soft-delete via DB trigger.

---

### 2.4 GET `/profile/export`

Export all user data as a JSON archive (GDPR compliance).

- **Method:** `GET`
- **URL:** `/profile/export`
- **Auth required:** Yes
- **Rate limit:** 1 per 3600s per user

```typescript
interface ExportDataResponse {
  data: {
    profile: Profile;
    sessions: Session[];
    scores: Score[];
    achievements: Achievement[];
    missions: MissionProgress[];
    friends: Friend[];
    groups: GroupMembership[];
    export_url: string; // signed URL, 15-min TTL
    expires_at: string;
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 401 | `PROFILE_030` | Not authenticated |
| 429 | `PROFILE_031` | Export already in progress |

**RLS:** Aggregated read across multiple tables, all scoped to `auth.uid()`.

---

### 2.5 GET `/profile/public/:userId`

Fetch the public-facing profile of any user.

- **Method:** `GET`
- **URL:** `/profile/public/:userId`
- **Auth required:** No (but rate limited more aggressively for anon)
- **Rate limit:** 30 per 60s per IP

```typescript
interface PublicProfileParams {
  userId: UUID;
}

interface PublicProfileResponse {
  data: {
    id: UUID;
    display_name: string;
    avatar_url: string | null;
    level: number;
    total_score: number;
    games_played: number;
    achievements_count: number;
    streak_days: number;
    country_code: string | null;
    created_at: string;
    bio: string | null;
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 404 | `PROFILE_040` | User not found |
| 403 | `PROFILE_041` | Profile is set to private |

**RLS:** `SELECT` on `profiles` where `profiles.is_public = true` OR requester is admin.

---

### 2.6 POST `/profile/avatar`

Upload a new avatar image. Accepts multipart/form-data with a single image file.

- **Method:** `POST`
- **URL:** `/profile/avatar`
- **Auth required:** Yes
- **Rate limit:** 5 per 3600s per user
- **Content-Type:** `multipart/form-data`

```typescript
interface UploadAvatarRequest {
  file: File; // max 5MB, allowed: image/jpeg, image/png, image/webp
}

interface UploadAvatarResponse {
  data: {
    avatar_url: string; // CDN URL
    thumbnail_url: string; // 128x128 thumbnail
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `PROFILE_050` | File exceeds 5MB limit |
| 400 | `PROFILE_051` | Unsupported file type |
| 413 | `PROFILE_052` | Image dimensions must be between 64x64 and 4096x4096 |
| 500 | `PROFILE_053` | Image processing failed |

**RLS:** Upload to R2 storage; `UPDATE` on `profiles.avatar_url`.

---

## 3. Games API

Each game in the FOCUS platform has metadata, configuration, and calibration data. Games are immutable definitions; sessions are the runtime instances.

### Shared Types

```typescript
interface Game {
  id: UUID;
  slug: string;
  title: string;
  description: string;
  short_description: string;
  category: GameCategory;
  difficulty: Difficulty;
  min_duration_seconds: number;
  max_duration_seconds: number;
  thumbnail_url: string;
  banner_url: string;
  is_active: boolean;
  version: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  estimated_difficulty_rating: number; // 1.0 - 5.0
  completion_count: number;
  average_score: number;
  config_schema: Record<string, unknown>; // JSON Schema for game-specific config
}

type GameCategory = "focus" | "memory" | "reaction" | "cognitive" | "multi";

interface GameConfig {
  game_id: UUID;
  version: string;
  parameters: Record<string, GameConfigParameter>;
  defaults: Record<string, unknown>;
}

interface GameConfigParameter {
  type: "number" | "string" | "boolean" | "enum";
  min?: number;
  max?: number;
  enum_values?: string[];
  description: string;
  default: unknown;
}
```

### 3.1 GET `/games`

List all available games with optional filtering.

- **Method:** `GET`
- **URL:** `/games`
- **Auth required:** No (but authenticated users get personalized sorting)
- **Rate limit:** 60 per 60s per IP

```typescript
interface ListGamesQuery {
  category?: GameCategory;
  difficulty?: Difficulty;
  tag?: string;
  search?: string;       // full-text search on title + description
  sort?: "popular" | "newest" | "rating" | "title";
  page?: number;         // default 1
  limit?: number;        // default 20, max 100
}

interface ListGamesResponse {
  data: Game[];
  meta: {
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `GAME_001` | Invalid query parameter |
| 429 | `GAME_002` | Rate limit exceeded |

**RLS:** `SELECT` on `games` where `games.is_active = true`.

---

### 3.2 GET `/games/:slug`

Get full details for a single game by its slug.

- **Method:** `GET`
- **URL:** `/games/:slug`
- **Auth required:** No
- **Rate limit:** 60 per 60s per IP

```typescript
interface GetGameParams {
  slug: string;
}

interface GetGameResponse {
  data: Game & {
    how_to_play: string; // Markdown
    controls: GameControl[];
    high_score_threshold: number;
  };
  error: null;
}

interface GameControl {
  input: string;
  action: string;
  description: string;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 404 | `GAME_010` | Game not found |

---

### 3.3 GET `/games/:slug/config`

Get the runtime configuration for a game, potentially personalized to the user's difficulty level.

- **Method:** `GET`
- **URL:** `/games/:slug/config`
- **Auth required:** No (defaults used for anon)
- **Rate limit:** 30 per 60s per IP

```typescript
interface GetGameConfigQuery {
  difficulty?: Difficulty;
  overrides?: string; // JSON-encoded key-value overrides for testing
}

interface GetGameConfigResponse {
  data: GameConfig;
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 404 | `GAME_020` | Game not found |
| 400 | `GAME_021` | Invalid override parameters |

---

### 3.4 POST `/games/:slug/calibration`

Submit calibration results to personalize game difficulty for the user.

- **Method:** `POST`
- **URL:** `/games/:slug/calibration`
- **Auth required:** Yes
- **Rate limit:** 5 per 3600s per user per game

```typescript
interface CalibrationResult {
  game_id: UUID;
  attempts: CalibrationAttempt[];
  completed_at: string;
}

interface CalibrationAttempt {
  trial_number: number;
  stimulus: string;
  response_time_ms: number;
  correct: boolean;
  difficulty_level: number; // 1-10
}

interface CalibrationResponse {
  data: {
    recommended_difficulty: Difficulty;
    recommended_config: Record<string, unknown>;
    calibration_version: number;
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `GAME_030` | Insufficient calibration attempts (min 5) |
| 400 | `GAME_031` | Invalid response times (must be 0 < t < 30000ms) |
| 401 | `GAME_032` | Not authenticated |

**RLS:** `INSERT` into `calibration_results` where `user_id = auth.uid()`.

---

## 4. Sessions API

A session represents a single play-through of a game. It captures start/end times, game events, scores, and metadata.

### Shared Types

```typescript
interface Session {
  id: UUID;
  user_id: UUID;
  game_id: UUID;
  game_slug: string;
  status: SessionStatus;
  mode: GameMode;
  difficulty: Difficulty;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  score: number | null;
  max_combo: number | null;
  accuracy: number | null; // 0.0 - 1.0
  events_count: number;
  completed: boolean;
  device_info: DeviceInfo;
  config_used: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

type SessionStatus = "created" | "active" | "paused" | "completed" | "abandoned";

interface DeviceInfo {
  platform: Platform;
  user_agent: string;
  screen_width: number;
  screen_height: number;
  dpr: number; // device pixel ratio
  connection_type: "wifi" | "cellular" | "ethernet" | "unknown";
}

interface GameEvent {
  timestamp_ms: number; // ms since session start
  type: string;         // game-specific event type
  data: Record<string, unknown>;
  score_delta: number;
  combo: number;
}
```

### 4.1 POST `/sessions`

Create a new game session.

- **Method:** `POST`
- **URL:** `/sessions`
- **Auth required:** Yes
- **Rate limit:** 30 per 60s per user

```typescript
interface CreateSessionRequest {
  game_slug: string;
  mode: GameMode;
  difficulty?: Difficulty;
  config_overrides?: Record<string, unknown>;
  device_info: DeviceInfo;
}

interface CreateSessionResponse {
  data: Session;
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `SESSION_001` | Invalid game_slug |
| 400 | `SESSION_002` | Too many active sessions (max 3) |
| 409 | `SESSION_003` | Active session already exists for this game |
| 429 | `SESSION_004` | Session creation rate limit |

**RLS:** `INSERT` into `sessions` where `user_id = auth.uid()`.

---

### 4.2 PATCH `/sessions/:id`

Update session metadata (pause/resume, update config).

- **Method:** `PATCH`
- **URL:** `/sessions/:id`
- **Auth required:** Yes
- **Rate limit:** 30 per 60s per user

```typescript
interface UpdateSessionRequest {
  status?: "paused" | "active";
  config_overrides?: Record<string, unknown>;
}

interface UpdateSessionResponse {
  data: Session;
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `SESSION_010` | Invalid status transition |
| 403 | `SESSION_011` | Session belongs to another user |
| 404 | `SESSION_012` | Session not found |

**RLS:** `UPDATE` on `sessions` where `user_id = auth.uid()`.

---

### 4.3 POST `/sessions/:id/complete`

Mark a session as completed and submit final scores.

- **Method:** `POST`
- **URL:** `/sessions/:id/complete`
- **Auth required:** Yes
- **Rate limit:** 10 per 60s per user

```typescript
interface CompleteSessionRequest {
  final_score: number;
  max_combo: number;
  accuracy: number;
  game_events: GameEvent[]; // full event log for server validation
  client_checksum: string; // SHA-256 of serialized events for tamper detection
}

interface CompleteSessionResponse {
  data: {
    session: Session;
    validation: {
      score_accepted: boolean;
      server_score: number;
      variance: number; // allowed ± variance
      anti_cheat_flags: string[];
    };
    xp_earned: number;
    level_up: boolean;
    new_level: number | null;
    achievements_unlocked: Achievement[];
    mission_progress: MissionProgressUpdate[];
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `SESSION_020` | Invalid or missing game events |
| 400 | `SESSION_021` | Checksum mismatch (possible tampering) |
| 403 | `SESSION_022` | Session belongs to another user |
| 409 | `SESSION_023` | Session already completed |
| 422 | `SESSION_024` | Score exceeds theoretical maximum |
| 429 | `SESSION_025` | Anti-cheat: suspiciously fast event submission |

**RLS:** `UPDATE` + `INSERT` (events) scoped to `user_id = auth.uid()`.

---

### 4.4 POST `/sessions/:id/events`

Bulk-submit game events during a session (called periodically or at end).

- **Method:** `POST`
- **URL:** `/sessions/:id/events`
- **Auth required:** Yes
- **Rate limit:** 20 per 60s per user

```typescript
interface SubmitEventsRequest {
  events: GameEvent[];
  batch_id: string; // client-generated UUID for idempotency
}

interface SubmitEventsResponse {
  data: {
    accepted: number;
    rejected: number;
    batch_id: string;
    server_time_ms: number;
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `SESSION_030` | Malformed event data |
| 400 | `SESSION_031` | Duplicate batch_id |
| 409 | `SESSION_032` | Session not in active state |

**RLS:** `INSERT` into `session_events` where session belongs to `auth.uid()`.

---

### 4.5 GET `/sessions/:id`

Get a single session with its events.

- **Method:** `GET`
- **URL:** `/sessions/:id`
- **Auth required:** Yes
- **Rate limit:** 60 per 60s per user

```typescript
interface GetSessionParams {
  id: UUID;
}

interface GetSessionResponse {
  data: Session & {
    events: GameEvent[];
    achievements_earned: Achievement[];
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 403 | `SESSION_040` | Access denied |
| 404 | `SESSION_041` | Session not found |

**RLS:** `SELECT` where `user_id = auth.uid()` OR session is in a public group leaderboard.

---

### 4.6 GET `/sessions/history`

Paginated list of the user's session history.

- **Method:** `GET`
- **URL:** `/sessions/history`
- **Auth required:** Yes
- **Rate limit:** 30 per 60s per user

```typescript
interface SessionHistoryQuery {
  game_slug?: string;
  status?: SessionStatus;
  from?: string; // ISO date
  to?: string;   // ISO date
  sort?: "newest" | "oldest" | "highest_score";
  page?: number;
  limit?: number; // default 20, max 100
}

interface SessionHistoryResponse {
  data: Session[];
  meta: PaginationMeta;
  error: null;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `SESSION_050` | Invalid date range |

**RLS:** `SELECT` where `user_id = auth.uid()`.

---

### 4.7 GET `/sessions/stats`

Aggregated statistics for the user.

- **Method:** `GET`
- **URL:** `/sessions/stats`
- **Auth required:** Yes
- **Rate limit:** 10 per 60s per user

```typescript
interface SessionStatsQuery {
  game_slug?: string;
  period?: "today" | "week" | "month" | "all_time";
}

interface SessionStatsResponse {
  data: {
    total_sessions: number;
    total_play_time_seconds: number;
    average_score: number;
    best_score: number;
    average_accuracy: number;
    average_duration_seconds: number;
    games_breakdown: {
      game_slug: string;
      sessions: number;
      best_score: number;
      avg_score: number;
    }[];
    daily_activity: {
      date: string;
      sessions: number;
      total_seconds: number;
    }[];
  };
  error: null;
}
```

**RLS:** Aggregated from `sessions` where `user_id = auth.uid()`.

---

## 5. Scores API

Scores power leaderboards and personal records. Scores are derived from completed sessions and cached in materialized views.

### Shared Types

```typescript
interface LeaderboardEntry {
  rank: number;
  user_id: UUID;
  display_name: string;
  avatar_url: string | null;
  score: number;
  level: number;
  country_code: string | null;
  achieved_at: string;
}

interface Score {
  id: UUID;
  user_id: UUID;
  game_slug: string;
  score: number;
  accuracy: number;
  duration_seconds: number;
  mode: GameMode;
  difficulty: Difficulty;
  achieved_at: string;
  session_id: UUID;
}
```

### 5.1 GET `/scores/leaderboard/:gameSlug`

Get the leaderboard for a specific game.

- **Method:** `GET`
- **URL:** `/scores/leaderboard/:gameSlug`
- **Auth required:** No
- **Rate limit:** 30 per 60s per IP

```typescript
interface LeaderboardQuery {
  mode?: GameMode;
  difficulty?: Difficulty;
  period?: "daily" | "weekly" | "monthly" | "all_time";
  country?: string; // ISO 3166-1 alpha-2
  around_me?: boolean; // return entries around the requesting user's rank
  page?: number;
  limit?: number; // default 50, max 200
}

interface LeaderboardResponse {
  data: LeaderboardEntry[];
  meta: {
    game_slug: string;
    period: string;
    total_players: number;
    user_rank?: LeaderboardEntry;
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 404 | `SCORE_001` | Game not found |
| 400 | `SCORE_002` | Invalid period |

**RLS:** Public read from materialized view `leaderboard_public`.

---

### 5.2 GET `/scores/records`

Get the authenticated user's personal records across all games.

- **Method:** `GET`
- **URL:** `/scores/records`
- **Auth required:** Yes
- **Rate limit:** 30 per 60s per user

```typescript
interface PersonalRecordsResponse {
  data: {
    game_slug: string;
    best_score: Score;
    best_accuracy: Score;
    best_duration: Score;
    total_sessions: number;
    first_played: string;
    last_played: string;
  }[];
  error: null;
}
```

**RLS:** Aggregated from `scores` where `user_id = auth.uid()`.

---

### 5.3 GET `/scores/history`

Detailed score history for the authenticated user.

- **Method:** `GET`
- **URL:** `/scores/history`
- **Auth required:** Yes
- **Rate limit:** 30 per 60s per user

```typescript
interface ScoreHistoryQuery {
  game_slug?: string;
  from?: string;
  to?: string;
  sort?: "newest" | "highest";
  page?: number;
  limit?: number;
}

interface ScoreHistoryResponse {
  data: Score[];
  meta: PaginationMeta;
  error: null;
}
```

---

### 5.4 POST `/scores/compare`

Compare scores between two users across games.

- **Method:** `POST`
- **URL:** `/scores/compare`
- **Auth required:** Yes
- **Rate limit:** 10 per 60s per user

```typescript
interface CompareRequest {
  other_user_id: UUID;
  game_slugs?: string[]; // specific games, or all if omitted
  period?: "week" | "month" | "all_time";
}

interface CompareResponse {
  data: {
    user: {
      id: UUID;
      display_name: string;
      avatar_url: string | null;
    };
    other: {
      id: UUID;
      display_name: string;
      avatar_url: string | null;
    };
    games: {
      game_slug: string;
      user_best: number;
      other_best: number;
      winner: "user" | "other" | "tie";
      user_sessions: number;
      other_sessions: number;
    }[];
    summary: {
      user_wins: number;
      other_wins: number;
      ties: number;
    };
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 404 | `SCORE_030` | Other user not found |
| 403 | `SCORE_031` | Other user's profile is private |

**RLS:** Reads from public leaderboard views; privacy check enforced in application layer.

---

## 6. Progression API

Progression tracks the user's level, XP, achievements, streaks, and unlocks.

### Shared Types

```typescript
interface Progression {
  user_id: UUID;
  level: number;
  xp: number;
  xp_to_next_level: number;
  xp_progress_percent: number;
  total_xp_earned: number;
  streak_days: number;
  longest_streak: number;
  streak_freezes_available: number;
  last_active_date: string;
}

interface Achievement {
  id: UUID;
  slug: string;
  title: string;
  description: string;
  icon_url: string;
  category: AchievementCategory;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  xp_reward: number;
  unlocked_at: string | null;
  progress: number; // 0.0 - 1.0
  max_progress: number;
  is_secret: boolean;
}

type AchievementCategory = "gameplay" | "streak" | "social" | "collection" | "mastery";

interface Unlock {
  id: UUID;
  type: "game_mode" | "difficulty" | "cosmetic" | "power_up";
  slug: string;
  title: string;
  description: string;
  unlocked_at: string;
  required_level?: number;
  required_achievement?: string;
}
```

### 6.1 GET `/progression/level`

Get the user's current level and XP breakdown.

- **Method:** `GET`
- **URL:** `/progression/level`
- **Auth required:** Yes
- **Rate limit:** 30 per 60s per user

```typescript
interface LevelResponse {
  data: Progression & {
    level_title: string; // e.g., "Focus Apprentice"
    level_perks: string[];
    recent_xp_gains: {
      source: string;
      amount: number;
      earned_at: string;
    }[];
  };
  error: null;
}
```

**RLS:** Reads from `progression` where `user_id = auth.uid()`.

---

### 6.2 GET `/progression/achievements`

List all achievements with the user's progress.

- **Method:** `GET`
- **URL:** `/progression/achievements`
- **Auth required:** Yes
- **Rate limit:** 20 per 60s per user

```typescript
interface AchievementsQuery {
  category?: AchievementCategory;
  rarity?: string;
  unlocked_only?: boolean;
  sort?: "rarity" | "progress" | "newest";
}

interface AchievementsResponse {
  data: Achievement[];
  meta: {
    total: number;
    unlocked: number;
    total_xp_from_achievements: number;
  };
  error: null;
}
```

**RLS:** `SELECT` from `achievements` (all) + `user_achievements` (where `user_id = auth.uid()`).

---

### 6.3 GET `/progression/streak`

Get detailed streak information.

- **Method:** `GET`
- **URL:** `/progression/streak`
- **Auth required:** Yes
- **Rate limit:** 20 per 60s per user

```typescript
interface StreakResponse {
  data: {
    current_streak: number;
    longest_streak: number;
    streak_freezes_available: number;
    streak_freezes_used: number;
    last_active_date: string;
    streak_calendar: {
      date: string;
      active: boolean;
      sessions_played: number;
    }[]; // last 30 days
    streak_milestones: {
      days: number;
      achieved: boolean;
      reward?: string;
    }[];
  };
  error: null;
}
```

**RLS:** Reads from `streaks` + `daily_activity` where `user_id = auth.uid()`.

---

### 6.4 GET `/progression/unlocks`

List all unlocks for the user.

- **Method:** `GET`
- **URL:** `/progression/unlocks`
- **Auth required:** Yes
- **Rate limit:** 20 per 60s per user

```typescript
interface UnlocksResponse {
  data: Unlock[];
  meta: {
    total: number;
    pending_unlocks: {
      type: string;
      slug: string;
      title: string;
      requirement: string;
      progress: number;
    }[];
  };
  error: null;
}
```

---

## 7. Missions API

Missions are time-bound objectives that encourage diverse gameplay and retention.

### Shared Types

```typescript
interface Mission {
  id: UUID;
  title: string;
  description: string;
  type: "daily" | "weekly" | "special" | "challenge";
  xp_reward: number;
  requirements: MissionRequirement[];
  starts_at: string;
  expires_at: string;
  icon_url: string;
}

interface MissionRequirement {
  type: "play_game" | "achieve_score" | "complete_sessions" | "use_feature" | "play_duration";
  target: number;
  current: number;
  game_slug?: string;
  params?: Record<string, unknown>;
}

interface MissionProgress {
  mission_id: UUID;
  user_id: UUID;
  status: "active" | "completed" | "expired";
  progress: MissionRequirement[];
  completed_at: string | null;
  claimed: boolean;
  claimed_at: string | null;
}

interface WeeklyChallenge {
  id: UUID;
  title: string;
  description: string;
  theme: string;
  missions: Mission[];
  starts_at: string;
  expires_at: string;
  completion_reward: {
    type: "xp" | "cosmetic" | "title";
    value: string | number;
  };
}
```

### 7.1 GET `/missions/daily`

Get today's daily missions for the user.

- **Method:** `GET`
- **URL:** `/missions/daily`
- **Auth required:** Yes
- **Rate limit:** 30 per 60s per user

```typescript
interface DailyMissionsResponse {
  data: {
    missions: (Mission & {
      progress: MissionProgress;
    })[];
    reset_at: string; // when daily missions refresh
    completed_today: number;
    total_today: number;
  };
  error: null;
}
```

**RLS:** `SELECT` from `missions` (active dailies) + `mission_progress` (where `user_id = auth.uid()`).

---

### 7.2 POST `/missions/:id/complete`

Mark a mission as complete and claim the reward.

- **Method:** `POST`
- **URL:** `/missions/:id/complete`
- **Auth required:** Yes
- **Rate limit:** 10 per 60s per user

```typescript
interface CompleteMissionResponse {
  data: {
    mission: Mission;
    xp_earned: number;
    level_up: boolean;
    new_level: number | null;
    achievements_unlocked: Achievement[];
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `MISSION_001` | Mission requirements not met |
| 400 | `MISSION_002` | Mission already completed |
| 404 | `MISSION_003` | Mission not found or expired |
| 409 | `MISSION_004` | Reward already claimed |

---

### 7.3 GET `/missions/weekly`

Get the current weekly challenge.

- **Method:** `GET`
- **URL:** `/missions/weekly`
- **Auth required:** Yes
- **Rate limit:** 20 per 60s per user

```typescript
interface WeeklyChallengeResponse {
  data: WeeklyChallenge & {
    user_progress: {
      missions_completed: number;
      total_missions: number;
      completion_percent: number;
      reward_claimed: boolean;
    };
  };
  error: null;
}
```

---

### 7.4 GET `/missions/progress`

Get overall mission progress summary.

- **Method:** `GET`
- **URL:** `/missions/progress`
- **Auth required:** Yes
- **Rate limit:** 20 per 60s per user

```typescript
interface MissionProgressSummaryResponse {
  data: {
    total_completed: number;
    total_active: number;
    total_xp_earned: number;
    streak_missions_completed: number;
    completion_rate: number; // 0.0 - 1.0
    recent_completions: {
      mission: Mission;
      completed_at: string;
    }[];
  };
  error: null;
}
```

---

## 8. Social API

Social features include friends, activity feeds, challenges, and groups.

### Shared Types

```typescript
interface Friend {
  user_id: UUID;
  display_name: string;
  avatar_url: string | null;
  level: number;
  status: "online" | "offline" | "in_game";
  last_active_at: string;
  added_at: string;
}

interface FriendRequest {
  id: UUID;
  from_user_id: UUID;
  from_display_name: string;
  from_avatar_url: string | null;
  to_user_id: UUID;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

interface ActivityFeedItem {
  id: UUID;
  user_id: UUID;
  display_name: string;
  avatar_url: string | null;
  type: ActivityType;
  data: Record<string, unknown>;
  created_at: string;
}

type ActivityType =
  | "achievement_unlocked"
  | "level_up"
  | "score_achieved"
  | "mission_completed"
  | "friend_added"
  | "challenge_completed"
  | "streak_milestone";

interface Group {
  id: UUID;
  name: string;
  description: string;
  avatar_url: string | null;
  member_count: number;
  max_members: number;
  created_by: UUID;
  visibility: "public" | "private";
  created_at: string;
}

interface GroupMembership {
  group_id: UUID;
  user_id: UUID;
  role: "owner" | "admin" | "member";
  joined_at: string;
}
```

### 8.1 GET `/social/friends`

Get the user's friends list.

- **Method:** `GET`
- **URL:** `/social/friends`
- **Auth required:** Yes
- **Rate limit:** 30 per 60s per user

```typescript
interface FriendsQuery {
  status?: "online" | "offline" | "all";
  search?: string;
  sort?: "name" | "level" | "recent";
}

interface FriendsResponse {
  data: Friend[];
  meta: {
    total: number;
    online_count: number;
  };
  error: null;
}
```

**RLS:** `SELECT` from `friendships` where `user_id = auth.uid()`.

---

### 8.2 POST `/social/friends/request`

Send a friend request.

- **Method:** `POST`
- **URL:** `/social/friends/request`
- **Auth required:** Yes
- **Rate limit:** 10 per 60s per user

```typescript
interface FriendRequestRequest {
  user_id: UUID;
}

interface FriendRequestResponse {
  data: FriendRequest;
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `SOCIAL_001` | Cannot friend yourself |
| 404 | `SOCIAL_002` | User not found |
| 409 | `SOCIAL_003` | Already friends or request pending |
| 429 | `SOCIAL_004` | Too many friend requests (max 20/day) |

---

### 8.3 POST `/social/friends/accept`

Accept a pending friend request.

- **Method:** `POST`
- **URL:** `/social/friends/accept`
- **Auth required:** Yes
- **Rate limit:** 30 per 60s per user

```typescript
interface AcceptFriendRequest {
  request_id: UUID;
}

interface AcceptFriendResponse {
  data: Friend;
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 404 | `SOCIAL_010` | Request not found |
| 403 | `SOCIAL_011` | Request not addressed to you |

---

### 8.4 DELETE `/social/friends/:userId`

Remove a friend.

- **Method:** `DELETE`
- **URL:** `/social/friends/:userId`
- **Auth required:** Yes
- **Rate limit:** 30 per 60s per user

```typescript
interface RemoveFriendResponse {
  data: {
    message: string;
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 404 | `SOCIAL_020` | Not friends with this user |

---

### 8.5 GET `/social/feed`

Get the activity feed (friends' recent activities).

- **Method:** `GET`
- **URL:** `/social/feed`
- **Auth required:** Yes
- **Rate limit:** 20 per 60s per user

```typescript
interface ActivityFeedQuery {
  type?: ActivityType;
  page?: number;
  limit?: number; // default 30, max 100
}

interface ActivityFeedResponse {
  data: ActivityFeedItem[];
  meta: PaginationMeta;
  error: null;
}
```

**RLS:** `SELECT` from `activity_feed` where actor is in user's friend list.

---

### 8.6 POST `/social/challenge`

Send a challenge to a friend.

- **Method:** `POST`
- **URL:** `/social/challenge`
- **Auth required:** Yes
- **Rate limit:** 10 per 60s per user

```typescript
interface ChallengeRequest {
  friend_user_id: UUID;
  game_slug: string;
  mode: GameMode;
  message?: string; // max 200 chars
  expires_in_hours?: number; // default 48, max 168
}

interface ChallengeResponse {
  data: {
    challenge_id: UUID;
    from_user: {
      id: UUID;
      display_name: string;
      avatar_url: string | null;
    };
    to_user: {
      id: UUID;
      display_name: string;
    };
    game_slug: string;
    message: string | null;
    expires_at: string;
    created_at: string;
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `SOCIAL_030` | Not friends with this user |
| 400 | `SOCIAL_031` | Invalid game_slug |
| 409 | `SOCIAL_032` | Active challenge already exists with this friend |

---

### 8.7 GET `/social/groups`

List groups the user belongs to or discover public groups.

- **Method:** `GET`
- **URL:** `/social/groups`
- **Auth required:** Yes
- **Rate limit:** 20 per 60s per user

```typescript
interface GroupsQuery {
  scope?: "my" | "discover";
  search?: string;
  page?: number;
  limit?: number;
}

interface GroupsResponse {
  data: Group[];
  meta: PaginationMeta;
  error: null;
}
```

---

### 8.8 POST `/social/groups`

Create a new group.

- **Method:** `POST`
- **URL:** `/social/groups`
- **Auth required:** Yes
- **Rate limit:** 5 per 3600s per user

```typescript
interface CreateGroupRequest {
  name: string; // 3-50 chars
  description: string; // max 500 chars
  visibility: "public" | "private";
  max_members?: number; // default 50, max 500
}

interface CreateGroupResponse {
  data: Group & { role: "owner" };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `SOCIAL_040` | Invalid group name |
| 409 | `SOCIAL_041` | Group name already taken |
| 429 | `SOCIAL_042` | Too many groups created |

---

### 8.9 GET `/social/groups/:id`

Get group details including members.

- **Method:** `GET`
- **URL:** `/social/groups/:id`
- **Auth required:** Yes (for private groups: membership required)
- **Rate limit:** 30 per 60s per user

```typescript
interface GetGroupResponse {
  data: Group & {
    members: {
      user_id: UUID;
      display_name: string;
      avatar_url: string | null;
      role: string;
      joined_at: string;
      level: number;
    }[];
    my_role: string;
    leaderboard: LeaderboardEntry[];
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 403 | `SOCIAL_050` | Private group, not a member |
| 404 | `SOCIAL_051` | Group not found |

---

### 8.10 GET `/social/groups/:id/leaderboard`

Get the group's leaderboard.

- **Method:** `GET`
- **URL:** `/social/groups/:id/leaderboard`
- **Auth required:** Yes
- **Rate limit:** 20 per 60s per user

```typescript
interface GroupLeaderboardQuery {
  period?: "weekly" | "monthly" | "all_time";
  game_slug?: string;
}

interface GroupLeaderboardResponse {
  data: {
    entries: LeaderboardEntry[];
    group_stats: {
      total_members: number;
      active_this_week: number;
      combined_score: number;
    };
  };
  error: null;
}
```

---

## 9. Sync API

Offline-first sync ensures data consistency across devices.

### Shared Types

```typescript
interface SyncPayload {
  last_synced_at: string;
  device_id: string;
  changes: SyncChange[];
}

interface SyncChange {
  table: string;
  operation: "INSERT" | "UPDATE" | "DELETE";
  record_id: UUID;
  data: Record<string, unknown>;
  client_timestamp: string;
  version: number;
}

interface SyncResponse {
  data: {
    server_time: string;
    accepted: number;
    rejected: number;
    conflicts: SyncConflict[];
    pull: SyncChange[]; // server-side changes to apply
  };
  error: null;
}

interface SyncConflict {
  table: string;
  record_id: UUID;
  client_version: SyncChange;
  server_version: SyncChange;
  resolution: "client_wins" | "server_wins" | "manual";
}
```

### 9.1 POST `/sync/push`

Push local changes to the server.

- **Method:** `POST`
- **URL:** `/sync/push`
- **Auth required:** Yes
- **Rate limit:** 60 per 60s per user

```typescript
interface SyncPushRequest {
  last_synced_at: string;
  device_id: string;
  changes: SyncChange[];
  checksum: string; // hash of all change IDs for integrity
}

interface SyncPushResponse {
  data: {
    server_time: string;
    accepted: number;
    rejected: number;
    conflicts: SyncConflict[];
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `SYNC_001` | Malformed sync payload |
| 400 | `SYNC_002` | Checksum mismatch |
| 409 | `SYNC_003` | Conflicts require resolution |
| 413 | `SYNC_004` | Payload too large (max 5MB) |
| 429 | `SYNC_005` | Sync rate limit exceeded |

**RLS:** All writes scoped to `user_id = auth.uid()`.

---

### 9.2 POST `/sync/pull`

Pull server changes since the given timestamp.

- **Method:** `POST`
- **URL:** `/sync/pull`
- **Auth required:** Yes
- **Rate limit:** 120 per 60s per user

```typescript
interface SyncPullRequest {
  last_synced_at: string;
  device_id: string;
  tables?: string[]; // specific tables, or all if omitted
}

interface SyncPullResponse {
  data: {
    server_time: string;
    changes: SyncChange[];
    has_more: boolean;
    next_cursor?: string;
  };
  error: null;
}
```

**RLS:** `SELECT` scoped to `user_id = auth.uid()`.

---

### 9.3 POST `/sync/conflict/resolve`

Resolve a sync conflict by choosing which version to keep.

- **Method:** `POST`
- **URL:** `/sync/conflict/resolve`
- **Auth required:** Yes
- **Rate limit:** 60 per 60s per user

```typescript
interface ResolveConflictRequest {
  conflict_id: string;
  resolution: "client_wins" | "server_wins";
  merged_data?: Record<string, unknown>; // optional manual merge
}

interface ResolveConflictResponse {
  data: {
    resolved: boolean;
    final_version: SyncChange;
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `SYNC_010` | Invalid resolution strategy |
| 404 | `SYNC_011` | Conflict not found or already resolved |

---

## 10. Admin API

Admin endpoints are restricted to users with the `admin` role. They are prefixed with `/admin` and require an elevated JWT claim verified at the middleware level.

### 10.1 GET `/admin/users`

List all users with filtering and pagination.

- **Method:** `GET`
- **URL:** `/admin/users`
- **Auth required:** Yes (admin only)
- **Rate limit:** 30 per 60s per admin

```typescript
interface AdminUsersQuery {
  search?: string; // email, display_name, or ID
  status?: "active" | "suspended" | "deleted";
  created_from?: string;
  created_to?: string;
  level_min?: number;
  level_max?: number;
  sort?: "created_at" | "last_active" | "level" | "total_score";
  page?: number;
  limit?: number;
}

interface AdminUsersResponse {
  data: {
    id: UUID;
    email: string;
    display_name: string;
    level: number;
    total_score: number;
    games_played: number;
    created_at: string;
    last_active_at: string;
    status: string;
    auth_provider: string;
  }[];
  meta: PaginationMeta;
  error: null;
}
```

**RLS:** Admin middleware bypasses RLS; direct query with service role key.

---

### 10.2 PATCH `/admin/users/:id`

Update a user's status or metadata.

- **Method:** `PATCH`
- **URL:** `/admin/users/:id`
- **Auth required:** Yes (admin only)
- **Rate limit:** 30 per 60s per admin

```typescript
interface AdminUpdateUserRequest {
  status?: "active" | "suspended";
  role?: "user" | "admin";
  display_name?: string;
  ban_reason?: string;
}

interface AdminUpdateUserResponse {
  data: {
    user_id: UUID;
    updated_fields: string[];
    updated_at: string;
  };
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `ADMIN_001` | Invalid status value |
| 403 | `ADMIN_002` | Cannot modify another admin |
| 404 | `ADMIN_003` | User not found |

---

### 10.3 GET `/admin/analytics`

Platform-wide analytics and metrics.

- **Method:** `GET`
- **URL:** `/admin/analytics`
- **Auth required:** Yes (admin only)
- **Rate limit:** 10 per 60s per admin

```typescript
interface AnalyticsQuery {
  metric: "dau" | "mau" | "sessions" | "retention" | "revenue" | "performance";
  from: string;
  to: string;
  granularity?: "hour" | "day" | "week" | "month";
  game_slug?: string;
  platform?: Platform;
  country?: string;
}

interface AnalyticsResponse {
  data: {
    metric: string;
    points: {
      timestamp: string;
      value: number;
    }[];
    summary: {
      total: number;
      average: number;
      min: number;
      max: number;
      trend: "up" | "down" | "flat";
      change_percent: number;
    };
  };
  error: null;
}
```

**RLS:** No RLS; service role access only.

---

### 10.4 GET `/admin/feature-flags`

List all feature flags.

- **Method:** `GET`
- **URL:** `/admin/feature-flags`
- **Auth required:** Yes (admin only)
- **Rate limit:** 20 per 60s per admin

```typescript
interface FeatureFlag {
  id: UUID;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rollout_percent: number; // 0-100
  target_groups: string[];
  target_platforms: Platform[];
  created_at: string;
  updated_at: string;
  created_by: UUID;
}

interface FeatureFlagsResponse {
  data: FeatureFlag[];
  error: null;
}
```

---

### 10.5 PATCH `/admin/feature-flags/:key`

Update a feature flag.

- **Method:** `PATCH`
- **URL:** `/admin/feature-flags/:key`
- **Auth required:** Yes (admin only)
- **Rate limit:** 20 per 60s per admin

```typescript
interface UpdateFeatureFlagRequest {
  enabled?: boolean;
  rollout_percent?: number;
  target_groups?: string[];
  target_platforms?: Platform[];
  description?: string;
}

interface UpdateFeatureFlagResponse {
  data: FeatureFlag;
  error: null;
}
```

**Error codes:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | `ADMIN_010` | Invalid rollout_percent |
| 404 | `ADMIN_011` | Feature flag not found |

---

### 10.6 GET `/admin/health`

Platform health check endpoint.

- **Method:** `GET`
- **URL:** `/admin/health`
- **Auth required:** Yes (admin only)
- **Rate limit:** 30 per 60s per admin

```typescript
interface HealthResponse {
  data: {
    status: "healthy" | "degraded" | "unhealthy";
    checks: {
      database: {
        status: "ok" | "error";
        latency_ms: number;
        connections: number;
      };
      cache: {
        status: "ok" | "error";
        hit_rate: number;
        latency_ms: number;
      };
      storage: {
        status: "ok" | "error";
        usage_bytes: number;
        limit_bytes: number;
      };
      auth: {
        status: "ok" | "error";
        latency_ms: number;
      };
      workers: {
        status: "ok" | "error";
        active: number;
        queued: number;
      };
    };
    version: string;
    uptime_seconds: number;
    last_deployment: string;
  };
  error: null;
}
```

---

## Appendix: Common TypeScript Types

```typescript
interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
  next_cursor?: string;
}

interface APIResponse<T> {
  data: T;
  error: null;
}

interface APIError {
  data: null;
  error: {
    code: string;
    message: string;
    details?: Record<string, string | number>;
    request_id: string; // for support correlation
  };
}

type APIResult<T> = APIResponse<T> | APIError;

interface RateLimitHeaders {
  "X-RateLimit-Limit": string;
  "X-RateLimit-Remaining": string;
  "X-RateLimit-Reset": string; // ISO timestamp
}
```

Every endpoint returns these headers when rate limiting is active. Clients should respect `X-RateLimit-Remaining` and back off before hitting zero. The `X-RateLimit-Reset` header indicates when the window resets.

All responses include a `X-Request-ID` header for tracing. When errors occur, this ID is also embedded in the error body for support ticket correlation. Production deployments enforce HTTPS-only and set `Strict-Transport-Security` with a one-year max-age.

---

## Summary of All Endpoints

| Method | URL | Auth | Rate (per 60s) |
|--------|-----|------|----------------|
| POST | /auth/signup | No | 5/IP |
| POST | /auth/login | No | 10/email |
| POST | /auth/magic-link | No | 3/email |
| POST | /auth/oauth/:provider | No | 10/IP |
| POST | /auth/logout | Yes | 30/user |
| GET | /auth/session | Yes | 60/user |
| POST | /auth/refresh | No | 30/token |
| POST | /auth/forgot-password | No | 3/email |
| POST | /auth/reset-password | No | 5/token |
| POST | /auth/verify-email | No | 5/token |
| POST | /auth/2fa/enable | Yes | 5/user |
| POST | /auth/2fa/verify | Cond. | 10/user |
| POST | /auth/2fa/disable | Yes | 3/user |
| GET | /profile | Yes | 60/user |
| PATCH | /profile | Yes | 10/user |
| DELETE | /profile | Yes | 1/3600s |
| GET | /profile/export | Yes | 1/3600s |
| GET | /profile/public/:userId | No | 30/IP |
| POST | /profile/avatar | Yes | 5/3600s |
| GET | /games | No | 60/IP |
| GET | /games/:slug | No | 60/IP |
| GET | /games/:slug/config | No | 30/IP |
| POST | /games/:slug/calibration | Yes | 5/3600s/game |
| POST | /sessions | Yes | 30/user |
| PATCH | /sessions/:id | Yes | 30/user |
| POST | /sessions/:id/complete | Yes | 10/user |
| POST | /sessions/:id/events | Yes | 20/user |
| GET | /sessions/:id | Yes | 60/user |
| GET | /sessions/history | Yes | 30/user |
| GET | /sessions/stats | Yes | 10/user |
| GET | /scores/leaderboard/:slug | No | 30/IP |
| GET | /scores/records | Yes | 30/user |
| GET | /scores/history | Yes | 30/user |
| POST | /scores/compare | Yes | 10/user |
| GET | /progression/level | Yes | 30/user |
| GET | /progression/achievements | Yes | 20/user |
| GET | /progression/streak | Yes | 20/user |
| GET | /progression/unlocks | Yes | 20/user |
| GET | /missions/daily | Yes | 30/user |
| POST | /missions/:id/complete | Yes | 10/user |
| GET | /missions/weekly | Yes | 20/user |
| GET | /missions/progress | Yes | 20/user |
| GET | /social/friends | Yes | 30/user |
| POST | /social/friends/request | Yes | 10/user |
| POST | /social/friends/accept | Yes | 30/user |
| DELETE | /social/friends/:userId | Yes | 30/user |
| GET | /social/feed | Yes | 20/user |
| POST | /social/challenge | Yes | 10/user |
| GET | /social/groups | Yes | 20/user |
| POST | /social/groups | Yes | 5/3600s |
| GET | /social/groups/:id | Yes | 30/user |
| GET | /social/groups/:id/leaderboard | Yes | 20/user |
| POST | /sync/push | Yes | 60/user |
| POST | /sync/pull | Yes | 120/user |
| POST | /sync/conflict/resolve | Yes | 60/user |
| GET | /admin/users | Admin | 30/admin |
| PATCH | /admin/users/:id | Admin | 30/admin |
| GET | /admin/analytics | Admin | 10/admin |
| GET | /admin/feature-flags | Admin | 20/admin |
| PATCH | /admin/feature-flags/:key | Admin | 20/admin |
| GET | /admin/health | Admin | 30/admin |
