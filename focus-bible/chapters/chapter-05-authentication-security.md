# Chapter 05: Authentication & Security

## Table of Contents

1. [Overview](#overview)
2. [Authentication Architecture](#authentication-architecture)
3. [Auth Providers](#auth-providers)
4. [OAuth Flow](#oauth-flow)
5. [Session Management](#session-management)
6. [Token Storage](#token-storage)
7. [Multi-Device Session Management](#multi-device-session-management)
8. [Device Trust and Recognition](#device-trust-and-recognition)
9. [Biometric Authentication](#biometric-authentication)
10. [Two-Factor Authentication (TOTP)](#two-factor-authentication-totp)
11. [Account Recovery](#account-recovery)
12. [Email and Phone Verification](#email-and-phone-verification)
13. [Age Verification and COPPA Compliance](#age-verification-and-coppa-compliance)
14. [GDPR Compliance: Deletion and Export](#gdpr-compliance-deletion-and-export)
15. [Session Policies](#session-policies)
16. [Suspicious Activity Detection](#suspicious-activity-detection)
17. [Security Architecture](#security-architecture)
18. [Transport Security](#transport-security)
19. [Content Security Policy](#content-security-policy)
20. [CORS Configuration](#cors-configuration)
21. [Rate Limiting](#rate-limiting)
22. [Input Validation](#input-validation)
23. [Injection Prevention](#injection-prevention)
24. [CSRF and Clickjacking Protection](#csrf-and-clickjacking-protection)
25. [API Key Management](#api-key-management)
26. [Secret Rotation Strategy](#secret-rotation-strategy)
27. [Vulnerability Management](#vulnerability-management)
28. [Compliance Paths](#compliance-paths)
29. [Data Encryption](#data-encryption)
30. [PII Handling](#pii-handling)
31. [Audit Trail](#audit-trail)
32. [Security Incident Response](#security-incident-response)
33. [Row Level Security (RLS) Deep Dive](#row-level-security-rls-deep-dive)

---

## Overview

Security is not a feature—it is a foundational property of the FOCUS platform. Every architectural decision in this chapter is made with the assumption that the platform will be targeted by malicious actors from day one. The FOCUS platform handles sensitive cognitive performance data, personal identifiable information (PII), and behavioral analytics that, if leaked, could cause real harm to users. This chapter defines the complete authentication and security posture of the platform.

The security model is built on three pillars:

1. **Zero Trust**: No request is trusted by default, regardless of origin. Every API call is authenticated, authorized, and validated.
2. **Defense in Depth**: Multiple overlapping security layers ensure that no single point of failure can compromise the system.
3. **Privacy by Design**: Data minimization, purpose limitation, and user sovereignty over personal data are enforced at the schema level.

All authentication is delegated to Supabase Auth, which provides a battle-tested identity layer built on top of GoTrue. Supabase Auth handles the complexity of OAuth token exchange, JWT signing, refresh token rotation, and session management. Our application layer focuses on authorization (via Row Level Security), input validation, and user experience flows.

---

## Authentication Architecture

### System Overview

The authentication system consists of the following components:

- **Supabase Auth (GoTrue)**: Identity provider, session management, JWT issuance
- **Supabase Database**: User profiles, device records, security logs
- **Supabase Edge Functions**: Custom auth flows, webhook handlers, cron jobs
- **Client SDK**: `@supabase/auth-helpers-*` for framework integration
- **Keychain/Keystore**: Platform-native secure storage for tokens

### Authentication Flow (High-Level)

```
User → Client App → Supabase Auth API
                          ↓
                   Identity Verified
                          ↓
                   JWT + Refresh Token Issued
                          ↓
                   Client Stores Tokens
                          ↓
                   RLS Policies Enforce Access
```

Every subsequent API request includes the JWT in the `Authorization` header. Supabase PostgREST validates the JWT signature against the Supabase JWT secret and exposes the `auth.uid()` and `auth.jwt()` functions for use in RLS policies.

### JWT Token Structure

The JWT issued by Supabase Auth contains the following claims:

```json
{
  "aud": "authenticated",
  "exp": 1700000000,
  "sub": "uuid-of-user",
  "email": "user@example.com",
  "role": "authenticated",
  "app_metadata": {
    "provider": "google",
    "providers": ["google", "email"]
  },
  "user_metadata": {
    "display_name": "Jane Doe",
    "avatar_url": "https://..."
  },
  "iat": 1699996400,
  "iss": "https://your-project.supabase.co/auth/v1",
  "session_id": "uuid-of-session"
}
```

**Key fields explained:**

- `aud`: Always `"authenticated"` for logged-in users. Used in RLS policies to distinguish authenticated from anonymous access.
- `sub`: The user's UUID. This is the primary key for all user-scoped data access.
- `role`: Supabase internal role. Always `"authenticated"` for normal users. `"service_role"` bypasses RLS—never exposed to clients.
- `app_metadata`: Provider information. Cannot be modified by the user.
- `user_metadata`: User-editable profile data. Used for display purposes only—never for authorization decisions.
- `session_id`: Used for session-specific RLS policies and multi-device management.

### Token Lifetimes

| Token Type | Lifetime | Refresh Window | Storage |
|---|---|---|---|
| Access Token (JWT) | 1 hour | N/A (not refreshable) | Memory / Secure Cookie |
| Refresh Token | 1 week | Last 24 hours before expiry | Secure Storage (platform-specific) |
| Refresh Token (Remember Me) | 30 days | Last 7 days before expiry | Secure Storage (platform-specific) |

The access token is intentionally short-lived. Even if intercepted, it is valid for only one hour. The refresh token is long-lived but can only be used within the refresh window. Supabase Auth implements refresh token rotation: each refresh issues a new refresh token and invalidates the previous one.

---

## Auth Providers

### Supported Providers

| Provider | Type | Use Case | Priority |
|---|---|---|---|
| Email/Password | Credential | Primary fallback, maximum accessibility | P0 |
| Magic Link (Email) | Passwordless | Lowest friction email auth | P1 |
| Google | OAuth 2.0 | Most common social login | P0 |
| Apple | OAuth 2.0 (Sign in with Apple) | Required for iOS App Store compliance | P0 |
| GitHub | OAuth 2.0 | Developer audience | P2 |
| Discord | OAuth 2.0 | Community/gaming audience | P2 |

### Provider Configuration

Each provider is configured in the Supabase Dashboard under Authentication > Providers. The following configuration is required for each:

**Email/Password:**
- Minimum password length: 8 characters
- Password complexity: At least one letter and one number
- Double opt-in email confirmation: Enabled in production
- Rate limit: 30 sign-in attempts per hour per email

**Magic Link:**
- Email template: Custom branded template
- Link expiry: 5 minutes
- Rate limit: 10 magic link requests per hour per email
- PKCE flow: Enabled (not implicit)

**Google OAuth:**
- Scopes: `openid email profile`
- Client ID: Stored in Supabase Auth settings (never in client code)
- Client Secret: Stored in Supabase Vault
- Redirect URI: `https://your-project.supabase.co/auth/v1/callback`

**Apple Sign In:**
- Scopes: `name email`
- Apple Team ID and Key ID stored in Supabase Auth settings
- Private Email Relay: Enabled (hides user's real email)
- Redirect URI: `https://your-project.supabase.co/auth/v1/callback`

**GitHub OAuth:**
- Scopes: `read:user user:email`
- Redirect URI: `https://your-project.supabase.co/auth/v1/callback`

**Discord OAuth:**
- Scopes: `identify email`
- Redirect URI: `https://your-project.supabase.co/auth/v1/callback`

### Provider Selection UX

On the sign-in screen, providers are displayed in the following order:
1. Google (prominent button, full width)
2. Apple (prominent button, full width, only on iOS/macOS)
3. Email Magic Link (text input + button)
4. "More options" expandable section containing:
   - Email/Password
   - GitHub
   - Discord

This ordering is data-driven and stored in a configuration file to allow A/B testing and regional customization without code changes.

---

## OAuth Flow

### Authorization Code Flow with PKCE

All OAuth providers use the Authorization Code flow with PKCE (Proof Key for Code Exchange). The implicit flow is never used due to its security weaknesses (tokens exposed in URL fragments).

**Step-by-step flow:**

1. **Client generates PKCE challenge:**
   - Generate `code_verifier`: 43-128 character random string (URL-safe)
   - Generate `code_challenge`: SHA256 hash of `code_verifier`, base64url encoded
   - Store `code_verifier` in session/local storage temporarily

2. **Client redirects to provider:**
   ```
   https://accounts.google.com/o/oauth2/v2/auth?
     client_id=GOOGLE_CLIENT_ID&
     redirect_uri=https://app.focus.com/auth/callback&
     response_type=code&
     scope=openid email profile&
     state=STATE_TOKEN&
     code_challenge=CODE_CHALLENGE&
     code_challenge_method=S256
   ```

3. **Provider authenticates user:**
   - User logs in at provider
   - Provider redirects back to callback URL with `code` and `state`

4. **Client sends code to Supabase:**
   ```
   POST /auth/v1/token?grant_type=exchange
   {
     "auth_code": "AUTH_CODE_FROM_PROVIDER",
     "code_verifier": "STORED_CODE_VERIFIER"
   }
   ```

5. **Supabase validates:**
   - Exchanges code with provider server-side
   - Verifies PKCE challenge
   - Creates/updates user record
   - Issues JWT + refresh token

6. **Client stores tokens:**
   - Access token in memory
   - Refresh token in secure storage
   - Redirect to application

**State parameter**: A cryptographically random string stored in a cookie with `HttpOnly`, `Secure`, and `SameSite=Lax` attributes. Verified on callback to prevent CSRF attacks during the OAuth flow.

### Account Linking

When a user authenticates with a provider that shares the same email as an existing account:
- If the email is verified at both the existing account and the new provider: Accounts are linked automatically
- If the email is not verified: The user is prompted to verify their email before linking
- A user can have multiple providers linked (visible in account settings)
- Unlinking a provider fails if it would leave the user with no authentication method

---

## Session Management

### Session Lifecycle

```
CREATED → ACTIVE → REFRESHING → ACTIVE
                        ↓
                   EXPIRED → TERMINATED
                        ↓
                   REVOKED → TERMINATED
```

- **CREATED**: Session record created in database, tokens issued
- **ACTIVE**: Session is valid, access token is usable
- **REFRESHING**: Refresh token exchange in progress
- **EXPIRED**: Both access and refresh tokens have expired
- **TERMINATED**: Session explicitly ended by user or system
- **REVOKED**: Session invalidated due to security event

### Refresh Token Rotation

Refresh token rotation is a critical security mechanism. Each time a refresh token is used:

1. The old refresh token is immediately invalidated
2. A new refresh token is issued with a new `session_id`
3. The new refresh token is bound to the same device fingerprint
4. If the old refresh token is used again (replay detection), ALL tokens for that session are revoked

This ensures that if a refresh token is stolen, the legitimate user's refresh will invalidate the stolen token (detectable by the attacker's failed refresh attempt).

### Multi-Session Handling

A user can have active sessions on multiple devices. Supabase Auth manages this natively:

- Maximum concurrent sessions: 10 per user (configurable)
- Each session has a unique `session_id` in the JWT
- Sessions are independently refreshable
- Revoking one session does not affect others
- The "Active Sessions" page in account settings shows all active sessions with device info, location, and last activity

### Session Invalidation

Sessions can be invalidated by:
- User action ("Sign out of all devices")
- Security event (suspicious activity detected)
- Password change (all other sessions revoked)
- Account deletion
- Admin action (support ticket resolution)
- Exceeding maximum session limit (oldest session evicted)

---

## Token Storage

### Web Platform

Tokens are stored using platform-specific secure storage mechanisms:

**Access Token:**
- Stored in memory only (JavaScript variable)
- Never persisted to localStorage, sessionStorage, or cookies
- Lost on page refresh (reconstructed from refresh token)
- Protected from XSS by Content Security Policy

**Refresh Token:**
- Stored in a secure, HttpOnly, SameSite=Strict cookie
- Cookie name: `sb-refresh-token`
- Path: `/auth` (only sent to auth endpoints)
- Domain: `.focus.com` (apex domain)
- Expiry: Matches refresh token lifetime
- The cookie is set by the server during the initial auth exchange, never by client JavaScript

**Why not localStorage for refresh tokens:**
localStorage is accessible to any JavaScript running on the page. An XSS vulnerability—even one introduced by a third-party script—could exfiltrate refresh tokens stored in localStorage. HttpOnly cookies are inaccessible to JavaScript entirely, providing a critical defense layer.

### iOS Platform

- **Keychain**: All tokens stored in the iOS Keychain with `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`
- Access control: Biometric authentication required for keychain access (optional, configurable by user)
- Keychain group: `com.focus.app.auth`
- Tokens are never written to UserDefaults, files, or any other storage

### Android Platform

- **Android Keystore**: All tokens stored in the Android Keystore system
- Encryption: AES-256-GCM with a key stored in the Keystore
- Key alias: `focus_auth_key`
- Authentication requirement: User's screen lock (fingerprint, PIN, pattern)
- Backup: Disabled for the Keystore key (`android:allowBackup="false"`)

### Desktop Platform (Electron/Tauri)

- **Encrypted file**: Tokens stored in a platform-appropriate encrypted file
- Windows: DPAPI-protected file in `%APPDATA%/focus/auth.enc`
- macOS: Keychain-backed encrypted file in `~/Library/Application Support/focus/auth.enc`
- Linux: Libsecret-backed file in `~/.config/focus/auth.enc`
- File permissions: Owner read/write only (0600)
- Encryption: AES-256-CBC with a machine-derived key

---

## Multi-Device Session Management

### Device Registration

Each device is registered upon first authentication with the following metadata:

| Field | Source | Example |
|---|---|---|
| `device_id` | Generated UUID | `a1b2c3d4-...` |
| `device_name` | User-agent parsing | "iPhone 15 Pro" |
| `device_type` | User-agent parsing | "mobile" |
| `os` | User-agent parsing | "iOS 17.2" |
| `browser` | User-agent parsing | "Safari 17.2" |
| `ip_address` | Request header | "203.0.113.42" |
| `location` | IP geolocation | "San Francisco, CA" |
| `first_seen` | Server timestamp | ISO 8601 |
| `last_seen` | Server timestamp | ISO 8601 |
| `trust_level` | Computed | "trusted" / "untrusted" / "unknown" |
| `push_token` | Device registration | FCM/APNs token |

### Session Dashboard

Users can view and manage all active sessions from the account settings:

- List of all active sessions with device info, location, and last activity time
- "Revoke" button per session (terminates that session immediately)
- "Revoke all other sessions" button
- Visual indicator for the current session ("This device")
- Session history (last 30 days of sign-in events)

### Push Notification for New Devices

When a sign-in occurs from a device not in the trusted device list:
1. The new session is created but flagged as `untrusted`
2. A push notification is sent to all trusted devices: "New sign-in from [device] in [location]"
3. The user has 10 minutes to revoke the new session from a trusted device
4. After 10 minutes, the new device becomes trusted (user acknowledged or ignored)

---

## Device Trust and Recognition

### Trust Levels

| Level | Description | Capabilities |
|---|---|---|
| `unknown` | First-time device, no trust established | Full access, but 2FA enforced if enabled |
| `untrusted` | Recognized device but not trusted | Full access, notification sent to trusted devices |
| `trusted` | Verified by user | Full access, can serve as 2FA verification device |

### Trust Establishment

A device becomes `trusted` through one of:
1. User explicitly marks device as trusted in settings
2. User verifies the device via push notification within 10 minutes of first sign-in
3. Biometric authentication is used on the device (auto-trust)
4. 5 successful sign-ins from the same device without security events

### Trust Revocation

Trust is revoked when:
- User explicitly revokes device trust
- A security event is detected on the device
- The device is reported as lost/stolen
- Password is changed (all devices become untrusted, requiring re-verification)

---

## Biometric Authentication

### Supported Biometrics

| Platform | Technology | API |
|---|---|---|
| iOS | FaceID, TouchID | `LAContext` (LocalAuthentication) |
| Android | Fingerprint, Face | `BiometricPrompt` |
| macOS | TouchID, FaceID (with T2/M-series) | `LAContext` |
| Windows | Windows Hello (Face, Fingerprint, PIN) | `Windows.Security.Credentials.UI` |
| Web | WebAuthn (platform authenticator) | `navigator.credentials.get()` |

### Implementation

Biometric authentication is an optional convenience feature that gates access to the locally stored refresh token. It does not replace the initial authentication—it adds a local unlock step.

**Flow:**

1. User opens app
2. App attempts to read refresh token from secure storage
3. Secure storage requires biometric authentication
4. Biometric prompt appears (native OS prompt)
5. On success: Refresh token is accessed, session is restored
6. On failure: User is prompted to enter their password

**Configuration:**
- Users can enable/disable biometric auth in settings
- Biometric is disabled by default
- Enabling requires one successful password entry
- Biometric data never leaves the device's secure enclave
- Fallback to password is always available

### WebAuthn (Web Platform)

For web, biometric authentication is implemented via the Web Authentication API (WebAuthn):

1. During enrollment, a `PublicKeyCredential` is created and registered with Supabase Auth
2. During authentication, the browser prompts for platform biometrics
3. The cryptographic challenge is verified server-side
4. On success, the session is restored

WebAuthn is not required for the web platform—it is offered as an optional enhancement for users who want faster re-authentication.

---

## Two-Factor Authentication (TOTP)

### Implementation

Two-factor authentication uses the TOTP (Time-based One-Time Password) algorithm per RFC 6238.

**Enrollment flow:**

1. User initiates 2FA setup from account settings
2. Server generates a TOTP secret (20 bytes, Base32 encoded)
3. Server generates a QR code URL: `otpauth://totp/FOCUS:user@example.com?secret=...&issuer=FOCUS`
4. User scans QR code with authenticator app (Google Authenticator, Authy, 1Password, etc.)
5. User enters a 6-digit code to verify enrollment
6. Server stores the encrypted TOTP secret (encrypted with Supabase Vault)
7. Server generates 10 backup codes (single-use, 8 characters each)
8. Backup codes are displayed once and must be saved by the user

**Authentication flow:**

1. User enters email + password (or OAuth)
2. If 2FA is enabled, server returns `2fa_required` status
3. Client displays TOTP input screen
4. User enters 6-digit code
5. Server validates against stored TOTP secret
6. On success: Session is created
7. On failure: Attempt counter incremented (lockout after 5 failures)

### TOTP Configuration

| Parameter | Value |
|---|---|
| Algorithm | SHA-1 (for compatibility with most authenticator apps) |
| Digits | 6 |
| Period | 30 seconds |
| Clock skew tolerance | ±1 period (±30 seconds) |
| Backup codes | 10 codes, 8 characters each |

### Recovery

- Backup codes can be used in place of TOTP codes
- Each backup code is single-use
- Users can regenerate backup codes (invalidates old ones)
- If all backup codes are exhausted, account recovery requires contacting support with identity verification
- Losing access to both authenticator and backup codes is equivalent to account lockout

---

## Account Recovery

### Recovery Methods (Priority Order)

1. **Email recovery**: Send a recovery link to the verified email address
2. **Backup codes**: Enter one of the 10 backup codes (if 2FA is enabled)
3. **Identity verification**: Contact support with account verification details

### Email Recovery Flow

1. User clicks "Forgot password" on the sign-in screen
2. User enters their email address
3. System checks if the email exists (but does not reveal this information to the client)
4. If the email exists: A recovery email is sent with a time-limited link
5. If the email does not exist: The same "check your email" message is shown (prevents email enumeration)
6. Recovery link contains a one-time-use token valid for 1 hour
7. User clicks the link, enters a new password
8. Password is updated, all other sessions are revoked
9. User is signed in with the new password

**Rate limiting:** Maximum 3 recovery emails per hour per email address. Maximum 10 recovery emails per day per IP address.

### Support-Based Recovery

When automated recovery is not possible:
1. User submits a support ticket through the help center
2. Support requests identity verification:
   - Email address on the account
   - Date the account was created (approximate)
   - Last 4 characters of a recent payment (if applicable)
   - Answer to a security question set during registration
3. Support verifies identity and initiates account recovery
4. A temporary password is set, user is forced to change it on next login
5. All sessions are revoked
6. The recovery event is logged in the audit trail

---

## Email and Phone Verification

### Email Verification

**For Email/Password registration:**
1. After registration, a verification email is sent immediately
2. The email contains a link with a one-time token
3. Token is valid for 24 hours
4. Until verified, the user can sign in but sees a persistent banner: "Please verify your email"
5. A "Resend verification email" button is available (max 5 per hour)
6. Unverified accounts have the following restrictions:
   - Cannot participate in social features (leaderboards, challenges)
   - Cannot send friend requests
   - Data retention period is shorter (90 days vs. indefinite)

**For OAuth providers:**
- Email is considered verified if the provider confirms it
- No additional verification is required

**For Magic Link:**
- The magic link itself serves as email verification

### Phone Number Verification (Optional)

Phone verification is an optional security enhancement:

1. User enters phone number in account settings
2. An SMS with a 6-digit code is sent via Twilio
3. User enters the code to verify
4. Phone number is stored as a verified contact method

**Use cases:**
- Additional recovery method
- 2FA via SMS (not recommended, but available)
- Account verification for social features
- Phone number is stored encrypted at rest

**SMS rate limiting:** 3 SMS per hour per phone number. SMS is free for verification; 2FA via SMS costs the platform ~$0.005 per message.

---

## Age Verification and COPPA Compliance

### Legal Requirements

The Children's Online Privacy Protection Act (COPPA) requires parental consent for collecting personal information from children under 13. The FOCUS platform is not directed at children, but must handle under-13 users who may access the platform.

### Age Gate

1. During registration, the user must provide their date of birth
2. If the calculated age is under 13, the registration flow is interrupted
3. The user is shown: "FOCUS requires parental consent for users under 13"
4. The user must provide a parent/guardian email address
5. A consent email is sent to the parent/guardian

### Parental Consent Flow

1. Parent receives an email explaining:
   - What data will be collected
   - How the data will be used
   - The child's rights under COPPA
   - How to review/delete the child's data
2. Parent clicks a link to a consent form
3. Parent must:
   - Verify their identity (email + one of: last 4 of SSN, credit card verification, or government ID upload)
   - Explicitly consent to data collection
   - Set data collection limits (optional: restrict to non-personal data only)
4. On consent:
   - Child's account is activated
   - Data collection is limited to what was consented
   - Parent receives a dashboard link to manage the child's account
5. On denial:
   - Child's account is deactivated
   - Any collected data is deleted within 72 hours
   - The child is informed in age-appropriate language

### Child Account Restrictions

| Feature | Restriction |
|---|---|
| Profile visibility | Private by default, cannot be changed |
| Social features | Disabled (friends, leaderboards, challenges) |
| Data sharing | No data shared with third parties |
| Notifications | Minimal, no marketing |
| Analytics | Anonymized only, no behavioral profiling |
| Parental dashboard | Full account visibility and control |

### Age Verification for Content

Some platform features may be age-restricted (e.g., competitive leagues with prizes). These are gated at the feature level using the `date_of_birth` field from the user profile.

---

## GDPR Compliance: Deletion and Export

### Right to Erasure (Article 17)

**User-initiated deletion flow:**

1. User navigates to Account Settings > Data & Privacy > Delete Account
2. User is shown what will be deleted:
   - Profile information
   - All game sessions and scores
   - All achievements and progression
   - All social connections
   - All messages and notifications
3. User must:
   - Enter their password
   - Confirm deletion by typing "DELETE MY ACCOUNT"
4. Account enters a 30-day grace period
5. During grace period:
   - Account is deactivated (cannot sign in)
   - User receives a final email: "Your account will be permanently deleted in 30 days"
   - User can cancel deletion by contacting support with their recovery code
6. After 30 days:
   - All user data is permanently deleted from the database
   - All files (avatars, uploads) are deleted from storage
   - All cached data is purged
   - Deletion is logged in the audit trail (retained for 7 years for legal compliance, but contains no PII)
   - The user's UUID is replaced with a random UUID in any aggregated analytics

**Exclusions from deletion:**
- Anonymized analytics data (aggregated, non-PII)
- Financial records required for tax compliance (retained for 7 years)
- Security logs required for fraud prevention (retained for 2 years)

### Right to Data Portability (Article 20)

**User-initiated export flow:**

1. User navigates to Account Settings > Data & Privacy > Export My Data
2. User selects export format: JSON or CSV
3. User selects data scope: All data, or specific categories:
   - Profile data
   - Game sessions and scores
   - Achievements and progression
   - Social connections
   - Usage analytics
4. An export job is queued
5. When complete (typically within 1 hour), user receives an email with a download link
6. Download link is valid for 7 days
7. Export file is encrypted with a user-provided password
8. Export file contains all requested data in a human-readable format

**Export file structure (JSON):**
```json
{
  "export_version": "1.0",
  "exported_at": "2024-01-15T10:30:00Z",
  "user": {
    "id": "...",
    "email": "...",
    "display_name": "...",
    "created_at": "...",
    "date_of_birth": "..."
  },
  "sessions": [...],
  "achievements": [...],
  "social": {...},
  "analytics": {...}
}
```

---

## Session Policies

### Session Timeout

| Policy | Value | Rationale |
|---|---|---|
| Access token lifetime | 1 hour | Limits exposure window for stolen tokens |
| Idle timeout | 30 minutes | Auto-sign-out after inactivity (configurable) |
| Absolute timeout | 24 hours | Forces re-authentication regardless of activity |
| Remember me access token | 1 hour | Same as standard |
| Remember me refresh token | 30 days | Convenience for personal devices |
| Refresh token lifetime | 7 days (standard) | Balance between security and UX |

### Concurrent Session Limits

| User Type | Max Concurrent Sessions | Rationale |
|---|---|---|
| Free tier | 3 | Prevents abuse |
| Premium tier | 5 | More flexibility for power users |
| Enterprise tier | 10 | Multi-device professional use |

When the maximum is exceeded:
- The oldest session is automatically terminated
- The user is notified: "A new sign-in has occurred. Your oldest session has been signed out."
- No data is lost—sessions are stateless (all state is in the database)

### Session Timeout Implementation

**Idle timeout:**
- The client sends a heartbeat to the server every 5 minutes
- If the server does not receive a heartbeat for 30 minutes, the session is marked as idle
- The next request from the client receives a `401 Session Idle` response
- The client clears tokens and redirects to the sign-in page

**Absolute timeout:**
- The absolute timeout is enforced server-side
- When a request arrives with a token that was issued more than 24 hours ago, the session is terminated
- The client receives a `401 Session Expired` response

---

## Suspicious Activity Detection

### Detection Rules

| Rule | Trigger | Action |
|---|---|---|
| Rapid sign-ins | >5 sign-ins in 1 minute from different IPs | Temporarily block, notify user |
| Impossible travel | Sign-in from distant locations within impossible time | Require 2FA, notify user |
| Brute force | >10 failed sign-in attempts in 10 minutes | Lock account for 15 minutes |
| Credential stuffing | >50 failed sign-ins across accounts from same IP | Block IP for 1 hour |
| Session hijacking | Same session active from 2+ IPs simultaneously | Terminate all sessions, require re-auth |
| Unusual hours | Sign-in at unusual time for user's pattern | Notify user (informational) |
| API abuse | >100 API calls per minute from single session | Throttle session, investigate |

### Implementation

Suspicious activity detection is implemented via Supabase Edge Functions triggered by database webhooks:

1. Every sign-in event is logged to the `security_events` table
2. A database trigger fires on insert, calling an Edge Function
3. The Edge Function runs detection rules against recent activity
4. If suspicious activity is detected:
   - A row is inserted into `security_alerts`
   - Push notifications are sent to the user's trusted devices
   - If severity is high, sessions are automatically revoked
   - The security team is notified via Slack webhook

### Security Events Table Schema

```sql
CREATE TABLE security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_security_events_user ON security_events(user_id, created_at DESC);
CREATE INDEX idx_security_events_ip ON security_events(ip_address, created_at DESC);
CREATE INDEX idx_security_events_type ON security_events(event_type, created_at DESC);
```

---

## Security Architecture

### Zero-Trust Principles

The FOCUS platform follows zero-trust architecture:

1. **Never trust, always verify**: Every request is authenticated and authorized
2. **Least privilege**: Users can only access their own data (enforced via RLS)
3. **Assume breach**: Design systems assuming the network is compromised
4. **Verify explicitly**: Use all available signals (JWT, device, IP, behavior) for authorization
5. **Micro-segmentation**: Each service component has its own access controls

### Threat Model

| Threat | Mitigation |
|---|---|
| Stolen access token | Short lifetime (1 hour), RLS limits scope |
| Stolen refresh token | Rotation detects replay, device binding |
| XSS attack | CSP headers, HttpOnly cookies, React auto-escaping |
| SQL injection | Parameterized queries via PostgREST, RLS |
| Man-in-the-middle | TLS 1.3, HSTS, certificate pinning on mobile |
| DDoS | Rate limiting, CDN, Supabase infrastructure |
| Insider threat | Audit logs, least privilege, no direct DB access |
| Supply chain attack | Dependency scanning, lockfiles, verified publishers |

---

## Transport Security

### TLS 1.3

All communication between client and server uses TLS 1.3:

- **Minimum version**: TLS 1.2 (for legacy browser support), TLS 1.3 preferred
- **Cipher suites** (TLS 1.3): `TLS_AES_256_GCM_SHA384`, `TLS_CHACHA20_POLY1305_SHA256`, `TLS_AES_128_GCM_SHA256`
- **Cipher suites** (TLS 1.2 fallback): `ECDHE-RSA-AES256-GCM-SHA384`, `ECDHE-RSA-AES128-GCM-SHA256`
- **HSTS header**: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- **HSTS preload**: Submitted to hstspreload.org for all FOCUS domains
- **Certificate transparency**: Required for all certificates

### Certificate Management

- Certificates are provisioned via Let's Encrypt (automated via Supabase)
- Wildcard certificates: `*.focus.com` for subdomains
- Certificate rotation: Automated 30 days before expiry
- OCSP stapling: Enabled
- Certificate pinning: Implemented on mobile apps (pin Supabase's certificate chain)

---

## Content Security Policy

### CSP Headers

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{random}';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://*.supabase.co https://*.googleusercontent.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  object-src 'none';
  upgrade-insecure-requests;
```

**Policy explanation:**

- `default-src 'self'`: Only allow resources from the same origin by default
- `script-src 'self' 'nonce-{random}'`: Only allow scripts from same origin with a matching nonce (prevents inline script injection)
- `style-src 'self' 'unsafe-inline'`: Allow inline styles (necessary for CSS-in-JS libraries)
- `img-src`: Allow images from self, data URIs, Supabase storage, and Google avatar URLs
- `font-src`: Allow fonts from Google Fonts
- `connect-src`: Allow API calls and WebSocket connections to Supabase only
- `frame-ancestors 'none'`: Prevents the page from being embedded in any frame (clickjacking prevention)
- `base-uri 'self'`: Prevents `<base>` tag injection
- `form-action 'self'`: Prevents form submissions to external URLs
- `object-src 'none'`: Blocks plugins (Flash, Java, etc.)
- `upgrade-insecure-requests`: Auto-upgrades HTTP to HTTPS

### Nonce Implementation

A unique nonce is generated per request and embedded in the CSP header and script tags:

```typescript
// Server-side middleware
function generateCSPNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

// Applied to every response
res.setHeader('Content-Security-Policy', csp.replace('{random}', nonce));
```

The nonce is regenerated on every page load, preventing cached scripts from bypassing CSP.

---

## CORS Configuration

### Allowed Origins

```
Access-Control-Allow-Origin: https://focus.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH
Access-Control-Allow-Headers: Authorization, Content-Type, X-Request-ID
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

**Origin validation:**
- The server maintains an allowlist of permitted origins
- Origin validation is done server-side, not by the browser alone
- The `Origin` header is validated against the allowlist before processing the request
- If the origin is not in the allowlist, the request is rejected with `403 Forbidden`

**Allowlisted origins:**
| Origin | Environment | Purpose |
|---|---|---|
| `https://focus.com` | Production | Main web application |
| `https://www.focus.com` | Production | WWW subdomain redirect |
| `http://localhost:3000` | Development | Local development |
| `http://localhost:5173` | Development | Vite dev server |

### CORS for Supabase

Supabase allows CORS configuration in the project settings. The FOCUS platform configures:
- Allowed_origins: `https://focus.com,https://www.focus.com`
- This applies to PostgREST, Auth, Storage, and Realtime endpoints

---

## Rate Limiting

### Rate Limit Tiers

Rate limiting is implemented at multiple levels:

#### 1. Global Rate Limit (CDN Level)
- **Limit**: 10,000 requests per minute per IP
- **Scope**: All endpoints
- **Response**: `429 Too Many Requests` with `Retry-After` header

#### 2. API Rate Limit (Application Level)
- **Limit**: 1,000 requests per minute per authenticated user
- **Scope**: All API endpoints
- **Response**: `429 Too Many Requests` with rate limit headers:
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Unix timestamp when window resets

#### 3. Endpoint-Specific Rate Limits

| Endpoint | Limit | Window | Scope |
|---|---|---|---|
| `POST /auth/v1/token` (sign in) | 30 | 1 hour | Per email |
| `POST /auth/v1/signup` | 5 | 1 hour | Per IP |
| `POST /auth/v1/recover` | 3 | 1 hour | Per email |
| `POST /auth/v1/magiclink` | 5 | 1 hour | Per email |
| `POST /auth/v1/verify` | 10 | 1 hour | Per email |
| `GET /rest/v1/*` | 100 | 1 minute | Per user |
| `POST /rest/v1/*` | 30 | 1 minute | Per user |
| `DELETE /rest/v1/*` | 10 | 1 minute | Per user |
| Edge Functions | 50 | 1 minute | Per user |
| File Upload | 10 | 1 minute | Per user |
| Realtime Connections | 5 | 1 minute | Per user |

#### 4. Game-Specific Rate Limits

| Action | Limit | Window | Rationale |
|---|---|---|---|
| Submit score | 1 | 30 seconds | Prevent score farming |
| Start session | 5 | 1 minute | Prevent session spam |
| Claim reward | 1 | 10 seconds | Prevent duplicate claims |
| Send challenge | 10 | 1 hour | Prevent challenge spam |

### Rate Limit Implementation

Rate limiting is implemented using Supabase Edge Functions and the Upstash Redis integration:

```typescript
// Pseudocode for rate limiting
async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);

  // Use Redis sliding window
  const current = await redis.zcount(key, windowStart, now);

  if (current >= limit) {
    return {
      allowed: false,
      remaining: 0,
      reset: Math.ceil((windowStart + windowSeconds * 1000) / 1000)
    };
  }

  await redis.zadd(key, now, `${now}-${crypto.randomBytes(4).toString('hex')}`);
  await redis.expire(key, windowSeconds);

  return {
    allowed: true,
    remaining: limit - current - 1,
    reset: Math.ceil((now + windowSeconds * 1000) / 1000)
  };
}
```

### Rate Limit Response Format

```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again later.",
  "retry_after": 45,
  "limit": 30,
  "remaining": 0,
  "reset": 1700000045
}
```

---

## Input Validation

### Zod Schema Validation

All user inputs are validated using Zod schemas. No input is trusted, regardless of source.

**Schema definition pattern:**

```typescript
import { z } from 'zod';

// Profile update schema
const UpdateProfileSchema = z.object({
  display_name: z.string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be 50 characters or less')
    .regex(/^[a-zA-Z0-9 _-]+$/, 'Display name contains invalid characters'),
  bio: z.string()
    .max(500, 'Bio must be 500 characters or less')
    .optional(),
  avatar_url: z.string()
    .url('Invalid avatar URL')
    .optional(),
  date_of_birth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .refine((date) => {
      const age = Math.floor((Date.now() - new Date(date).getTime()) / 31557600000);
      return age >= 5 && age <= 120;
    }, 'Invalid date of birth')
});

// Game score submission schema
const SubmitScoreSchema = z.object({
  game_id: z.string().uuid(),
  session_id: z.string().uuid(),
  score: z.number().int().min(0).max(100000),
  metadata: z.object({
    trials_completed: z.number().int().min(1).max(1000),
    duration_ms: z.number().int().min(1000).max(600000),
    device_info: z.string().max(200).optional()
  }),
  client_hash: z.string().length(64) // SHA-256 hash of session data
});
```

**Validation middleware:**

Every API endpoint validates the request body, query parameters, and path parameters against the corresponding Zod schema. Invalid requests receive a `400 Bad Request` response with descriptive error messages (without revealing internal validation logic).

```typescript
function validate<T>(schema: z.ZodSchema<T>) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    if (!result.success) {
      return res.status(400).json({
        error: 'validation_error',
        details: result.error.issues.map(i => ({
          path: i.path.join('.'),
          message: i.message
        }))
      });
    }

    req.validated = result.data;
    next();
  };
}
```

### Server-Side Validation

Even though Zod validates on the client, all validation is repeated server-side. The client-side validation is a UX convenience—server-side validation is the security boundary.

---

## Injection Prevention

### SQL Injection Prevention

The FOCUS platform uses Supabase's PostgREST, which parameterizes all queries by default. Raw SQL queries are never used in application code.

**Supabase client usage:**

```typescript
// SAFE: PostgREST parameterizes this query
const { data, error } = await supabase
  .from('game_sessions')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// SAFE: Even RPC calls use parameterized queries
const { data, error } = await supabase.rpc('get_user_stats', {
  p_user_id: userId,
  p_game_id: gameId
});
```

**Edge Functions:** Supabase Edge Functions use the Supabase client library, which maintains parameterization. Raw SQL is never used even in Edge Functions.

**Database functions:** All PostgreSQL functions use parameterized queries with `EXECUTE USING` syntax:

```sql
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID, p_game_id UUID)
RETURNS TABLE (avg_score NUMERIC, sessions_count BIGINT)
LANGUAGE SQL STABLE
AS $$
  SELECT
    AVG(score)::NUMERIC,
    COUNT(*)::BIGINT
  FROM game_sessions
  WHERE user_id = p_user_id
    AND game_id = p_game_id;
$$;
```

### XSS Prevention

XSS prevention is achieved through multiple layers:

1. **React auto-escaping**: React automatically escapes all string values rendered in JSX
2. **CSP headers**: Prevent inline script execution (see CSP section above)
3. **Input sanitization**: HTML tags are stripped from user-generated content (display names, bios)
4. **Output encoding**: All dynamic content is HTML-encoded before rendering
5. **Trusted Types**: Where supported, Trusted Types API is used to prevent DOM XSS

```typescript
// Content sanitization utility
import DOMPurify from 'dompurify';

function sanitizeUserContent(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed in user content
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false
  });
}
```

---

## CSRF and Clickjacking Protection

### CSRF Protection

Cross-Site Request Forgery is prevented through:

1. **SameSite cookies**: Refresh tokens use `SameSite=Strict`
2. **CSRF tokens**: State-changing endpoints require a custom header (`X-CSRF-Token`)
3. **Origin validation**: All API requests are validated against the allowlist of origins
4. **Double Submit Cookie Pattern**: A random token is stored in a cookie and must be included in the request header

```typescript
// CSRF token generation and validation
function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Set CSRF token in cookie (readable by JavaScript)
res.cookie('csrf-token', generateCSRFToken(), {
  httpOnly: false, // Must be readable by JS
  secure: true,
  sameSite: 'strict'
});

// Validate on state-changing requests
function validateCSRF(req) {
  const cookieToken = req.cookies['csrf-token'];
  const headerToken = req.headers['x-csrf-token'];
  return cookieToken && headerToken && cookieToken === headerToken;
}
```

### Clickjacking Prevention

Clickjacking is prevented through:

1. **`X-Frame-Options: DENY`**: Prevents the page from being embedded in any iframe
2. **`Content-Security-Policy: frame-ancestors 'none'`**: Modern alternative to X-Frame-Options
3. **`X-Content-Type-Options: nosniff`**: Prevents MIME type sniffing

These headers are set on all responses from the FOCUS platform.

---

## API Key Management

### Service Role Keys

Supabase provides a `service_role` key that bypasses Row Level Security. This key is:

- **Never exposed to the client**
- Stored in environment variables on the server
- Used only in Edge Functions and server-side code
- Scoped to the minimum required permissions

```typescript
// Edge Function: Only uses service_role when absolutely necessary
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // Use anon key for user-context operations
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  // Only use service_role for admin operations
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Prefer userClient; only use adminClient when RLS bypass is justified
  // ...
});
```

### API Keys for Third-Party Integrations

Third-party API keys (analytics, payment, email, etc.) are:
- Stored in Supabase Vault (encrypted at rest)
- Never committed to version control
- Never embedded in client-side code
- Rotated quarterly (or immediately on suspected compromise)
- Accessible only to Edge Functions via environment variables

---

## Secret Rotation Strategy

### Rotation Schedule

| Secret | Rotation Frequency | Method |
|---|---|---|
| Supabase JWT secret | On demand (manual) | Supabase Dashboard |
| Supabase service_role key | On demand (manual) | Supabase Dashboard |
| OAuth client secrets | Every 90 days | Provider dashboard |
| Database passwords | Every 90 days | Supabase Dashboard |
| API keys (third-party) | Every 90 days | Provider dashboard |
| Encryption keys | Annually | Key rotation procedure |
| CSRF secrets | Every 30 days | Automated via cron |

### Rotation Procedure

1. Generate new secret
2. Update in all systems that use it (old and new coexist during transition)
3. Verify all systems are using the new secret
4. Revoke the old secret
5. Monitor for failures for 24 hours
6. Document the rotation in the audit log

### Emergency Rotation

In case of suspected compromise:
1. Immediately revoke the compromised secret
2. Generate a new secret
3. Update all dependent services
4. Audit all access logs for unauthorized usage
5. Notify affected users if PII may have been exposed
6. File an incident report

---

## Vulnerability Management

### Dependency Scanning

- **Dependabot**: Configured on GitHub for automated dependency update PRs
  - Checks for vulnerabilities daily
  - Auto-merges patch version updates after CI passes
  - Flags major version updates for manual review
- **Snyk**: Runs on every PR as a CI check
  - Blocks PRs with critical or high vulnerabilities
  - Provides fix recommendations
  - Monitors transitive dependencies

### Security Scanning Schedule

| Activity | Frequency | Tool |
|---|---|---|
| Dependency vulnerability scan | Daily (automated) | Dependabot + Snyk |
| Static application security testing (SAST) | On every PR | CodeQL |
| Container image scanning | On every build | Trivy |
| Infrastructure as Code scanning | On every PR | Checkov |
| Dynamic application security testing (DAST) | Weekly | OWASP ZAP |
| Penetration testing | Quarterly | Third-party firm |
| Security review | On every major release | Internal security team |

### Penetration Testing

External penetration testing is conducted quarterly by a reputable security firm. The scope includes:

- Authentication and authorization testing
- API security testing
- Input validation and injection testing
- Session management testing
- Business logic testing (score manipulation, progression abuse)
- Mobile application security testing
- Infrastructure security testing

Results are tracked in a private issue tracker and remediated within:
- **Critical**: 24 hours
- **High**: 7 days
- **Medium**: 30 days
- **Low**: 90 days

### Bug Bounty Program

A private bug bounty program is planned for the post-launch phase:

- **Scope**: All FOCUS platform endpoints and applications
- **Rewards**: $100-$10,000 based on severity
- **Severity classification**: Based on CVSS v3.1
- **Rules of engagement**: No data exfiltration, no denial of service, report promptly
- **Safe harbor**: Good-faith security researchers are protected from legal action

---

## Compliance Paths

### SOC 2 Type I → Type II

The FOCUS platform is pursuing SOC 2 compliance:

**Type I (Design):**
- Security controls documentation
- Access control policies
- Change management procedures
- Data retention and disposal policies
- Incident response plan
- Vendor management program

**Type II (Operating):**
- 6-month observation period
- Continuous monitoring of controls
- Regular access reviews
- Penetration testing evidence
- Incident response drills

**Key controls under observation:**
- Authentication and authorization mechanisms
- Encryption at rest and in transit
- Backup and recovery procedures
- Monitoring and alerting
- Change management and deployment processes

### Additional Compliance Considerations

| Regulation | Status | Notes |
|---|---|---|
| GDPR | Compliant | DPA in place, DPO appointed |
| COPPA | Compliant | Parental consent flow implemented |
| CCPA | Compliant | "Do Not Sell" option, data export |
| SOC 2 | In progress | Type I target: Q2 2025 |
| ISO 27001 | Planned | Post-SOC 2 |
| HIPAA | Not applicable | No health data collected |

---

## Data Encryption

### Encryption at Rest

All data at rest is encrypted using AES-256:

- **Supabase database**: Encrypted at rest using AES-256 (managed by Supabase infrastructure)
- **Supabase storage**: Server-side encryption with AES-256 (managed by Supabase)
- **Backups**: Encrypted with AES-256-GCM
- **Local storage (mobile/desktop)**: Platform-specific encryption (Keychain, Keystore, DPAPI)

### Encryption in Transit

All data in transit is encrypted using TLS 1.3 (detailed in Transport Security section).

### Application-Level Encryption

Sensitive fields are encrypted at the application level before storage:

| Field | Encryption Method | Key Source |
|---|---|---|
| TOTP secrets | AES-256-GCM | Supabase Vault |
| Phone numbers | AES-256-GCM | Supabase Vault |
| Parent emails (COPPA) | AES-256-GCM | Supabase Vault |
| Backup codes | Bcrypt (one-way) | Supabase JWT secret |

### Key Management via Supabase Vault

Supabase Vault provides secure key management:

1. Encryption keys are stored in Supabase Vault (HSM-backed)
2. Keys are accessed via SQL functions: `vault.decrypt('key_name')`
3. Keys are never exposed to the client
4. Key rotation is supported without data re-encryption
5. Access to vault is logged and auditable

```sql
-- Storing an encrypted secret
INSERT INTO vault.secrets (name, secret)
VALUES ('totp_encryption_key', 'aes256-key-here');

-- Retrieving a secret in a database function
CREATE OR REPLACE FUNCTION encrypt_totp_secret(p_secret TEXT)
RETURNS TEXT
LANGUAGE SQL
AS $$
  SELECT encode(
    vault.encrypt(
      p_secret::bytea,
      (SELECT secret FROM vault.secrets WHERE name = 'totp_encryption_key')::bytea,
      'aes-gcm'
    ),
    'base64'
  );
$$;
```

---

## PII Handling

### Data Classification

| Classification | Examples | Protection Level |
|---|---|---|
| **Public** | Display name, avatar, public profile | Standard |
| **Internal** | Email address, user ID, session data | Encrypted, access-controlled |
| **Confidential** | Date of birth, phone number, IP address | Encrypted, logged access |
| **Restricted** | Parent email (COPPA), backup codes | HSM-encrypted, audit-logged |
| **Prohibited** | SSN, payment card numbers | Never collected |

### PII Minimization

The platform collects only the minimum PII required:

| Data Point | Required? | Purpose |
|---|---|---|
| Email | Yes | Authentication, communication |
| Display name | Yes (can be pseudonym) | Social features |
| Date of birth | Yes | Age verification |
| Phone number | No | Optional recovery/2FA |
| IP address | Collected automatically | Security, rate limiting |
| Device info | Collected automatically | Session management |
| Location (approximate) | Derived from IP | Security, display only |

### Data Anonymization for Analytics

Game performance data is anonymized before use in analytics:

1. User UUID is replaced with a random UUID per analytics pipeline
2. Timestamps are rounded to the nearest hour
3. Device information is aggregated (e.g., "iOS 17.x" instead of exact version)
4. IP addresses are truncated to /24 subnet
5. No PII is included in any analytics dataset

```sql
-- Anonymization function for analytics export
CREATE OR REPLACE FUNCTION anonymize_for_analytics(p_user_id UUID)
RETURNS TABLE (anon_id UUID, game_id UUID, score INT, ts_bucket TIMESTAMPTZ)
LANGUAGE SQL STABLE
AS $$
  SELECT
    md5(random()::text || p_user_id::text)::uuid,
    gs.game_id,
    gs.score,
    date_trunc('hour', gs.created_at)
  FROM game_sessions gs
  WHERE gs.user_id = p_user_id;
$$;
```

---

## Audit Trail

### What Is Logged

All sensitive operations are logged to an immutable audit trail:

| Event | Data Logged |
|---|---|
| Sign-in | user_id, ip, user_agent, provider, success/failure |
| Sign-out | user_id, session_id, reason |
| Password change | user_id, timestamp, initiated_by |
| Profile update | user_id, changed_fields, old_values, new_values |
| Score submission | user_id, game_id, score, session_id, client_hash |
| Achievement unlock | user_id, achievement_id, timestamp |
| Account deletion | user_id, initiated_by, grace_period_end |
| RLS policy violation | user_id, table, operation, attempted_resource |
| Admin action | admin_id, target_user, action, details |

### Audit Log Schema

```sql
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID,
  admin_id UUID,
  resource_type TEXT,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Append-only: No UPDATE or DELETE allowed
CREATE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;

-- Indexes for common queries
CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_event ON audit_log(event_type, created_at DESC);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
```

### Retention

- Audit logs are retained for 7 years (financial compliance)
- Logs older than 7 years are archived to cold storage (S3 Glacier) then deleted
- Audit logs are never modified or deleted from the application layer
- Database administrators cannot modify audit logs (RLS prevents UPDATE/DELETE)

---

## Security Incident Response

### Incident Classification

| Severity | Description | Response Time | Escalation |
|---|---|---|---|
| **SEV-1 (Critical)** | Active data breach, system compromise | 15 minutes | CTO, Legal, All engineering |
| **SEV-2 (High)** | Confirmed vulnerability with exploitation evidence | 1 hour | Security lead, Engineering lead |
| **SEV-3 (Medium)** | Potential vulnerability, no exploitation evidence | 4 hours | Security lead |
| **SEV-4 (Low)** | Minor security issue, minimal impact | 24 hours | Engineering team |

### Response Procedure

1. **Detection & Triage** (0-15 minutes):
   - Alert received (monitoring, user report, external disclosure)
   - Initial severity assessment
   - Incident commander assigned

2. **Containment** (15-60 minutes):
   - Immediate threat mitigation (revoke tokens, block IPs, disable features)
   - Preserve evidence (logs, snapshots, memory dumps)
   - Communication channel opened (war room)

3. **Eradication** (1-24 hours):
   - Root cause analysis
   - Vulnerability remediation
   - Deploy fix to production

4. **Recovery** (1-48 hours):
   - Restore service from clean backups if needed
   - Verify system integrity
   - Re-enable affected features

5. **Post-Incident** (1-7 days):
   - Complete incident report
   - Root cause analysis document
   - Action items for prevention
   - User notification if PII was affected
   - Regulatory notification if required (72 hours for GDPR)

### Communication Templates

Pre-approved templates are maintained for:
- User notification of breach
- Regulatory notification (GDPR Article 33/34)
- Public disclosure
- Internal status updates

---

## Row Level Security (RLS) Deep Dive

### Overview

Row Level Security (RLS) is the backbone of data access control in the FOCUS platform. RLS policies are PostgreSQL features enforced at the database level, meaning that even if application code has bugs, the database prevents unauthorized data access.

RLS is enabled on every table that contains user data. The default policy is deny-all: if no policy matches, the query returns zero rows.

### Policy Naming Conventions

All RLS policies follow a consistent naming convention:

```
{action}_{scope}_{description}
```

**Examples:**
| Policy Name | Action | Scope | Description |
|---|---|---|---|
| `select_owner` | SELECT | owner | Users can read their own data |
| `insert_owner` | INSERT | owner | Users can insert their own data |
| `update_owner` | UPDATE | owner | Users can update their own data |
| `delete_owner` | DELETE | owner | Users can delete their own data |
| `select_friends` | SELECT | friends | Users can read friends' public data |
| `insert_admin` | INSERT | admin | Admins can insert any data |
| `select_service` | SELECT | service | Service role can read all data |

This naming convention makes policies self-documenting and searchable.

### Authenticated vs Anonymous Access

```sql
-- Allow authenticated users to read public profiles
CREATE POLICY "select_authenticated_public_profiles"
  ON profiles FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND visibility = 'public'
  );

-- Allow anonymous users to read public profiles (limited fields)
CREATE POLICY "select_anonymous_public_profiles"
  ON profiles FOR SELECT
  USING (
    auth.role() = 'anon'
    AND visibility = 'public'
  );
```

**Design decision:** Anonymous users can access public profiles (for marketing pages, public leaderboards). The policy restricts which columns are returned via column-level grants (not RLS, but complementary):

```sql
-- Anonymous users can only see display_name and avatar, not email
GRANT SELECT (id, display_name, avatar_url, created_at) ON profiles TO anon;
GRANT SELECT ON profiles TO authenticated;
```

### Owner-Only Policies

The most common pattern: users can only access their own data.

```sql
-- Game sessions: owner-only access
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_owner"
  ON game_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "insert_owner"
  ON game_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_owner"
  ON game_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_owner"
  ON game_sessions FOR DELETE
  USING (auth.uid() = user_id);
```

**Why separate SELECT/INSERT/UPDATE/DELETE policies?**
Each operation has its own policy to allow fine-grained control. For example, users might be able to insert and select their own scores but not update or delete them (scores are immutable after submission).

### Friend-Based Policies

Social features require friend-based access control:

```sql
-- Friends can view each other's public game scores
CREATE POLICY "select_friends_scores"
  ON game_scores FOR SELECT
  USING (
    auth.uid() = user_id  -- Own data
    OR EXISTS (
      SELECT 1 FROM friendships
      WHERE (
        (friendships.user_id = auth.uid() AND friendships.friend_id = game_scores.user_id)
        OR
        (friendships.friend_id = auth.uid() AND friendships.user_id = game_scores.user_id)
      )
      AND friendships.status = 'accepted'
    )
  );
```

**Performance consideration:** The `EXISTS` subquery is efficient because:
1. The `friendships` table has a composite index on `(user_id, friend_id, status)`
2. PostgreSQL uses an index scan, not a sequential scan
3. The correlation between the outer and inner query is optimized by the planner

### Admin Policies

Administrators can access and modify all data:

```sql
-- Admin can read all data
CREATE POLICY "select_admin"
  ON game_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Admin can update any data (for moderation)
CREATE POLICY "update_admin"
  ON game_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
```

**Admin role management:**
- Admin roles are stored in a `user_roles` table
- Only the service role can insert/update/delete admin roles
- Admin role changes are logged in the audit trail
- Maximum 5 admin accounts (prevents role escalation)

### Service Role Bypass

The `service_role` key bypasses all RLS policies. This is necessary for:
- Edge Functions that perform cross-user operations
- Analytics queries that aggregate data across users
- Background jobs (email sending, data cleanup)
- Account deletion (must delete data across multiple tables)

**Guardrails:**
- Service role is never exposed to the client
- Edge Functions use service role only when necessary
- All service role usage is logged
- Regular audits verify that service role is not over-used

```sql
-- Explicitly deny service role access to sensitive tables
-- (Defense in depth: even if service role is compromised)
ALTER TABLE security_events FORCE ROW LEVEL SECURITY;
-- This makes RLS apply even to the service_role user
```

### Performance Considerations for RLS

RLS policies add overhead to every query. The following optimizations are applied:

**1. Index optimization:**
Every column used in RLS policies has an index:

```sql
-- RLS policy uses auth.uid() = user_id
-- Ensure user_id is indexed
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);

-- Friend-based policy uses friendships table
-- Ensure composite index exists
CREATE INDEX idx_friendships_lookup ON friendships(user_id, friend_id, status);
```

**2. Policy simplification:**
Complex policies are refactored into database functions:

```sql
-- Instead of complex inline SQL:
CREATE POLICY "select_friends"
  ON profiles FOR SELECT
  USING (is_friend(auth.uid(), profiles.id));

-- Where is_friend is a stable, indexed function:
CREATE OR REPLACE FUNCTION is_friend(p_user_id UUID, p_target_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM friendships
    WHERE (
      (user_id = p_user_id AND friend_id = p_target_id)
      OR
      (friend_id = p_user_id AND user_id = p_target_id)
    )
    AND status = 'accepted'
  );
$$;
```

**3. Policy caching:**
PostgreSQL caches compiled policy expressions. Policies that reference stable functions benefit from this caching.

**4. Avoiding policy proliferation:**
Each table has a maximum of 8 RLS policies. If more granularity is needed, it is implemented in application-level middleware rather than RLS.

**5. Benchmarking:**
Before deploying new RLS policies, performance is measured:
- Baseline query time without RLS
- Query time with new RLS policies
- Acceptable overhead: <10% for SELECT, <20% for INSERT/UPDATE/DELETE
- If overhead exceeds thresholds, the policy is optimized or moved to application layer

### Testing RLS Policies

Every RLS policy is tested using a comprehensive test suite:

**Test framework:**
Tests are implemented as SQL functions that simulate different user contexts:

```sql
-- Test helper: Set the current user context
CREATE OR REPLACE FUNCTION test.set_user(p_user_id UUID)
RETURNS VOID
LANGUAGE SQL
AS $$
  SET request.jwt.claims = '{"sub": "' || p_user_id || '", "role": "authenticated"}';
  SET role = 'authenticated';
$$;

-- Test helper: Reset to anonymous context
CREATE OR REPLACE FUNCTION test.reset_user()
RETURNS VOID
LANGUAGE SQL
AS $$
  SET request.jwt.claims = '{}';
  SET role = 'anon';
$$;

-- Test: User can only see their own sessions
CREATE OR REPLACE FUNCTION test.rls_select_owner()
RETURNS VOID
LANGUAGE PLPGSQL
AS $$
DECLARE
  v_user1 UUID;
  v_user2 UUID;
  v_count BIGINT;
BEGIN
  -- Create two test users
  INSERT INTO auth.users (id, email) VALUES
    ('11111111-1111-1111-1111-111111111111', 'user1@test.com'),
    ('22222222-2222-2222-2222-222222222222', 'user2@test.com')
  RETURNING id INTO v_user1, v_user2;

  -- Create sessions for both users
  INSERT INTO game_sessions (user_id, game_id, score) VALUES
    (v_user1, '00000000-0000-0000-0000-000000000001', 85),
    (v_user2, '00000000-0000-0000-0000-000000000001', 90);

  -- User 1 should only see their own session
  PERFORM test.set_user(v_user1);
  SELECT count(*) INTO v_count FROM game_sessions;
  ASSERT v_count = 1, 'User 1 should see only 1 session';

  -- User 2 should only see their own session
  PERFORM test.set_user(v_user2);
  SELECT count(*) INTO v_count FROM game_sessions;
  ASSERT v_count = 1, 'User 2 should see only 1 session';

  -- Anonymous should see nothing
  PERFORM test.reset_user();
  SELECT count(*) INTO v_count FROM game_sessions;
  ASSERT v_count = 0, 'Anonymous should see no sessions';

  RAISE NOTICE 'All RLS tests passed';
END;
$$;
```

**Test coverage targets:**
- Every RLS policy has at least 3 test cases (positive, negative, edge case)
- Tests run on every migration (CI pipeline)
- Test failures block deployment
- Monthly RLS audit reviews all policies for correctness

### Common RLS Anti-Patterns

The following anti-patterns are identified and avoided:

1. **Using `auth.email()` in policies**: Email is mutable; always use `auth.uid()` (the UUID)
2. **Checking `auth.role()` without considering service role**: Service role has `role = 'service_role'`, not `'authenticated'`
3. **Overly broad policies**: Policies that allow too much access defeat the purpose of RLS
4. **Missing indexes on policy columns**: Causes full table scans on every query
5. **N+1 policy evaluation**: Policies that trigger additional queries for each row
6. **Forgetting to enable RLS**: Every table with user data must have `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`

---

## Summary

This chapter has defined the complete authentication and security posture of the FOCUS platform. Key decisions:

1. **Supabase Auth** provides battle-tested identity management, reducing our attack surface
2. **Zero-trust** architecture ensures no request is trusted by default
3. **RLS** provides database-level access control that cannot be bypassed by application bugs
4. **Defense in depth** ensures no single point of failure can compromise the system
5. **Privacy by design** ensures user data is minimized, encrypted, and under user control
6. **Compliance** with GDPR, COPPA, and SOC 2 is built into the architecture, not bolted on

The next chapter covers the Game Engine architecture, which builds on this security foundation to deliver cognitive training games with scientific rigor.
