# Chapter 26: Error Handling

## 1. Error Philosophy

Every error in the FOCUS Platform must satisfy three invariants: it has a **code**, a **human-readable message**, and a **recovery path**. Errors are not exceptional flow—they are a first-class feature of the system. The design distinguishes between two audiences. The **user-facing** layer presents friendly, actionable messages with clear recovery steps. The **developer-facing** layer carries the full diagnostic payload: error codes, stack traces, request IDs, server timestamps, and contextual metadata for debugging.

The guiding principles are:

- **Errors are data, not surprises.** Every error is a typed object that flows through the same pipelines as success responses. There is no throw-and-catch anywhere in the public API boundary; every handler returns an `APIResult<T>` discriminated union.
- **Recoverability is mandatory.** If an error cannot be automatically recovered, the client must present a human-readable explanation and a button or action to retry, contact support, or degrade gracefully.
- **Errors are observable.** Every error is logged to Sentry with a request ID, user ID, device ID, and feature flag context. Error budgets are tracked per endpoint and per error category.
- **Errors are safe.** Error messages must never leak secrets, stack traces, database schemas, or internal infrastructure details. User-facing messages are translated via i18n keys; developer messages are localized to English and sent only in API responses when the `X-Debug: true` header is present and the environment is non-production.

---

## 2. Error Classification

All errors fall into exactly one of ten categories. The category determines the HTTP status code range, the retry strategy, the user-facing treatment, and the monitoring alert level.

### 2.1 Validation Errors (HTTP 400)

Validation errors occur when the client sends data that does not conform to the expected schema. These are the most common class of errors and are always preventable by the client.

**Characteristics:**
- HTTP status: `400 Bad Request`
- Never retried automatically (the same invalid payload would fail again)
- User-facing message: "Please check your input and try again."
- Developer payload includes `details` map with field-level error descriptions
- Alert level: none (expected client behavior)

**Subcategories:**
- **Missing required field:** The request body is missing a mandatory property.
- **Type mismatch:** A property has the wrong type (e.g., string where number expected).
- **Constraint violation:** A value violates a min/max, pattern, or enum constraint.
- **Schema mismatch:** The entire body does not match the expected JSON structure.

**Example implementation:**

```typescript
interface ValidationError {
  code: string; // e.g., "VALIDATION_001"
  message: string; // "Request body validation failed"
  details: Record<string, string>; // { "email": "Invalid email format", "password": "Must be at least 8 characters" }
  category: "validation";
  http_status: 400;
}
```

### 2.2 Authentication Errors (HTTP 401)

Authentication errors indicate that the request lacks valid credentials or that the provided credentials have been rejected.

**Characteristics:**
- HTTP status: `401 Unauthorized`
- User-facing message varies by subcategory (see below)
- Automatically triggers token refresh attempt (for expired tokens)
- After 3 consecutive auth failures, the session is cleared and the user is redirected to login
- Alert level: warning if > 10% of requests for a user fail auth

**Subcategories and user messages:**
- `AUTH_010` – "Please log in to continue."
- `AUTH_011` – "Invalid email or password. Please try again."
- `AUTH_012` – "Please verify your email address first."
- `AUTH_013` – "Your account has been suspended. Contact support."
- `AUTH_050` – "Your session has expired. Please log in again."
- `AUTH_051` – "Your session has expired. Please log in again."
- `AUTH_112` – "Too many failed attempts. Please try again in 30 minutes."

### 2.3 Forbidden Errors (HTTP 403)

Forbidden errors indicate that the request is authenticated but the user lacks the necessary permissions to perform the action.

**Characteristics:**
- HTTP status: `403 Forbidden`
- User-facing message: "You don't have permission to do that."
- Never retried (permission will not change between retries)
- Alert level: info (logged for security auditing)

**Subcategories:**
- RLS policy denial: The user's row-level security policy prevents the operation.
- Role-based denial: The user's role (user, admin) does not permit the action.
- Resource ownership denial: The user does not own the resource they are trying to modify.
- Feature flag denial: The feature is not enabled for this user's cohort.

### 2.4 Not Found Errors (HTTP 404)

Not found errors indicate that the requested resource does not exist or is not accessible to the requesting user.

**Characteristics:**
- HTTP status: `404 Not Found`
- User-facing message: "We couldn't find what you're looking for."
- Never retried automatically
- Distinguished from 403 in production (404 leaks no existence information)
- Alert level: none

**Important security note:** When a resource exists but the user lacks access, the API returns 403, not 404. This prevents information leakage about resource existence. However, for public endpoints, a missing resource returns 404 regardless.

### 2.5 Conflict Errors (HTTP 409)

Conflict errors indicate that the requested operation conflicts with the current state of the resource.

**Characteristics:**
- HTTP status: `409 Conflict`
- User-facing message varies (see specific codes)
- May be retried after a brief delay (the conflicting state may have resolved)
- Alert level: none

**Common triggers:**
- Duplicate email on signup
- Display name already taken
- Session already completed
- Optimistic locking violation (version mismatch)
- Sync conflict (concurrent edits to the same record)

### 2.6 Rate Limit Errors (HTTP 429)

Rate limit errors indicate that the client has exceeded the allowed request quota.

**Characteristics:**
- HTTP status: `429 Too Many Requests`
- Response includes `Retry-After` header with seconds until the window resets
- Response includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers
- User-facing message: "You're doing that too often. Please wait a moment."
- Automatically retried with exponential backoff by the client SDK
- Alert level: warning if > 50% of requests for a user are rate-limited

**Rate limit tiers:**

| Tier | Window | Description |
|------|--------|-------------|
| Strict | 1/min | Account deletion, avatar upload, data export |
| Normal | 10-60/min | Standard CRUD operations |
| Relaxed | 120/min | Read-only endpoints, sync pull |
| Burst | 300/min | Health checks, internal monitoring |

### 2.7 Server Errors (HTTP 500/502/503/504)

Server errors indicate an internal failure in the FOCUS Platform infrastructure.

**Characteristics:**
- HTTP status: `500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable`, `504 Gateway Timeout`
- User-facing message: "Something went wrong on our end. We've been notified."
- Automatically retried with exponential backoff (max 5 retries)
- Alert level: critical (PagerDuty alert for 500; Slack for 502/503)
- Every 500 error is reported to Sentry with full context
- The `X-Request-ID` header is always included for support correlation

**Subcategories:**
- **500 Internal Server Error:** Unhandled exception in application code. The error boundary caught it, logged it to Sentry, and returned a safe response.
- **502 Bad Gateway:** The upstream service (Supabase, R2, Redis) returned an invalid response. The edge worker could not parse the response from the origin.
- **503 Service Unavailable:** A dependency is explicitly marked as down (circuit breaker open). The health check endpoint reports the status.
- **504 Gateway Timeout:** The upstream service took longer than 30 seconds to respond. Common during large data exports or analytics queries.

### 2.8 Network Errors

Network errors occur on the client side when the request cannot reach the server.

**Characteristics:**
- No HTTP status (the request never completed)
- User-facing message: "Unable to connect. Please check your internet connection."
- Automatically retried with exponential backoff
- If the client is offline, operations are queued for later sync
- Alert level: none (client-side)

**Detection:**
- `navigator.onLine` check before network requests
- `fetch` rejection handling (TypeError for network failures)
- WebSocket `onclose` with abnormal close code

### 2.9 Offline Errors

Offline errors are a special case of network errors where the client has detected it is not connected to the internet.

**Characteristics:**
- User-facing message: "You're offline. Changes will sync when you reconnect."
- No retry attempts (the client knows it will fail)
- Operations are queued in IndexedDB for later synchronization
- The offline indicator banner is displayed in the UI
- When connectivity is restored, queued operations are flushed with a visual progress indicator
- Alert level: none (expected behavior)

**Graceful degradation per feature:**
- **Gameplay:** Fully available offline. Scores are cached locally and synced on reconnect.
- **Leaderboards:** Show last-cached version with a "Last updated" timestamp.
- **Social features:** Read-only from cache. Sending messages/requests is queued.
- **Sync:** All sync operations are queued. Conflict resolution happens on next push.
- **Auth:** Login requires network. Session tokens are cached and valid offline until expiry.

### 2.10 Game-Specific Errors

Game-specific errors occur during gameplay and are distinct from API errors. They relate to the game engine, input handling, rendering, and calibration.

**Characteristics:**
- User-facing messages are embedded in the game canvas overlay
- Do not follow HTTP status conventions
- Game continues running if the error is recoverable
- Critical game errors pause the session and offer retry or abandon

**Common game errors:**
- `GAME_RENDER_001`: WebGL context lost. User message: "Graphics error. Reconnecting..."
- `GAME_INPUT_002`: Input device not responding. User message: "Input not detected. Tap to continue."
- `GAME_AUDIO_003`: Audio context suspended (browser autoplay policy). User message: "Tap to enable sound."
- `GAME_NETWORK_004`: Real-time sync disconnected during multiplayer. User message: "Connection lost. Reconnecting..."
- `GAME_PERF_005`: Frame rate dropped below threshold. User message: "Reducing graphics quality for smoother play."
- `GAME_CALIBRATION_006`: Calibration data corrupted. User message: "Recalibration needed. Starting calibration..."

---

## 3. Error Code System

Every error in the FOCUS Platform has a unique code composed of a **module prefix** and a **numeric suffix**. The prefix identifies the subsystem that generated the error; the suffix is a zero-padded three-digit number within that module.

**Format:** `MODULE_NNN` where `MODULE` is an uppercase alphabetic prefix and `NNN` is a three-digit number.

### Module Prefixes

| Prefix | Module | Description |
|--------|--------|-------------|
| `AUTH` | Authentication | Login, signup, OAuth, 2FA, session management |
| `PROFILE` | Profile | User profile CRUD, avatar, data export |
| `GAME` | Games | Game listing, configuration, calibration |
| `SESSION` | Sessions | Game session lifecycle, events, scoring |
| `SCORE` | Scores | Leaderboards, personal records, comparisons |
| `PROGRESSION` | Progression | Levels, XP, achievements, streaks, unlocks |
| `MISSION` | Missions | Daily missions, weekly challenges |
| `SOCIAL` | Social | Friends, groups, challenges, activity feed |
| `SYNC` | Sync | Offline sync, push/pull, conflict resolution |
| `ADMIN` | Admin | Admin panel, analytics, feature flags |
| `VALIDATION` | Validation | Input validation, schema validation |
| `NETWORK` | Network | Client-side network errors |
| `GAME_RENDER` | Game Rendering | WebGL, Canvas, graphics pipeline |
| `GAME_INPUT` | Game Input | Touch, keyboard, gamepad input |
| `GAME_AUDIO` | Game Audio | Sound engine, audio context |
| `GAME_PERF` | Game Performance | Frame rate, memory, CPU throttling |
| `PAYMENT` | Payment | Premium subscriptions, in-app purchases (reserved) |

### Complete Error Code Registry

#### Authentication Codes (AUTH_)

| Code | HTTP | Message | User-Facing | Retryable |
|------|------|---------|-------------|-----------|
| `AUTH_001` | 400 | Invalid email format | "Please enter a valid email address." | No |
| `AUTH_002` | 400 | Password too weak | "Password must be at least 8 characters with uppercase, lowercase, number, and symbol." | No |
| `AUTH_003` | 400 | Password confirmation mismatch | "Passwords do not match." | No |
| `AUTH_004` | 409 | Email already registered | "An account with this email already exists. Try logging in instead." | No |
| `AUTH_005` | 429 | Too many signup attempts | "Too many attempts. Please try again later." | Yes (backoff) |
| `AUTH_006` | 500 | Email provider unreachable | "We couldn't send the verification email. Please try again." | Yes |
| `AUTH_010` | 400 | Missing required field | "Please fill in all required fields." | No |
| `AUTH_011` | 401 | Invalid email or password | "Invalid email or password. Please try again." | No |
| `AUTH_012` | 401 | Email not confirmed | "Please verify your email before logging in." | No |
| `AUTH_013` | 401 | Account suspended | "Your account has been suspended. Contact support@focusgame.app." | No |
| `AUTH_014` | 429 | Too many login attempts | "Too many failed attempts. Account locked for 15 minutes." | Yes (wait) |
| `AUTH_015` | 500 | Auth service unavailable | "Login service is temporarily unavailable. Please try again." | Yes |
| `AUTH_020` | 400 | Invalid email for magic link | "Please enter a valid email address." | No |
| `AUTH_021` | 429 | Too many magic link requests | "Please wait before requesting another link." | Yes (backoff) |
| `AUTH_022` | 500 | Magic link email failed | "We couldn't send the magic link. Please try again." | Yes |
| `AUTH_030` | 400 | Unsupported OAuth provider | "This login method is not available." | No |
| `AUTH_031` | 400 | Invalid OAuth redirect domain | "Invalid redirect URL." | No |
| `AUTH_032` | 500 | OAuth provider configuration error | "Login with this provider is temporarily unavailable." | Yes |
| `AUTH_040` | 401 | Token expired during logout | "Session expired. You have been logged out." | No |
| `AUTH_041` | 500 | Failed to revoke session | "Logout failed. Please try again." | Yes |
| `AUTH_050` | 401 | No active session | "Please log in to continue." | No |
| `AUTH_051` | 401 | Token expired | "Your session has expired. Please log in again." | Yes (refresh) |
| `AUTH_060` | 401 | Invalid refresh token | "Session expired. Please log in again." | No |
| `AUTH_061` | 401 | Refresh token revoked | "Session expired. Please log in again." | No |
| `AUTH_062` | 429 | Too many refresh attempts | "Too many requests. Please wait." | Yes (backoff) |
| `AUTH_070` | 400 | Invalid email for reset | "Please enter a valid email address." | No |
| `AUTH_071` | 429 | Too many reset requests | "Please wait before requesting another reset." | Yes (backoff) |
| `AUTH_072` | 500 | Reset email failed | "We couldn't send the reset email. Please try again." | Yes |
| `AUTH_080` | 400 | Passwords do not match | "Passwords do not match." | No |
| `AUTH_081` | 400 | New password too weak | "Password must meet security requirements." | No |
| `AUTH_082` | 400 | Invalid reset token | "Reset link expired or invalid. Request a new one." | No |
| `AUTH_083` | 429 | Too many reset attempts | "Too many attempts. Please try again later." | Yes (backoff) |
| `AUTH_090` | 400 | Invalid verification token | "Verification link expired. We've sent a new one." | No |
| `AUTH_091` | 400 | Token already used | "This link has already been used." | No |
| `AUTH_092` | 500 | Email verification failed | "Verification failed. Please try again." | Yes |
| `AUTH_100` | 400 | 2FA already enabled | "Two-factor authentication is already enabled." | No |
| `AUTH_101` | 401 | Incorrect password for 2FA setup | "Incorrect password." | No |
| `AUTH_102` | 401 | 2FA setup token expired | "Please start 2FA setup again." | No |
| `AUTH_110` | 400 | Invalid 2FA code | "Incorrect code. Please try again." | No |
| `AUTH_111` | 400 | 2FA code expired | "Code expired. Please enter a new one." | No |
| `AUTH_112` | 401 | 2FA locked after failures | "Too many failed attempts. 2FA locked for 30 minutes." | Yes (wait) |
| `AUTH_113` | 401 | Interim token invalid | "Please start the login process again." | No |
| `AUTH_120` | 400 | 2FA not enabled | "Two-factor authentication is not enabled." | No |
| `AUTH_121` | 401 | Incorrect credentials for 2FA disable | "Incorrect password or code." | No |
| `AUTH_122` | 429 | Too many disable attempts | "Please wait before trying again." | Yes (backoff) |

#### Profile Codes (PROFILE_)

| Code | HTTP | Message | User-Facing | Retryable |
|------|------|---------|-------------|-----------|
| `PROFILE_001` | 404 | Profile not found | "Profile not found. Please contact support." | No |
| `PROFILE_010` | 400 | Invalid display name | "Display name can only contain letters, numbers, and spaces." | No |
| `PROFILE_011` | 400 | Bio too long | "Bio must be 500 characters or fewer." | No |
| `PROFILE_012` | 409 | Display name taken | "This display name is already in use." | No |
| `PROFILE_020` | 400 | Delete confirmation mismatch | "Please type 'DELETE MY ACCOUNT' to confirm." | No |
| `PROFILE_021` | 401 | Incorrect password for deletion | "Incorrect password." | No |
| `PROFILE_030` | 401 | Not authenticated for export | "Please log in to export your data." | No |
| `PROFILE_031` | 429 | Export already in progress | "Data export is already in progress. Check your email." | No |
| `PROFILE_040` | 404 | User not found | "User not found." | No |
| `PROFILE_041` | 403 | Profile is private | "This profile is set to private." | No |
| `PROFILE_050` | 400 | Avatar file too large | "Image must be under 5MB." | No |
| `PROFILE_051` | 400 | Unsupported avatar type | "Please upload a JPEG, PNG, or WebP image." | No |
| `PROFILE_052` | 413 | Invalid image dimensions | "Image must be between 64×64 and 4096×4096 pixels." | No |
| `PROFILE_053` | 500 | Image processing failed | "We couldn't process your image. Please try another." | Yes |

#### Game Codes (GAME_)

| Code | HTTP | Message | User-Facing | Retryable |
|------|------|---------|-------------|-----------|
| `GAME_001` | 400 | Invalid query parameter | "Invalid filter. Please try again." | No |
| `GAME_002` | 429 | Rate limit exceeded | "Please wait before browsing more games." | Yes (backoff) |
| `GAME_010` | 404 | Game not found | "This game is no longer available." | No |
| `GAME_020` | 404 | Game config not found | "Game configuration unavailable." | Yes |
| `GAME_021` | 400 | Invalid config overrides | "Invalid game settings." | No |
| `GAME_030` | 400 | Insufficient calibration attempts | "Please complete at least 5 calibration trials." | No |
| `GAME_031` | 400 | Invalid response times | "Calibration data contains invalid values." | No |
| `GAME_032` | 401 | Not authenticated for calibration | "Please log in to save calibration data." | No |

#### Session Codes (SESSION_)

| Code | HTTP | Message | User-Facing | Retryable |
|------|------|---------|-------------|-----------|
| `SESSION_001` | 400 | Invalid game slug | "Could not start game. Invalid game reference." | No |
| `SESSION_002` | 400 | Too many active sessions | "You have too many games running. Finish one first." | No |
| `SESSION_003` | 409 | Active session exists for game | "You already have an active game. Resume or quit it first." | No |
| `SESSION_004` | 429 | Session creation rate limit | "Please wait before starting a new game." | Yes (backoff) |
| `SESSION_010` | 400 | Invalid status transition | "Cannot change game state at this time." | No |
| `SESSION_011` | 403 | Session belongs to another user | "This game session doesn't belong to you." | No |
| `SESSION_012` | 404 | Session not found | "Game session not found." | No |
| `SESSION_020` | 400 | Invalid game events | "Game data is corrupted. Score not saved." | No |
| `SESSION_021` | 400 | Checksum mismatch | "Game data integrity check failed." | No |
| `SESSION_022` | 403 | Session ownership violation | "Cannot submit score for another user's session." | No |
| `SESSION_023` | 409 | Session already completed | "This game session has already been completed." | No |
| `SESSION_024` | 422 | Score exceeds maximum | "Score validation failed. Please contact support." | No |
| `SESSION_025` | 429 | Anti-cheat violation | "Suspicious activity detected. Score held for review." | No |
| `SESSION_030` | 400 | Malformed event data | "Game event data is invalid." | No |
| `SESSION_031` | 400 | Duplicate batch ID | "This event batch was already submitted." | No |
| `SESSION_032` | 409 | Session not active | "Game session is not in progress." | No |
| `SESSION_040` | 403 | Access denied to session | "You don't have access to this session." | No |
| `SESSION_041` | 404 | Session not found | "Game session not found." | No |
| `SESSION_050` | 400 | Invalid date range | "Please select a valid date range." | No |

#### Score Codes (SCORE_)

| Code | HTTP | Message | User-Facing | Retryable |
|------|------|---------|-------------|-----------|
| `SCORE_001` | 404 | Game not found for leaderboard | "Leaderboard unavailable for this game." | No |
| `SCORE_002` | 400 | Invalid leaderboard period | "Invalid time period selected." | No |
| `SCORE_030` | 404 | Comparison target not found | "User not found." | No |
| `SCORE_031` | 403 | Target profile is private | "Cannot compare with a private profile." | No |

#### Mission Codes (MISSION_)

| Code | HTTP | Message | User-Facing | Retryable |
|------|------|---------|-------------|-----------|
| `MISSION_001` | 400 | Mission requirements not met | "You haven't completed the mission objectives yet." | No |
| `MISSION_002` | 400 | Mission already completed | "You've already completed this mission." | No |
| `MISSION_003` | 404 | Mission not found or expired | "This mission is no longer available." | No |
| `MISSION_004` | 409 | Reward already claimed | "You've already claimed this reward." | No |

#### Social Codes (SOCIAL_)

| Code | HTTP | Message | User-Facing | Retryable |
|------|------|---------|-------------|-----------|
| `SOCIAL_001` | 400 | Cannot friend yourself | "You can't add yourself as a friend." | No |
| `SOCIAL_002` | 404 | User not found | "User not found." | No |
| `SOCIAL_003` | 409 | Already friends or pending | "You're already friends or have a pending request." | No |
| `SOCIAL_004` | 429 | Friend request rate limit | "You've sent too many friend requests today." | Yes (backoff) |
| `SOCIAL_010` | 404 | Friend request not found | "This friend request no longer exists." | No |
| `SOCIAL_011` | 403 | Request not for you | "You can't accept this friend request." | No |
| `SOCIAL_020` | 404 | Not friends | "You're not friends with this user." | No |
| `SOCIAL_030` | 400 | Not friends for challenge | "You can only challenge friends." | No |
| `SOCIAL_031` | 400 | Invalid game for challenge | "This game doesn't support challenges." | No |
| `SOCIAL_032` | 409 | Active challenge exists | "You already have an active challenge with this friend." | No |
| `SOCIAL_040` | 400 | Invalid group name | "Group name must be 3-50 characters." | No |
| `SOCIAL_041` | 409 | Group name taken | "This group name is already taken." | No |
| `SOCIAL_042` | 429 | Too many groups created | "You've created too many groups. Try again later." | Yes (backoff) |
| `SOCIAL_050` | 403 | Private group access denied | "This is a private group." | No |
| `SOCIAL_051` | 404 | Group not found | "Group not found." | No |

#### Sync Codes (SYNC_)

| Code | HTTP | Message | User-Facing | Retryable |
|------|------|---------|-------------|-----------|
| `SYNC_001` | 400 | Malformed sync payload | "Sync data is corrupted." | No |
| `SYNC_002` | 400 | Checksum mismatch | "Sync integrity check failed." | Yes |
| `SYNC_003` | 409 | Sync conflicts | "Some changes conflict. Please resolve them." | No (manual) |
| `SYNC_004` | 413 | Sync payload too large | "Too much data to sync at once." | No |
| `SYNC_005` | 429 | Sync rate limit | "Syncing too frequently. Please wait." | Yes (backoff) |
| `SYNC_010` | 400 | Invalid conflict resolution | "Invalid resolution choice." | No |
| `SYNC_011` | 404 | Conflict not found | "Conflict already resolved." | No |

#### Admin Codes (ADMIN_)

| Code | HTTP | Message | User-Facing | Retryable |
|------|------|---------|-------------|-----------|
| `ADMIN_001` | 400 | Invalid status value | "Invalid user status." | No |
| `ADMIN_002` | 403 | Cannot modify admin | "Cannot modify another admin's account." | No |
| `ADMIN_003` | 404 | User not found | "User not found." | No |
| `ADMIN_010` | 400 | Invalid rollout percent | "Rollout percent must be 0-100." | No |
| `ADMIN_011` | 404 | Feature flag not found | "Feature flag not found." | No |

#### Validation Codes (VALIDATION_)

| Code | HTTP | Message | User-Facing | Retryable |
|------|------|---------|-------------|-----------|
| `VALIDATION_001` | 400 | Request body parse error | "Invalid request format." | No |
| `VALIDATION_002` | 400 | Missing Content-Type | "Invalid request headers." | No |
| `VALIDATION_003` | 400 | Request body too large | "Request is too large." | No |
| `VALIDATION_004` | 400 | Invalid JSON | "Request contains invalid JSON." | No |
| `VALIDATION_005` | 400 | Unknown field in body | "Request contains unexpected fields." | No |

#### Game Rendering Codes (GAME_RENDER_)

| Code | Code | Message | User-Facing | Retryable |
|------|------|---------|-------------|-----------|
| `GAME_RENDER_001` | — | WebGL context lost | "Graphics error. Reconnecting..." | Yes (auto) |
| `GAME_RENDER_002` | — | Shader compilation failed | "Graphics not supported. Trying fallback..." | Yes (fallback) |
| `GAME_RENDER_003` | — | Texture memory exceeded | "Reducing graphics quality..." | Yes (degrade) |

#### Game Input Codes (GAME_INPUT_)

| Code | Code | Message | User-Facing | Retryable |
|------|------|---------|-------------|-----------|
| `GAME_INPUT_001` | — | No input device detected | "No controller found. Using touch/keyboard." | No |
| `GAME_INPUT_002` | — | Input device unresponsive | "Input not responding. Tap to continue." | Yes (tap) |
| `GAME_INPUT_003` | — | Invalid input binding | "Input configuration error." | No |

#### Game Audio Codes (GAME_AUDIO_)

| Code | Code | Message | User-Facing | Retryable |
|------|------|---------|-------------|-----------|
| `GAME_AUDIO_001` | — | Audio context suspended | "Tap to enable sound." | Yes (tap) |
| `GAME_AUDIO_002` | — | Audio decode failed | "Sound file corrupted. Continuing without audio." | No (skip) |
| `GAME_AUDIO_003` | — | Audio buffer overflow | "Audio buffer full. Brief silence." | Yes (auto) |

#### Game Performance Codes (GAME_PERF_)

| Code | Code | Message | User-Facing | Retryable |
|------|------|---------|-------------|-----------|
| `GAME_PERF_001` | — | Frame rate below threshold | "Reducing graphics for smoother play." | Yes (degrade) |
| `GAME_PERF_002` | — | Memory pressure | "Low memory. Closing background processes." | Yes (cleanup) |
| `GAME_PERF_003` | — | CPU throttling detected | "Device is warm. Performance may be reduced." | No (info) |

---

## 4. Error Boundary Architecture

The FOCUS Platform uses a layered error boundary system built on React's `componentDidCatch` and `getDerivedStateFromError` APIs. Each layer catches errors at a different scope and provides appropriate fallback UI.

### 4.1 Route-Level Error Boundaries

Every top-level route (`/play`, `/leaderboard`, `/profile`, `/social`, `/settings`) is wrapped in a `RouteErrorBoundary` component. This is the outermost boundary and catches errors that escape all child boundaries.

```typescript
interface RouteErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  eventId: string | null; // Sentry event ID for support reference
}

class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode; route: string },
  RouteErrorBoundaryState
> {
  static getDerivedStateFromError(error: Error): Partial<RouteErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Report to Sentry with route context
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        route: this.props.route,
        error_boundary: "route",
      },
    });

    this.setState({ eventId });

    // Log to error monitoring service
    console.error(`[RouteErrorBoundary] ${this.props.route}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          eventId={this.state.eventId}
          route={this.props.route}
          onRetry={() => window.location.reload()}
          onGoHome={() => window.location.href = "/"}
        />
      );
    }
    return this.props.children;
  }
}
```

**Fallback UI:** A full-page error screen with:
- A friendly illustration (not a crash icon)
- "Something went wrong" heading
- The error message (if user-safe) or a generic message
- A "Try Again" button (reloads the route)
- A "Go Home" button
- The error reference ID (for support tickets)
- A "Report Issue" link that pre-fills a GitHub issue with the event ID

### 4.2 Game-Specific Error Boundaries

Each game has its own `GameErrorBoundary` that wraps the game canvas and HUD. Game errors are more recoverable than route errors because the game engine has internal state recovery mechanisms.

```typescript
interface GameErrorBoundaryProps {
  gameSlug: string;
  sessionId: string;
  onError: (error: GameError) => void;
  onRecover: () => void;
  children: React.ReactNode;
}

interface GameErrorBoundaryState {
  hasError: boolean;
  error: GameError | null;
  recoveryAttempts: number;
  canRecover: boolean;
}

interface GameError {
  code: string;
  message: string;
  severity: "warning" | "error" | "critical";
  recoverable: boolean;
  context?: Record<string, unknown>;
}

class GameErrorBoundary extends React.Component<
  GameErrorBoundaryProps,
  GameErrorBoundaryState
> {
  private static MAX_RECOVERY_ATTEMPTS = 3;

  static getDerivedStateFromError(error: Error): Partial<GameErrorBoundaryState> {
    const gameError: GameError = {
      code: "GAME_RENDER_001",
      message: error.message,
      severity: "error",
      recoverable: true,
    };
    return { hasError: true, error: gameError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report to Sentry with game context
    Sentry.captureException(error, {
      tags: {
        game: this.props.gameSlug,
        session: this.props.sessionId,
        error_boundary: "game",
      },
      extra: {
        componentStack: errorInfo.componentStack,
        recoveryAttempts: this.state.recoveryAttempts,
      },
    });

    this.props.onError(this.state.error!);

    // Auto-recover for recoverable errors
    if (this.state.error!.recoverable && this.state.recoveryAttempts < GameErrorBoundary.MAX_RECOVERY_ATTEMPTS) {
      setTimeout(() => {
        this.setState((prev) => ({
          hasError: false,
          error: null,
          recoveryAttempts: prev.recoveryAttempts + 1,
        }));
        this.props.onRecover();
      }, 1000 * Math.pow(2, this.state.recoveryAttempts));
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.state.recoveryAttempts >= GameErrorBoundary.MAX_RECOVERY_ATTEMPTS) {
        return (
          <GameErrorFallback
            error={this.state.error}
            gameSlug={this.props.gameSlug}
            onRetry={() => {
              this.setState({ hasError: false, error: null, recoveryAttempts: 0 });
              this.props.onRecover();
            }}
            onAbandon={() => {
              // Navigate back to game selection
              window.location.href = "/play";
            }}
          />
        );
      }

      return (
        <GameRecoveryOverlay
          error={this.state.error}
          attempt={this.state.recoveryAttempts}
          maxAttempts={GameErrorBoundary.MAX_RECOVERY_ATTEMPTS}
        />
      );
    }
    return this.props.children;
  }
}
```

**Game error severity levels:**
- **warning:** Non-critical issue. Game continues. Overlay message for 3 seconds.
- **error:** Game temporarily paused. Auto-recovery attempted. User can manually retry.
- **critical:** Game cannot continue. User is offered retry or abandon. Session is saved.

### 4.3 Graceful Degradation

When non-critical subsystems fail, the UI degrades gracefully rather than showing an error screen.

**Degradation matrix:**

| Subsystem | Failure | Degradation |
|-----------|---------|-------------|
| Leaderboard service | 500 | Show cached leaderboard with "Updated X minutes ago" |
| Achievement service | 500 | Hide achievement badges; gameplay unaffected |
| Social feed | 500 | Show "Feed unavailable" placeholder; other features work |
| Avatar CDN | timeout | Show default avatar with initials |
| Analytics | failure | Continue without analytics; errors logged to console |
| Feature flags | failure | Use default flag values (all flags off) |
| Sync service | failure | Queue changes; show offline indicator |
| Auth refresh | failure | Redirect to login after access token expires |

### 4.4 Sentry Reporting Strategy

All errors are reported to Sentry with structured context. The reporting pipeline:

1. **Capture:** Error is caught by the nearest error boundary or global handler.
2. **Enrich:** The error is tagged with user context (user ID, level, device), feature flags, route, game session ID, and performance metrics.
3. **Fingerprint:** Errors are fingerprinted by code + route + user agent to group related issues.
4. **Sample:** 100% of critical errors, 25% of warning errors, 1% of info events are sent to Sentry.
5. **Alert:** PagerDuty integration for 5xx spikes; Slack integration for error rate thresholds; email digest for new issues.

```typescript
// Sentry configuration
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  replaysSessionSampleRate: 0.01, // 1% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ["api.focusgame.app"],
    }),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  beforeSend(event) {
    // Strip PII from error reports
    if (event.request?.headers) {
      delete event.request.headers["Authorization"];
    }
    return event;
  },
});
```

---

## 5. Global Error Handler

The global error handler catches errors that escape the React component tree and errors from asynchronous code that are not caught by any boundary.

### 5.1 Unhandled Promise Rejection Handler

```typescript
window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
  const reason = event.reason;

  // Classify the error
  const classified = classifyError(reason);

  // Report to Sentry
  Sentry.captureException(reason, {
    tags: {
      handler: "unhandled_rejection",
      classification: classified.category,
    },
    extra: {
      promise: event.promise?.toString(),
      is_online: navigator.onLine,
    },
  });

  // Show user-facing notification for critical errors
  if (classified.severity === "critical") {
    showErrorNotification({
      title: "Unexpected error",
      message: "Something went wrong. Your progress has been saved.",
      action: { label: "Report", onClick: () => openErrorReport(classified) },
    });
  }

  // Prevent the default browser behavior (console error)
  event.preventDefault();
});
```

### 5.2 Window Error Handler

```typescript
window.addEventListener("error", (event: ErrorEvent) => {
  // Ignore errors from browser extensions
  if (event.filename?.includes("extension://")) return;

  // Ignore ResizeObserver loop errors (browser quirk)
  if (event.message?.includes("ResizeObserver")) return;

  const classified = classifyError(event.error || new Error(event.message));

  Sentry.captureException(classified.originalError, {
    tags: {
      handler: "window_error",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    },
  });

  if (classified.severity === "critical") {
    showErrorNotification({
      title: "Something went wrong",
      message: "Please refresh the page if this continues.",
      action: { label: "Refresh", onClick: () => window.location.reload() },
    });
  }
});
```

### 5.3 React Boundary Handler (Top-Level)

```typescript
// App.tsx
function App() {
  return (
    <RouteErrorBoundary route="root">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/play" element={
                <RouteErrorBoundary route="play">
                  <PlayPage />
                </RouteErrorBoundary>
              } />
              <Route path="/leaderboard" element={
                <RouteErrorBoundary route="leaderboard">
                  <LeaderboardPage />
                </RouteErrorBoundary>
              } />
              {/* ... other routes ... */}
            </Routes>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </RouteErrorBoundary>
  );
}
```

### 5.4 Network Request Interceptor

The API client wraps `fetch` with an interceptor that handles common network-level errors.

```typescript
async function apiRequest<T>(url: string, options: RequestInit): Promise<APIResult<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": crypto.randomUUID(),
        "X-Client-Version": CLIENT_VERSION,
        "X-Platform": PLATFORM,
        ...options.headers,
      },
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After") || "60", 10);
      return {
        data: null,
        error: {
          code: "RATE_LIMITED",
          message: `Rate limited. Retry after ${retryAfter} seconds.`,
          category: "rate_limit",
          retry_after: retryAfter,
          request_id: response.headers.get("X-Request-ID") || "",
        },
      };
    }

    // Handle server errors with retry logic
    if (response.status >= 500) {
      const body = await response.json().catch(() => null);
      return {
        data: null,
        error: {
          code: body?.error?.code || "SERVER_ERROR",
          message: "Server error. Please try again.",
          category: "server",
          http_status: response.status,
          request_id: response.headers.get("X-Request-ID") || "",
        },
      };
    }

    // Parse successful responses
    if (response.ok) {
      const body = await response.json();
      return { data: body.data, error: null };
    }

    // Handle client errors
    const body = await response.json();
    return {
      data: null,
      error: {
        code: body.error?.code || "UNKNOWN_ERROR",
        message: body.error?.message || "An unexpected error occurred.",
        details: body.error?.details,
        category: classifyHttpStatus(response.status),
        http_status: response.status,
        request_id: response.headers.get("X-Request-ID") || "",
      },
    };
  } catch (error) {
    // Network-level errors (fetch rejection)
    if (!navigator.onLine) {
      return {
        data: null,
        error: {
          code: "NETWORK_OFFLINE",
          message: "You're offline. Changes will sync when you reconnect.",
          category: "offline",
          request_id: "",
        },
      };
    }

    return {
      data: null,
      error: {
        code: "NETWORK_ERROR",
        message: "Unable to connect. Please check your internet connection.",
        category: "network",
        request_id: "",
        original_error: error,
      },
    };
  }
}
```

### 5.5 Auth Interceptor

The auth interceptor handles token refresh and session management transparently.

```typescript
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

function processQueue(error: Error | null, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
}

async function authInterceptor<T>(request: () => Promise<APIResult<T>>): Promise<APIResult<T>> {
  const result = await request();

  if (result.error?.http_status === 401) {
    // Token expired - attempt refresh
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          // No refresh token - redirect to login
          clearAuth();
          window.location.href = "/login?reason=session_expired";
          return result;
        }

        const refreshResult = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResult.ok) {
          const { access_token, refresh_token } = await refreshResult.json();
          setAccessToken(access_token);
          setRefreshToken(refresh_token);
          processQueue(null, access_token);

          // Retry the original request with the new token
          isRefreshing = false;
          return await request();
        } else {
          // Refresh failed - redirect to login
          processQueue(new Error("Session expired"), null);
          clearAuth();
          window.location.href = "/login?reason=session_expired";
          return result;
        }
      } catch (error) {
        processQueue(error as Error, null);
        clearAuth();
        window.location.href = "/login?reason=session_expired";
        return result;
      } finally {
        isRefreshing = false;
      }
    } else {
      // Another refresh is in progress - queue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: async (token: string) => {
            // Retry with the new token
            const retryResult = await request();
            resolve(retryResult);
          },
          reject: (error) => {
            reject(error);
          },
        });
      });
    }
  }

  return result;
}
```

---

## 6. Retry Strategy

The retry strategy is designed to handle transient failures without overwhelming the server or wasting resources on permanent failures.

### 6.1 Retry Eligibility Rules

| HTTP Status | Retryable? | Strategy |
|-------------|-----------|----------|
| 400 | No | Client error - fix the request |
| 401 | Conditional | Attempt token refresh first, then redirect to login |
| 403 | No | Permission denied - do not retry |
| 404 | No | Resource not found - do not retry |
| 409 | Conditional | Retry once after 1 second (conflict may resolve) |
| 422 | No | Unprocessable entity - fix the request |
| 429 | Yes | Respect `Retry-After` header; fallback to exponential backoff |
| 500 | Yes | Exponential backoff |
| 502 | Yes | Exponential backoff |
| 503 | Yes | Exponential backoff with circuit breaker |
| 504 | Yes | Exponential backoff |
| Network error | Yes | Exponential backoff (if online) |
| Offline | No | Queue for later sync |

### 6.2 Exponential Backoff Configuration

```typescript
interface RetryConfig {
  maxRetries: number;          // 5
  baseDelayMs: number;         // 1000 (1 second)
  maxDelayMs: number;          // 16000 (16 seconds)
  backoffMultiplier: number;   // 2
  jitterPercent: number;       // 0.1 (±10%)
  retryableStatuses: number[]; // [429, 500, 502, 503, 504]
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 16000,
  backoffMultiplier: 2,
  jitterPercent: 0.1,
  retryableStatuses: [429, 500, 502, 503, 504],
};

// Retry delay sequence: 1s, 2s, 4s, 8s, 16s (with ±10% jitter)
function calculateRetryDelay(attempt: number, config: RetryConfig): number {
  const baseDelay = Math.min(
    config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelayMs
  );
  const jitter = baseDelay * config.jitterPercent * (Math.random() * 2 - 1);
  return Math.round(baseDelay + jitter);
}
```

### 6.3 Retry Implementation

```typescript
async function withRetry<T>(
  fn: () => Promise<APIResult<T>>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<APIResult<T>> {
  let lastError: APIError | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    const result = await fn();

    if (result.error === null) {
      // Success
      return result;
    }

    lastError = result.error;

    // Check if this error is retryable
    if (!isRetryable(result.error, config)) {
      return result;
    }

    // Don't retry after the last attempt
    if (attempt === config.maxRetries) {
      return result;
    }

    // Calculate delay (respect Retry-After header for 429)
    let delay: number;
    if (result.error.http_status === 429 && result.error.retry_after) {
      delay = result.error.retry_after * 1000;
    } else {
      delay = calculateRetryDelay(attempt, config);
    }

    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  // Should never reach here, but TypeScript needs it
  return { data: null, error: lastError! };
}

function isRetryable(error: APIError, config: RetryConfig): boolean {
  // Network errors are retryable if online
  if (error.category === "network" && navigator.onLine) return true;

  // Offline errors are not retryable (queue instead)
  if (error.category === "offline") return false;

  // Check HTTP status
  if (error.http_status && config.retryableStatuses.includes(error.http_status)) {
    return true;
  }

  return false;
}
```

### 6.4 Circuit Breaker

The circuit breaker prevents repeated calls to a failing service. It is implemented per-service (e.g., Supabase, R2, Redis).

```typescript
enum CircuitState {
  CLOSED = "closed",     // Normal operation
  OPEN = "open",         // Service is down, reject calls
  HALF_OPEN = "half_open", // Testing if service recovered
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly resetTimeoutMs: number = 30000,
    private readonly halfOpenMaxCalls: number = 3
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error("Circuit breaker is OPEN. Service is unavailable.");
      }
    }

    try {
      const result = await fn();

      if (this.state === CircuitState.HALF_OPEN) {
        this.successCount++;
        if (this.successCount >= this.halfOpenMaxCalls) {
          this.state = CircuitState.CLOSED;
          this.failureCount = 0;
        }
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.state = CircuitState.OPEN;
      }

      throw error;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
  }
}
```

---

## 7. Offline Error Handling

The FOCUS Platform is designed as an offline-first application. Games can be played without an internet connection, and all data is synced when connectivity is restored.

### 7.1 Operation Queue

When the client is offline, all write operations are queued in IndexedDB. The queue is persisted across page reloads and app restarts.

```typescript
interface QueuedOperation {
  id: string; // UUID
  type: "session_complete" | "score_submit" | "profile_update" | "sync_push" | "mission_complete" | "achievement_unlock";
  endpoint: string;
  method: string;
  body: unknown;
  created_at: string;
  retry_count: number;
  max_retries: number;
  priority: "low" | "normal" | "high";
  idempotency_key: string;
}

class OperationQueue {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("focus-offline-queue", 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("operations")) {
          const store = db.createObjectStore("operations", { keyPath: "id" });
          store.createIndex("priority", "priority");
          store.createIndex("created_at", "created_at");
          store.createIndex("type", "type");
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async enqueue(operation: Omit<QueuedOperation, "id" | "created_at" | "retry_count">): Promise<string> {
    const id = crypto.randomUUID();
    const entry: QueuedOperation = {
      ...operation,
      id,
      created_at: new Date().toISOString(),
      retry_count: 0,
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction("operations", "readwrite");
      const store = tx.objectStore("operations");
      const request = store.add(entry);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async dequeue(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction("operations", "readwrite");
      const store = tx.objectStore("operations");
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPending(): Promise<QueuedOperation[]> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction("operations", "readonly");
      const store = tx.objectStore("operations");
      const request = store.getAll();

      request.onsuccess = () => {
        const operations = request.result as QueuedOperation[];
        // Sort by priority (high > normal > low) then by created_at
        operations.sort((a, b) => {
          const priorityOrder = { high: 0, normal: 1, low: 2 };
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        resolve(operations);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async incrementRetry(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction("operations", "readwrite");
      const store = tx.objectStore("operations");
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const entry = getReq.result as QueuedOperation;
        entry.retry_count++;
        const putReq = store.put(entry);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };

      getReq.onerror = () => reject(getReq.error);
    });
  }

  async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction("operations", "readwrite");
      const store = tx.objectStore("operations");
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async count(): Promise<number> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction("operations", "readonly");
      const store = tx.objectStore("operations");
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
```

### 7.2 Offline Indicator

The offline indicator is a global UI component that shows the current connectivity status and the number of queued operations.

```typescript
interface OfflineIndicatorProps {
  isOnline: boolean;
  queuedOperations: number;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  onForceSync: () => void;
}

function OfflineIndicator({
  isOnline,
  queuedOperations,
  isSyncing,
  lastSyncedAt,
  onForceSync,
}: OfflineIndicatorProps) {
  if (isOnline && queuedOperations === 0) {
    return null; // Don't show when everything is synced
  }

  return (
    <div className="offline-indicator" role="status" aria-live="polite">
      {!isOnline ? (
        <div className="offline-banner">
          <WifiOffIcon size={16} />
          <span>You're offline. Changes will sync when you reconnect.</span>
        </div>
      ) : isSyncing ? (
        <div className="syncing-banner">
          <SpinnerIcon size={16} />
          <span>Syncing {queuedOperations} pending changes...</span>
          <ProgressBar value={syncProgress} max={queuedOperations} />
        </div>
      ) : queuedOperations > 0 ? (
        <div className="pending-sync-banner">
          <SyncIcon size={16} />
          <span>{queuedOperations} changes pending sync.</span>
          <button onClick={onForceSync} className="sync-button">
            Sync Now
          </button>
        </div>
      ) : null}
    </div>
  );
}
```

### 7.3 Sync-on-Restore Logic

When the client detects that connectivity has been restored, it automatically flushes the operation queue.

```typescript
class SyncManager {
  private queue: OperationQueue;
  private isSyncing = false;
  private abortController: AbortController | null = null;

  constructor(queue: OperationQueue) {
    this.queue = queue;

    // Listen for online events
    window.addEventListener("online", () => this.flushQueue());

    // Also attempt to sync periodically when online
    setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.flushQueue();
      }
    }, 30000); // Every 30 seconds
  }

  async flushQueue(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) return;

    this.isSyncing = true;
    this.abortController = new AbortController();

    try {
      const operations = await this.queue.getPending();

      if (operations.length === 0) {
        this.isSyncing = false;
        return;
      }

      // Notify UI of sync start
      this.onSyncStart(operations.length);

      let synced = 0;
      for (const operation of operations) {
        if (this.abortController.signal.aborted) break;

        try {
          await this.executeOperation(operation);
          await this.queue.dequeue(operation.id);
          synced++;
          this.onSyncProgress(synced, operations.length);
        } catch (error) {
          if (operation.retry_count >= operation.max_retries) {
            // Max retries reached - discard the operation
            console.warn(`[SyncManager] Discarding operation ${operation.id} after ${operation.max_retries} retries`);
            await this.queue.dequeue(operation.id);
            this.onOperationFailed(operation, error as Error);
          } else {
            await this.queue.incrementRetry(operation.id);
          }
        }
      }

      this.onSyncComplete(synced, operations.length - synced);
    } finally {
      this.isSyncing = false;
      this.abortController = null;
    }
  }

  private async executeOperation(operation: QueuedOperation): Promise<void> {
    const response = await fetch(`${API_URL}${operation.endpoint}`, {
      method: operation.method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAccessToken()}`,
        "X-Idempotency-Key": operation.idempotency_key,
        "X-Client-Version": CLIENT_VERSION,
      },
      body: JSON.stringify(operation.body),
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error?.message || `HTTP ${response.status}`);
    }
  }

  abort(): void {
    this.abortController?.abort();
    this.isSyncing = false;
  }

  // Event handlers (set by the UI layer)
  onSyncStart: (total: number) => void = () => {};
  onSyncProgress: (synced: number, total: number) => void = () => {};
  onSyncComplete: (synced: number, failed: number) => void = () => {};
  onOperationFailed: (op: QueuedOperation, error: Error) => void = () => {};
}
```

### 7.4 Graceful Degradation Per Feature

Each feature has a defined degradation strategy when offline:

**Gameplay (fully offline):**
- All games are playable offline after initial load
- Game configs, assets, and audio are cached in Service Worker
- Scores are stored in IndexedDB with `pending_sync: true` flag
- When online, pending scores are submitted in priority order (highest score first)
- Anti-cheat validation runs server-side; offline scores are marked "pending validation"
- Streak calculations use local date logic; server reconciliation happens on sync

**Leaderboards (read-only from cache):**
- Last-fetched leaderboard data is cached in IndexedDB with a `cached_at` timestamp
- Display shows "Last updated: X minutes/hours ago" when using cached data
- Real-time leaderboard updates are disabled
- User's own rank is estimated locally based on cached entries
- When online, leaderboard is fetched and cache is refreshed

**Social features (heavily degraded):**
- Friend list is read-only from cache
- Activity feed shows cached items with "Cached" badge
- Sending friend requests is queued (shown as "Pending" in UI)
- Accepting/declining friend requests is queued
- Challenges can be sent (queued) but real-time challenge status is unavailable
- Group chat is disabled; messages are queued for delivery
- Online status indicators show last-known status

**Profile (partially degraded):**
- Profile viewing works from cache
- Profile editing is queued (shown as "Saving..." with retry)
- Avatar upload is queued (shown as "Upload pending")
- Account deletion requires online connectivity (not queued for safety)

**Sync (fully offline-aware):**
- All sync operations are queued by design
- Conflict resolution uses timestamp-based strategy when offline
- When online, sync uses the standard push/pull mechanism
- Conflict detection happens server-side; client receives conflict notifications
- Manual conflict resolution UI is available for complex merges

**Missions (partially degraded):**
- Mission progress is tracked locally using game session data
- Mission completion is queued for server validation
- New daily missions are not available until online
- Mission rewards are claimed locally and validated on sync

**Auth (fully online-required):**
- Login requires network connectivity
- Session tokens are cached and valid offline until expiry
- Token refresh requires network; if expired, user must go online
- Logout clears all local state regardless of connectivity
- 2FA requires online connectivity for TOTP verification

### 7.5 Offline Data Integrity

To prevent data loss during offline operation, the following safeguards are in place:

1. **Write-ahead logging:** All mutations are written to IndexedDB before being applied to the in-memory state. If the app crashes, the mutation can be replayed on next startup.

2. **Optimistic UI:** The UI updates immediately when the user performs an action, even if the operation is queued. If the operation fails on sync, the UI is rolled back and the user is notified.

3. **Conflict detection:** Each synced record has a `version` field. When pushing changes, the server checks the version matches. If it doesn't, a conflict is returned for manual resolution.

4. **Data checksums:** Critical data (scores, achievements) includes a client-generated checksum. The server validates the checksum on receipt to detect corruption during offline storage.

5. **Queue persistence:** The operation queue is stored in IndexedDB, which survives page reloads, browser crashes, and device restarts. The queue is only cleared when operations are successfully synced or explicitly discarded by the user.

### 7.6 Network State Detection

```typescript
class NetworkMonitor {
  private listeners: Array<(isOnline: boolean) => void> = [];
  private isOnline: boolean = navigator.onLine;
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    window.addEventListener("online", () => this.setStatus(true));
    window.addEventListener("offline", () => this.setStatus(false));

    // Also poll the server every 30 seconds when online
    // to detect cases where the OS reports online but the network is unreachable
    this.checkInterval = setInterval(async () => {
      if (!navigator.onLine) return;

      try {
        const response = await fetch(`${API_URL}/admin/health`, {
          method: "HEAD",
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        });
        this.setStatus(response.ok);
      } catch {
        this.setStatus(false);
      }
    }, 30000);
  }

  private setStatus(online: boolean): void {
    if (this.isOnline === online) return;
    this.isOnline = online;
    this.listeners.forEach((listener) => listener(online));

    // Dispatch custom event for components that don't use the hook
    window.dispatchEvent(
      new CustomEvent("networkchange", { detail: { isOnline: online } })
    );
  }

  subscribe(listener: (isOnline: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  destroy(): void {
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.listeners = [];
  }
}

// React hook
function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const monitor = new NetworkMonitor();
    const unsubscribe = monitor.subscribe(setIsOnline);
    return () => {
      unsubscribe();
      monitor.destroy();
    };
  }, []);

  return isOnline;
}
```

### 7.7 Sync Progress UI

When the app comes back online and begins syncing queued operations, the UI shows a progress indicator.

```typescript
interface SyncProgressProps {
  total: number;
  synced: number;
  failed: number;
  isInProgress: boolean;
}

function SyncProgress({ total, synced, failed, isInProgress }: SyncProgressProps) {
  if (!isInProgress && failed === 0 && synced === 0) return null;

  const progress = total > 0 ? (synced / total) * 100 : 0;

  return (
    <div className="sync-progress" role="progressbar" aria-valuenow={progress} aria-valuemax={100}>
      {isInProgress ? (
        <>
          <div className="sync-progress-bar">
            <div className="sync-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="sync-progress-text">
            Syncing... {synced}/{total}
          </span>
        </>
      ) : failed > 0 ? (
        <div className="sync-error">
          <AlertIcon />
          <span>{failed} changes couldn't sync. </span>
          <button onClick={() => retryFailedSync()} className="retry-link">
            Retry
          </button>
        </div>
      ) : (
        <div className="sync-complete">
          <CheckIcon />
          <span>All changes synced successfully.</span>
        </div>
      )}
    </div>
  );
}
```

---

## 8. Error Logging and Monitoring

### 8.1 Structured Error Logging

Every error in the system is logged with a consistent structure:

```typescript
interface ErrorLog {
  timestamp: string;
  level: "debug" | "info" | "warn" | "error" | "fatal";
  code: string;
  message: string;
  category: string;
  user_id?: string;
  session_id?: string;
  device_id: string;
  request_id: string;
  route: string;
  feature_flags: Record<string, boolean>;
  user_agent: string;
  platform: Platform;
  app_version: string;
  stack_trace?: string;
  context?: Record<string, unknown>;
  http_status?: number;
  endpoint?: string;
  duration_ms?: number;
}
```

### 8.2 Error Budget

The platform maintains an error budget per endpoint. When the error rate exceeds the budget, deployment is halted and the team is notified.

**Budget thresholds:**
- Auth endpoints: 0.1% error rate (1 error per 1000 requests)
- Game endpoints: 0.5% error rate
- Social endpoints: 1.0% error rate
- Admin endpoints: 0.01% error rate

**Alert channels:**
- **PagerDuty:** Error rate exceeds 2x budget for 5 minutes
- **Slack:** Error rate exceeds budget for 15 minutes
- **Email digest:** Daily summary of error trends
- **GitHub issue:** Auto-created for new error codes or spikes in existing codes

### 8.3 Error Correlation

Every API request generates a `X-Request-ID` (UUID v4) that flows through all layers:
1. Client generates the ID and includes it in the request header
2. Edge worker logs it with the incoming request
3. Database queries include it in comments for query tracing
4. Upstream service calls pass it as a header
5. The ID is included in all error responses
6. Sentry events include it for correlation

This enables tracing a single user action through the entire stack, from the client's fetch call through the edge worker, database, and back.

---

## 9. Error Recovery Patterns

### 9.1 Automatic Recovery

Certain errors trigger automatic recovery without user intervention:

| Error | Recovery Action |
|-------|----------------|
| Token expired (401) | Refresh token, retry request |
| Rate limited (429) | Wait for `Retry-After`, retry |
| Server error (500) | Exponential backoff retry (max 5) |
| Network blip | Retry with backoff (single retry) |
| WebGL context lost | Reinitialize renderer, resume game |
| Audio context suspended | Resume on next user interaction |

### 9.2 User-Assisted Recovery

Some errors require user action to recover:

| Error | User Action |
|-------|-------------|
| Login failed (401) | Re-enter credentials |
| 2FA code wrong (400) | Enter correct code |
| Profile private (403) | No action possible (inform user) |
| Display name taken (409) | Choose different name |
| File too large (413) | Choose smaller file |
| Sync conflict (409) | Choose which version to keep |

### 9.3 Manual Recovery (Support Required)

Some errors require support intervention:

| Error | Support Action |
|-------|----------------|
| Account suspended (401) | Review and potentially lift suspension |
| Anti-cheat flag (429) | Review session data, clear or confirm |
| Data corruption (500) | Restore from backup |
| Payment failure (reserved) | Investigate payment provider |

---

## 10. Error Response Format

All API errors follow a consistent envelope format:

```typescript
// Standard error response
{
  "data": null,
  "error": {
    "code": "AUTH_011",
    "message": "Invalid email or password",
    "details": null,
    "category": "auth",
    "http_status": 401,
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-07-15T14:30:00Z",
    "retry_after": null
  }
}

// Validation error with field details
{
  "data": null,
  "error": {
    "code": "PROFILE_010",
    "message": "Profile update validation failed",
    "details": {
      "display_name": "Must be 1-30 characters, alphanumeric and spaces only",
      "bio": "Must be 500 characters or fewer"
    },
    "category": "validation",
    "http_status": 400,
    "request_id": "660e8400-e29b-41d4-a716-446655440001",
    "timestamp": "2026-07-15T14:31:00Z",
    "retry_after": null
  }
}

// Rate limit error with retry guidance
{
  "data": null,
  "error": {
    "code": "AUTH_014",
    "message": "Too many login attempts",
    "details": {
      "locked_until": "2026-07-15T14:45:00Z",
      "attempts_remaining": 0
    },
    "category": "rate_limit",
    "http_status": 429,
    "request_id": "770e8400-e29b-41d4-a716-446655440002",
    "timestamp": "2026-07-15T14:32:00Z",
    "retry_after": 900
  }
}
```

### Error Code Naming Convention

The code serves three purposes:
1. **Machine-readable:** Clients can programmatically handle specific error codes
2. **Human-readable:** Developers can search the codebase for the code string
3. **Support-friendly:** Support agents can reference the code in tickets

The naming convention ensures no collisions: `MODULE_NNN` where MODULE is unique per domain and NNN is a sequential number within that domain. New error codes are added at the end of the module's range and never reused, even if the error is deprecated.

---

## Summary

The FOCUS Platform's error handling system is built on the principle that errors are expected behavior, not exceptional cases. Every error has a code, a message, and a recovery path. The system classifies errors into 10 categories with distinct HTTP statuses, retry strategies, and user-facing treatments. Error boundaries at multiple levels (route, game, component) ensure that failures are isolated and recoverable. The offline-first architecture queues operations and syncs them when connectivity is restored. All errors are logged to Sentry with rich context for debugging and monitored against error budgets for reliability. The result is a system that degrades gracefully under any failure condition and provides clear, actionable guidance to both users and developers.
