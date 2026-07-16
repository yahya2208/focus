# Chapter 27: Versioning Strategy

## Overview

Versioning is the backbone of release management. A consistent, automated versioning strategy eliminates ambiguity about what changed, when it changed, and how to roll back if something goes wrong. FOCUS adopts Semantic Versioning (SemVer) as the universal versioning scheme across all platform components—web, mobile, desktop, API, and database—and layers on automated tooling to ensure every version bump is intentional, traceable, and atomic across all sources of truth.

---

## 27.1 Semantic Versioning (SemVer) Adoption

### 27.1.1 Format

Every FOCUS artifact follows the **MAJOR.MINOR.PATCH** format:

```
MAJOR.MINOR.PATCH
```

Examples: `1.0.0`, `2.3.17`, `0.4.0-beta.1`

### 27.1.2 MAJOR Version Increments

The MAJOR version increments when **any** breaking change is introduced. A breaking change is defined as any modification that requires action from consumers (users, integrators, or downstream services) to continue functioning correctly.

**Breaking changes include:**

- **Database schema changes** that remove or rename existing columns, alter column types in a non-compatible way, drop tables, or change constraint definitions. Any migration that cannot be applied forward without application-level awareness constitutes a breaking change.
- **API breaking changes**: Removing or renaming endpoints, changing request/response schemas in non-additive ways, altering authentication mechanisms, changing error response formats, modifying rate limit semantics, or removing deprecated fields.
- **UI breaking changes**: Removing navigation elements, changing layout structures that break user workflows, removing features entirely, or altering keyboard shortcuts and gesture mappings.
- **SDK/library breaking changes**: Removing exported functions, changing function signatures, altering return types, or removing configuration options.
- **Desktop API breaking changes**: Altering IPC channel names, changing invoke command signatures, modifying event payloads between frontend and Tauri core.

**Examples of MAJOR bumps:**

```
1.2.3 → 2.0.0  (removed legacy API endpoint /api/v1/users/legacy)
3.1.0 → 4.0.0  (redesigned game data schema, existing save data incompatible)
0.9.2 → 1.0.0  (initial stable release, first public launch)
```

### 27.1.3 MINOR Version Increments

The MINOR version increments when **new functionality** is added in a **backward-compatible** manner. Existing consumers continue to work without modification.

**MINOR changes include:**

- **New games or game modes**: Adding a completely new cognitive training game (e.g., a new memory game) to the existing game library.
- **New features**: Adding dark mode, adding export functionality, adding new analytics dashboards, adding notification preferences.
- **New content**: Adding new difficulty levels, new puzzle sets, new achievement types, new streak categories.
- **New API endpoints**: Adding `/api/v1/games/new-game` alongside existing endpoints.
- **New database columns**: Adding nullable columns or columns with defaults to existing tables.
- **New configuration options**: Adding settings that have sensible defaults and do not alter existing behavior.
- **New mobile platform support**: Adding iPad-specific layouts, adding Android tablet support.

**Examples of MINOR bumps:**

```
2.1.0 → 2.2.0  (added new "Pattern Match" game)
2.2.0 → 2.3.0  (added dark mode toggle in settings)
2.3.0 → 2.4.0  (added CSV export for progress data)
```

### 27.1.4 PATCH Version Increments

The PATCH version increments for **backward-compatible bug fixes**, security patches, and performance improvements that do not add new functionality or change existing behavior.

**PATCH changes include:**

- **Bug fixes**: Fixing a crash on game completion, fixing a timer that drifted by 200ms, fixing a layout issue on specific screen sizes.
- **Security patches**: Upgrading a dependency with a known CVE, patching an XSS vulnerability, fixing an authentication bypass.
- **Performance improvements**: Optimizing database queries, reducing bundle size, improving render performance, reducing memory usage.
- **Text/content corrections**: Fixing typos in UI text, correcting help documentation.
- **Dependency updates**: Upgrading libraries to patch versions (e.g., `lodash 4.17.21 → 4.17.22`).

**Examples of PATCH bumps:**

```
2.3.0 → 2.3.1  (fixed timer drift issue on Android 14)
2.3.1 → 2.3.2  (patched XSS vulnerability in profile input)
2.3.2 → 2.3.3  (optimized game state serialization for large profiles)
```

### 27.1.5 Pre-release Versions

Pre-release versions use a hyphen suffix and are used during development cycles before a stable release:

```
MAJOR.MINOR.PATCH-tag.N
```

**Pre-release tags:**

| Tag | Purpose | Stability | Distribution |
|-----|---------|-----------|-------------|
| `alpha.N` | Internal development builds | Low – may contain known bugs | Internal team only |
| `beta.N` | External beta testing | Medium – feature complete, known issues | Beta testers |
| `rc.N` | Release candidate | High – potential release candidate | QA + stakeholders |

**Pre-release ordering:**

```
1.0.0-alpha.1 < 1.0.0-alpha.2 < 1.0.0-beta.1 < 1.0.0-beta.2 < 1.0.0-rc.1 < 1.0.0-rc.2 < 1.0.0
```

**Pre-release examples:**

```
2.4.0-alpha.1   (first internal build of new feature)
2.4.0-alpha.2   (fixed alpha.1 crash)
2.4.0-beta.1    (feature complete, sent to beta testers)
2.4.0-beta.2    (fixed beta.1 feedback items)
2.4.0-rc.1      (candidate for production)
2.4.0-rc.2      (minor fix found during RC testing)
2.4.0            (stable release)
```

---

## 27.2 Version Sources of Truth

FOCUS maintains **six** sources of truth for version information. All must be updated atomically during a version bump. The versioning automation tooling ensures this consistency.

### 27.2.1 package.json (npm Version)

```json
{
  "name": "@focus/platform",
  "version": "2.4.0",
  "private": true
}
```

This is the **canonical version** for the web application and the overall FOCUS platform. All other sources derive from or synchronize with this value. The `private: true` flag prevents accidental publication to npm.

### 27.2.2 tauri.conf.json (Desktop Version)

```json
{
  "package": {
    "version": "2.4.0"
  },
  "tauri": {
    "updater": {
      "endpoints": [
        "https://releases.focus.app/{{target}}/{{arch}}/{{current_version}}"
      ]
    }
  }
}
```

The Tauri configuration drives the desktop application version displayed to users and used by the auto-update mechanism. This version must match `package.json` exactly at all times.

### 27.2.3 capacitor.config.ts (Mobile Version)

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.focus.app',
  appName: 'FOCUS',
  webDir: 'dist',
  android: {
    buildOptions: {
      versionName: '2.4.0',
      versionCode: 20400
    }
  },
  ios: {
    buildOptions: {
      version: '2.4.0',
      buildNumber: '20400'
    }
  }
};

export default config;
```

Mobile versioning requires **two** version values: the human-readable SemVer string and a monotonically increasing integer build number. The Capacitor configuration bridges the web version to native platform requirements.

### 27.2.4 Database Migrations Directory

```
supabase/migrations/
  20250101000000_initial_schema.sql
  20250215143000_add_game_sessions_table.sql
  20250301090000_add_user_preferences.sql
  ...
```

Database schema version is tracked implicitly through the ordered migration files. The **latest migration timestamp** serves as the effective database version. This is recorded in the `supabase_migrations` table within the database itself.

### 27.2.5 Service Worker Cache Version

```typescript
// src/sw.js or vite-plugin-pwa config
const CACHE_VERSION = 'focus-v2.4.0';
const CACHE_NAME = `focus-cache-${CACHE_VERSION}`;
```

The service worker cache version ensures that when a new version is deployed, all cached assets from the previous version are invalidated. This version must be bumped on every release, including PATCH releases, to guarantee users receive the latest code.

### 27.2.6 Native Platform Build Numbers

**iOS (Info.plist or Xcode project):**

```xml
<key>CFBundleShortVersionString</key>
<string>2.4.0</string>
<key>CFBundleVersion</key>
<string>20400</string>
```

**Android (build.gradle):**

```groovy
android {
    defaultConfig {
        versionName "2.4.0"
        versionCode 20400
    }
}
```

The integer build number (`CFBundleVersion` on iOS, `versionCode` on Android) **must increase monotonically** with every build submitted to the respective app store. The SemVer string is what users see; the build number is what the stores use for ordering.

---

## 27.3 Version Bumping Process

### 27.3.1 Changesets for Automated Version Management

FOCUS uses [Changesets](https://github.com/changesets/changesets) to manage version transitions. Changesets decouple the act of describing changes from the act of bumping versions.

**Creating a changeset:**

```bash
pnpm changeset
```

This prompts the developer to:

1. Select which packages are affected (in FOCUS, typically `@focus/platform`).
2. Choose the bump type: **major**, **minor**, or **patch**.
3. Write a human-readable description of the change.

The changeset is saved as a markdown file in the `.changeset/` directory:

```markdown
---
"@focus/platform": minor
---

Added the new "Pattern Match" game with three difficulty levels and progressive scoring.
```

### 27.3.2 PR Labels That Trigger Version Bumps

Pull requests are labeled to indicate the intended version impact. The CI pipeline reads these labels and generates the appropriate changeset if one is not already present.

| PR Label | Bump Type | Example |
|----------|-----------|---------|
| `breaking-change` | MAJOR | Redesigning the entire API response format |
| `feature` or `enhancement` | MINOR | Adding a new game, new settings page |
| `bugfix`, `hotfix`, `security`, `performance` | PATCH | Fixing a crash, patching CVE, optimizing queries |

**Label precedence:** If a PR carries multiple labels (e.g., `feature` + `breaking-change`), the highest bump type wins. `breaking-change` always takes precedence.

### 27.3.3 Changeset PR Creates Version Bump PR

The CI workflow operates as follows:

1. **Developer creates PR** with changeset file and/or appropriate labels.
2. **CI validates** the PR: checks that a changeset exists, validates the changeset file format, ensures the bump type matches the PR labels.
3. **PR is merged** to `develop` (or `main` for hotfixes).
4. **Changeset bot** (`changeset-bot`) detects that changesets have accumulated and opens a **"Version Packages" PR**.
5. **"Version Packages" PR** contains:
   - Updated `package.json` version
   - Updated `tauri.conf.json` version
   - Updated `capacitor.config.ts` version
   - Updated native build numbers
   - Updated service worker cache version
   - Generated `CHANGELOG.md` entries from changeset descriptions
   - All changeset files consumed (deleted from `.changeset/`)
6. **Team reviews** the "Version Packages" PR to verify the version bump is correct.
7. **PR is merged**, triggering the release pipeline.
8. **Release pipeline** creates a Git tag, builds all artifacts, and deploys to the appropriate channels.

### 27.3.4 Atomic Version Updates

All six version sources of truth are updated **simultaneously** within the "Version Packages" PR. No partial updates are permitted. The version update script:

```bash
#!/bin/bash
# scripts/bump-version.sh
NEW_VERSION=$1

# Validate SemVer format
if ! [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
  echo "Invalid SemVer format: $NEW_VERSION"
  exit 1
fi

# Calculate build number from version (MAJOR * 10000 + MINOR * 100 + PATCH)
MAJOR=$(echo $NEW_VERSION | cut -d. -f1)
MINOR=$(echo $NEW_VERSION | cut -d. -f2)
PATCH=$(echo $NEW_VERSION | cut -d. -f3 | cut -d- -f1)
BUILD_NUMBER=$((MAJOR * 10000 + MINOR * 100 + PATCH))

# Update all sources atomically
pnpm version $NEW_VERSION --no-git-tag-version

# Update Tauri config
npx json -I -f src-tauri/tauri.conf.json -e "this.package.version='$NEW_VERSION'"

# Update Capacitor config
sed -i "s/versionName: '[^']*'/versionName: '$NEW_VERSION'/" capacitor.config.ts
sed -i "s/versionCode: [0-9]*/versionCode: $BUILD_NUMBER/" capacitor.config.ts

# Update service worker cache
sed -i "s/focus-v[^\"]*/focus-v$NEW_VERSION/" src/sw.js

# Commit all changes
git add -A
git commit -m "chore: version bump to $NEW_VERSION"
git tag "v$NEW_VERSION"
```

---

## 27.4 Release Channels

FOCUS maintains five distinct release channels, each serving a specific purpose in the release lifecycle.

### 27.4.1 Alpha Channel

**Trigger:** Every push to the `develop` branch.
**Audience:** Internal FOCUS team only.
**Purpose:** Validate that new code compiles, deploys, and passes smoke tests.

**Characteristics:**
- Automatically built and deployed on every merge to `develop`.
- Version format: `X.Y.Z-alpha.N` where N is the CI run number.
- Deployed to a private staging environment.
- Mobile builds distributed via TestFlight (internal group) and Firebase App Distribution.
- Desktop builds available on an internal download page with authentication.
- Known to be unstable; regressions are expected and acceptable.
- No user-facing notification of availability.
- Automated E2E test suite must pass before deployment.

### 27.4.2 Beta Channel

**Trigger:** Weekly scheduled build (every Monday at 09:00 UTC) or manual trigger.
**Audience:** External beta testers (opt-in community of ~200-500 users).
**Purpose:** Gather real-world feedback on new features before stable release.

**Characteristics:**
- Version format: `X.Y.Z-beta.N`.
- Built from `develop` branch, manually promoted by release manager.
- iOS: Distributed via TestFlight (external group, up to 10,000 testers).
- Android: Distributed via Google Play internal testing track, then closed testing.
- Desktop: Distributed via a dedicated beta download page with automatic update channel.
- Beta testers receive an in-app prompt to enable the beta update channel.
- Feedback mechanism: In-app feedback button that submits screenshots, logs, and user description.
- Beta period: Minimum 1 week before promotion to RC.
- Maximum beta period: 4 weeks before decision to release or defer.
- Beta changelog published alongside the build.

### 27.4.3 Release Candidate (RC) Channel

**Trigger:** Manual promotion from beta by release manager after QA sign-off.
**Audience:** QA team, stakeholders, and select power users.
**Purpose:** Final validation before production release.

**Characteristics:**
- Version format: `X.Y.Z-rc.N`.
- Code-frozen: No new features, only critical bug fixes.
- Built from `release/X.Y.Z` branch.
- Must pass full regression test suite.
- Performance benchmarks must meet or exceed previous stable release.
- Security scan must pass with zero critical/high findings.
- App store metadata and screenshots must be finalized.
- RC period: Minimum 3 days, maximum 2 weeks.
- If critical bugs found, RC increments (`rc.1` → `rc.2`) and clock resets.
- If no issues found after minimum period, promoted to stable.

### 27.4.4 Stable Channel

**Trigger:** Promotion from RC after QA and stakeholder approval.
**Audience:** All users (100% rollout).
**Purpose:** Production release for end users.

**Characteristics:**
- Version format: `X.Y.Z` (no tag suffix).
- Deployed via phased rollout:
  - **Phase 1** (Day 1): 1% of users via app store progressive rollout.
  - **Phase 2** (Day 2): 10% of users.
  - **Phase 3** (Day 3-4): 50% of users.
  - **Phase 4** (Day 5+): 100% of users.
- Rollback capability at every phase.
- Monitoring dashboards active during each phase.
- Incident response team on standby during Phase 1-2.
- Desktop: Full update available immediately (Tauri updater pushes to all users).
- Web: Deployed instantly (CDN propagation within minutes).
- Changelog published to website, in-app, and social media.

### 27.4.5 Long-Term Support (LTS) Channel

**Trigger:** Critical security vulnerability affecting old versions.
**Audience:** Users on older major versions who cannot immediately upgrade.
**Purpose:** Provide critical security patches for users stuck on older versions.

**Characteristics:**
- Version format: `X.Y.Z-lts.N`.
- Only security patches and critical bug fixes.
- No new features, no minor improvements.
- Maintained for the **current and previous** major version only.
- LTS support window: 6 months after the next major version release.
- After LTS window expires, users receive a mandatory upgrade prompt.
- LTS builds are manually constructed and tested.
- Dedicated LTS branch: `lts/X.Y`.

---

## 27.5 Database Migration Strategy

### 27.5.1 Migration File Structure

Every database schema change requires a migration file. Migrations are stored in `supabase/migrations/` and are applied in chronological order.

**Naming convention:**

```
YYYYMMDDHHMMSS_descriptive_name.sql
```

**Examples:**

```
20250101000000_initial_schema.sql
20250215143000_add_game_sessions_table.sql
20250301090000_add_user_preferences_column.sql
20250410160000_create_analytics_events_table.sql
20250515110000_add_game_difficulty_levels.sql
```

The timestamp prefix guarantees ordering and prevents naming collisions when multiple developers create migrations simultaneously.

### 27.5.2 Forward-Only Migrations

FOCUS uses **forward-only migrations** in production. This means:

- **No `DOWN` migrations** are run against production databases.
- Every migration must be designed to be applied cleanly on a fresh database.
- If a change needs to be "reversed," a new migration is created that undoes the previous change.
- Rollbacks are handled at the application level, not the database level.

**Rationale:** Down migrations are dangerous in production because they may lose data, may not be idempotent, and create complex dependency chains. Forward-only is simpler, safer, and easier to reason about.

### 27.5.3 Zero-Downtime Migrations

FOCUS targets zero-downtime deployments, which requires migrations to be backward-compatible with the current application version. The expand-contract pattern is used:

**Phase 1 — Expand:**
```sql
-- Add new column with a default value
ALTER TABLE games ADD COLUMN difficulty_level INTEGER DEFAULT 1;
```

**Phase 2 — Backfill:**
```sql
-- Run as a background job, not in the migration
UPDATE games SET difficulty_level = 1 WHERE difficulty_level IS NULL;
```

**Phase 3 — Contract (next release):**
```sql
-- Only after all code references the new column exclusively
ALTER TABLE games DROP COLUMN old_difficulty_field;
```

Each phase is a separate migration, separated by at least one release cycle. This ensures the old application code can run against the new schema during the transition period.

### 27.5.4 Big Migrations

Migrations that modify large tables (millions of rows) must be handled carefully:

- **Run in background**: Use `pg_background` or a scheduled job, not the migration runner.
- **Batch updates**: Process rows in batches of 1000-5000 to avoid locking the table.
- **Progress tracking**: Log progress so operators can monitor and estimate completion.
- **Resumable**: Design migrations to be resumable if interrupted.
- **Non-blocking**: Use `CREATE INDEX CONCURRENTLY` instead of `CREATE INDEX`.
- **Statement timeout**: Set generous timeouts (e.g., `SET statement_timeout = '1h'`).

**Example of a big migration:**

```sql
-- Migration: 20250601120000_backfill_game_analytics.sql
-- NOTE: This migration runs as a background job

DO $$
DECLARE
  batch_size INT := 5000;
  affected INT;
BEGIN
  LOOP
    UPDATE game_sessions
    SET computed_score = calculate_score(id)
    WHERE id IN (
      SELECT id FROM game_sessions
      WHERE computed_score IS NULL
      LIMIT batch_size
    );
    
    GET DIAGNOSTICS affected = ROW_COUNT;
    RAISE NOTICE 'Updated % rows', affected;
    
    EXIT WHEN affected = 0;
    
    PERFORM pg_sleep(0.1);  -- Brief pause to reduce load
  END LOOP;
END $$;
```

### 27.5.5 Migration Testing

Every migration must be tested before production deployment:

1. **Local testing**: Apply migration to a local database seeded with realistic data.
2. **Staging testing**: Apply migration to a staging database that mirrors production schema and data volume.
3. **Performance testing**: Measure migration duration on staging. If > 5 minutes, redesign as a background job.
4. **Rollback testing**: Verify that if the migration fails midway, the database is in a consistent state (or can be restored from backup).
5. **Compatibility testing**: Run the previous version of the application against the new schema to verify backward compatibility.

### 27.5.6 Migration Rollback (Emergency Only)

In extreme cases, a migration may need to be rolled back:

- **Trigger**: Production data loss, severe performance degradation, or application failure.
- **Process**: 
  1. Roll back the application to the previous version first.
  2. Assess whether the migration itself needs reversal.
  3. If yes, create a new forward migration that undoes the change (do NOT use `DOWN`).
  4. Test the rollback migration on staging before applying to production.
  5. Coordinate with on-call engineers and communicate to stakeholders.
- **Time limit**: Rollback decision must be made within 15 minutes of incident detection.
- **Post-incident**: Conduct a blameless post-mortem within 48 hours.

---

## 27.6 Mobile Versioning

### 27.6.1 iOS Versioning

iOS applications have two version identifiers:

| Field | Key | Format | Purpose |
|-------|-----|--------|---------|
| Marketing Version | `CFBundleShortVersionString` | SemVer (`2.4.0`) | User-facing version shown in App Store and Settings |
| Build Number | `CFBundleVersion` | Integer (`20400`) | Internal identifier, must increase with every build |

**Monotonic increase requirement:** Both values must increase monotonically for every build submitted to TestFlight or the App Store. You cannot submit a build with a lower build number than any previously submitted build, even for the same marketing version.

**Build number derivation:**

```
Build Number = MAJOR * 10000 + MINOR * 100 + PATCH
```

For pre-release builds, append the alpha/beta/rc number:

```
2.4.0-beta.1 → Build 20401
2.4.0-beta.2 → Build 20402
2.4.0-rc.1   → Build 20403
2.4.0        → Build 20404
2.4.1        → Build 20405
```

**Xcode configuration:**

```ruby
# fastlane/Fastfile
lane :bump_version do |options|
  version = options[:version]
  build_number = options[:build_number]
  
  increment_version_number(
    version_number: version,
    xcodeproj: "ios/App/App.xcodeproj"
  )
  
  increment_build_number(
    build_number: build_number,
    xcodeproj: "ios/App/App.xcodeproj"
  )
end
```

### 27.6.2 Android Versioning

Android also has two version identifiers:

| Field | Key | Format | Purpose |
|-------|-----|--------|---------|
| Version Name | `versionName` | SemVer (`2.4.0`) | User-facing version string |
| Version Code | `versionCode` | Integer (`20400`) | Internal identifier, must increase monotonically |

**Google Play requirement:** Each uploaded APK or AAB must have a `versionCode` greater than all previously uploaded versions for that app.

**Gradle configuration:**

```groovy
android {
    defaultConfig {
        applicationId "com.focus.app"
        versionName "2.4.0"
        versionCode 20400
    }
}

// Automated version bumping
tasks.register('bumpVersion') {
    doLast {
        def versionFile = file('version.properties')
        def props = new Properties()
        props.load(versionFile.newReader())
        
        def versionName = project.findProperty('versionName') ?: '2.4.0'
        def versionCode = project.findProperty('versionCode') ?: '20400'
        
        props.setProperty('VERSION_NAME', versionName)
        props.setProperty('VERSION_CODE', versionCode)
        props.store(versionFile.newWriter(), 'Auto-generated version properties')
    }
}
```

### 27.6.3 Cross-Platform Version Synchronization

The Capacitor configuration bridges web and native versions:

```typescript
// capacitor.config.ts
const version = process.env.FOCUS_VERSION || '2.4.0';
const buildNumber = process.env.FOCUS_BUILD_NUMBER || '20400';

const config: CapacitorConfig = {
  appId: 'com.focus.app',
  appName: 'FOCUS',
  webDir: 'dist',
  android: {
    buildOptions: {
      versionName: version,
      versionCode: parseInt(buildNumber)
    }
  },
  ios: {
    buildOptions: {
      version: version,
      buildNumber: buildNumber
    }
  }
};

export default config;
```

---

## 27.7 Desktop Versioning

### 27.7.1 Tauri Auto-Update Mechanism

FOCUS desktop uses Tauri's built-in updater for automatic updates:

**Update check flow:**

1. Application starts and checks for updates against `https://releases.focus.app/{target}/{arch}/{current_version}`.
2. The server responds with the latest version info if a newer version exists.
3. If the response indicates a newer version, the application prompts the user to update (or auto-updates silently for critical patches).
4. The update is downloaded, verified, and applied.

**Tauri updater configuration:**

```json
{
  "tauri": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://releases.focus.app/{{target}}/{{arch}}/{{current_version}}"
      ],
      "pubkey": "dW50cnVzdGVkIG1lc3NhZ2UgZm9yIHNpZ25hdHVyZSB2ZXJpZmljYXRpb24="
    }
  }
}
```

### 27.7.2 Delta Updates

When possible, FOCUS distributes delta updates (only the changed files) rather than full updates:

- **Delta update**: Typically 1-10 MB for PATCH releases.
- **Full update**: Full application size (50-80 MB).
- **Delta eligibility**: Available for updates within the same MAJOR version.
- **Fallback**: If delta update fails or is unavailable, automatically fall back to full update.

### 27.7.3 Signature Verification

Every update package is signed with a private key:

```typescript
// Update verification in Tauri core
// The public key is embedded in the application binary
// Updates are rejected if signature verification fails
```

The signing key pair:
- **Private key**: Stored in CI/CD secrets (GitHub Actions encrypted secrets).
- **Public key**: Embedded in the application at build time.
- **Key rotation**: New key pair generated annually; old public key retained for verification of updates signed with the old key.

### 27.7.4 Critical Update Mechanism

For security-critical updates, FOCUS can force updates:

```json
{
  "forceUpdate": true,
  "minRequiredVersion": "2.4.1",
  "message": "A critical security update is required. Please update to continue using FOCUS."
}
```

**Force update behavior:**
- Application blocks all functionality until the update is applied.
- User cannot dismiss the update prompt.
- Update downloads and installs automatically.
- Application restarts after installation.
- Used only for: critical security vulnerabilities, data loss bugs, legal compliance requirements.

---

## 27.8 API Versioning

### 27.8.1 URL-Based Versioning

FOCUS API uses URL path-based versioning:

```
https://api.focus.app/v1/games
https://api.focus.app/v1/sessions
https://api.focus.app/v2/games       (hypothetical future version)
```

**Current version:** `v1`

**Routing:**

```typescript
// src/api/router.ts
import { Router } from 'express';

const v1Router = Router();
const v2Router = Router();

// v1 routes
v1Router.get('/games', v1ListGames);
v1Router.get('/sessions', v1ListSessions);

// v2 routes (future)
v2Router.get('/games', v2ListGames);

app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);
```

### 27.8.2 Breaking Changes Trigger New Version

A new API version is created when any of the following occur:

- Removing an endpoint
- Renaming an endpoint
- Changing the structure of a response object (removing or renaming fields)
- Changing the type of a field (e.g., string to integer)
- Changing authentication requirements
- Changing error response formats
- Changing pagination behavior
- Changing rate limit semantics

**Non-breaking changes** (do NOT require a new version):

- Adding new endpoints
- Adding new optional fields to responses
- Adding new query parameters
- Adding new headers
- Adding new error codes
- Adding new enum values

### 27.8.3 Version Deprecation Policy

When a new API version is released:

1. **Day 0**: New version deployed. Old version continues to function.
2. **Day 0 + 30 days**: Deprecation headers added to old version responses.
3. **Day 0 + 6 months**: Old version enters "maintenance mode" (no new features, security fixes only).
4. **Day 0 + 12 months**: Old version is retired. All requests receive `410 Gone`.

**Deprecation headers:**

```http
HTTP/1.1 200 OK
Deprecation: Sat, 01 Jul 2025 00:00:00 GMT
Sunset: Wed, 01 Jan 2026 00:00:00 GMT
Link: <https://docs.focus.app/api/v2>; rel="successor-version"
```

---

## 27.9 Feature Flags for Versioning

### 27.9.1 Feature Flag System

FOCUS uses feature flags to decouple code deployment from feature release:

```typescript
// src/lib/feature-flags.ts
import { PostHog } from 'posthog-js';

export function isFeatureEnabled(
  flag: string, 
  userId: string, 
  fallback: boolean = false
): boolean {
  return PostHog.isFeatureEnabled(flag, { distinct_id: userId }) ?? fallback;
}

// Usage in components
if (isFeatureEnabled('new-pattern-game', user.id)) {
  renderNewPatternGame();
} else {
  renderLegacyPatternGame();
}
```

### 27.9.2 Gradual Rollout

New features are rolled out progressively:

| Stage | Percentage | Duration | Monitoring |
|-------|-----------|----------|------------|
| 1 | 1% | 24-48 hours | Crash rates, error rates, performance |
| 2 | 10% | 48-72 hours | User engagement, feedback |
| 3 | 50% | 1 week | Full metrics comparison vs. control |
| 4 | 100% | Permanent | Ongoing monitoring |

### 27.9.3 Kill Switch

Every feature flag has an associated kill switch:

```typescript
// Emergency kill switch (no deployment required)
// PostHog flag set to false instantly disables the feature

// Kill switch also defined in code for defense in depth
const KILL_SWITCHES = {
  'new-pattern-game': process.env.KILL_SWITCH_NEW_PATTERN_GAME === 'true',
};
```

If a feature causes issues, the kill switch is activated within minutes, disabling the feature for all users without requiring a new release.

### 27.9.4 Feature Flag Cleanup

After a feature flag reaches 100% rollout and has been stable for 2 release cycles:

1. The feature flag evaluation code is replaced with `true` (or the feature is assumed to always be on).
2. The old code path (the `false` branch) is removed.
3. The feature flag is deleted from the feature flag service.
4. A PR titled `chore: remove feature flag {flag-name}` is created.
5. The cleanup PR is merged within one release cycle.

---

## 27.10 Changelog

### 27.10.1 Automated Generation

Changelogs are generated automatically from PR titles using [Conventional Commits](https://www.conventionalcommits.org/) and changeset descriptions:

```markdown
# Changelog

## [2.4.0] - 2025-04-15

### Added
- New "Pattern Match" game with three difficulty levels
- Dark mode support across all screens
- CSV export for progress and session data

### Changed
- Improved game loading performance by 40%
- Updated onboarding flow for new users

### Deprecated
- Legacy profile export format (will be removed in 3.0.0)

### Removed
- Removed deprecated `/api/v1/stats/legacy` endpoint

### Fixed
- Fixed timer drift on Android 14 devices
- Fixed crash when completing a game session during network loss
- Fixed profile picture upload failing for images over 5MB

### Security
- Updated `jsonwebtoken` to patch CVE-2025-1234
- Patched XSS vulnerability in user profile bio field
```

### 27.10.2 Changelog Locations

| Location | Format | Update Frequency |
|----------|--------|-----------------|
| `CHANGELOG.md` (root of repo) | Full detailed changelog | Every release |
| App Store release notes | Condensed user-facing notes | Every store submission |
| Google Play release notes | Condensed user-facing notes | Every store submission |
| In-app changelog | User-friendly version with links | Every stable release |
| Website `/changelog` | Full detailed changelog with anchor links | Every release |
| GitHub Releases | Git tag + full changelog | Every release |

### 27.10.3 In-App Changelog

```typescript
// src/components/Changelog.tsx
interface ChangelogEntry {
  version: string;
  date: string;
  sections: {
    title: string;
    items: string[];
  }[];
}

function Changelog() {
  const entries = useChangelogEntries();
  const lastSeenVersion = useLastSeenChangelogVersion();
  
  return (
    <div className="changelog">
      {entries.map(entry => (
        <ChangelogEntry 
          key={entry.version} 
          entry={entry}
          isNew={isNewerThan(entry.version, lastSeenVersion)}
        />
      ))}
    </div>
  );
}
```

The in-app changelog shows a "What's New" indicator after a version update, prompting users to view the changelog.

---

## 27.11 Compatibility Matrix

### 27.11.1 Web Platform

| Aspect | Policy |
|--------|--------|
| Browser support | Latest 2 versions of Chrome, Firefox, Safari, Edge |
| Version pinning | None — always served the latest build |
| Cache invalidation | Service worker cache version bump forces revalidation |
| CDN | Instant propagation, no version skew |
| Fallback | N/A — web is always current |

### 27.11.2 Mobile Platforms

| Platform | Supported Versions |
|----------|-------------------|
| iOS | Last 3 major OS versions (iOS 16, 17, 18) |
| Android | Last 3 major OS versions (Android 12, 13, 14) |
| App store minimum | Set via `MinimumOSVersion` (iOS) and `minSdkVersion` (Android) |
| Forced update | If user is on unsupported OS, prompt to update OS or use web |

### 27.11.3 Desktop Platforms

| Platform | Supported Versions |
|----------|-------------------|
| Windows | Last 2 major versions (Windows 11, Windows 10) |
| macOS | Last 2 major versions (Sonoma, Ventura) |
| Linux | Current LTS distributions (Ubuntu 22.04+, Fedora 38+) |

### 27.11.4 API Compatibility

| Aspect | Policy |
|--------|--------|
| Current version | v1 (always fully supported) |
| Previous version | Supported with deprecation warnings |
| Support window | 12 months from deprecation announcement |
| Breaking change notice | Minimum 6 months before version retirement |
| Documentation | Both current and previous version documented |

### 27.11.5 Database Compatibility

| Aspect | Policy |
|--------|--------|
| Migration direction | Forward only |
| Backward compatibility | All migrations are backward-compatible with previous app version |
| PostgreSQL version | Support 2 minor versions behind latest stable |
| Schema versioning | Implied by migration file timestamps |
| Rollback | Emergency only, via new forward migration |

---

## 27.12 Versioning Governance

### 27.12.1 Version Authority

- **Release Manager**: Final authority on version numbers and release timing.
- **Lead Engineer**: Approves version bump PRs.
- **CI/CD Pipeline**: Automated enforcement of version consistency.

### 27.12.2 Exceptional Versioning

In rare cases where normal process cannot be followed (e.g., emergency security patch):

1. Hotfix branch created from `main`.
2. Release Manager manually determines version bump.
3. All six sources of truth updated in the hotfix PR.
4. Expedited review (single approval from Release Manager or Lead Engineer).
5. Post-hoc changeset created for changelog.

### 27.12.3 Version Skew Prevention

CI/CD pipeline validates version consistency at multiple points:

```yaml
# .github/workflows/validate-versions.yml
- name: Validate version consistency
  run: |
    PKG_VERSION=$(node -p "require('./package.json').version")
    TAURI_VERSION=$(node -p "require('./src-tauri/tauri.conf.json').package.version")
    CAP_VERSION=$(grep -o "versionName: '[^']*'" capacitor.config.ts | cut -d"'" -f2)
    
    if [ "$PKG_VERSION" != "$TAURI_VERSION" ] || [ "$PKG_VERSION" != "$CAP_VERSION" ]; then
      echo "Version mismatch: package.json=$PKG_VERSION, tauri=$TAURI_VERSION, capacitor=$CAP_VERSION"
      exit 1
    fi
    
    echo "All versions consistent: $PKG_VERSION"
```

---

## 27.13 Summary

FOCUS's versioning strategy provides:

- **Single source of truth**: SemVer in `package.json` propagated to all six version sources.
- **Automated process**: Changesets + CI/CD ensures atomic, consistent version bumps.
- **Five release channels**: alpha → beta → rc → stable → lts for progressive delivery.
- **Zero-downtime database migrations**: Expand-contract pattern with forward-only migrations.
- **Platform-specific handling**: Native build numbers for mobile, Tauri updater for desktop, CDN for web.
- **API versioning with deprecation**: URL-based versioning with 12-month support window.
- **Feature flags**: Decouple deployment from release with gradual rollout and kill switches.
- **Automated changelogs**: Generated from conventional commits and changeset descriptions.
- **Compatibility matrix**: Clear support policies for web, mobile, desktop, API, and database.

Every version bump is intentional, traceable, and validated. No version source is ever updated manually — automation ensures atomicity and consistency across all platforms and services.
