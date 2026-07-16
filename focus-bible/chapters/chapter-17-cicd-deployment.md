# Chapter 17: CI/CD & Deployment

## 17.1 CI/CD Philosophy

The FOCUS platform operates under a strict continuous integration and continuous deployment philosophy. Every code change is validated automatically, every pull request receives the full test suite, and every merge to a deployment branch triggers a production-grade deployment pipeline. There are no exceptions.

The core principles governing our CI/CD approach:

**Every commit triggers CI.** There is no such thing as a "quick fix" that skips validation. If a change cannot pass the full CI pipeline, it does not ship. This applies equally to documentation updates, dependency bumps, and configuration changes. The CI pipeline is the single source of truth for whether code is safe to deploy.

**Every PR gets the full test suite.** Pull requests run linting, type checking, unit tests, integration tests, end-to-end tests, security scans, accessibility checks, and build verification. A PR that passes all checks is considered deployable. A PR that fails any check is blocked from merging.

**Deploy to staging on merge to develop.** The develop branch represents the current state of the next release. Merging to develop triggers a full staging deployment including database migrations, edge function deployment, and web application deployment. Staging is a production mirror, not a reduced environment.

**Deploy to production on merge to main.** The main branch represents the current production state. Merging to main triggers a production deployment with additional safety checks including full browser test coverage, performance benchmarks, and post-deployment monitoring.

**Rollback capability within 5 minutes.** Every deployment can be rolled back within 5 minutes. This is not aspirational—it is a hard requirement. Vercel provides instant rollback for web. Capacitor mobile apps use staged rollouts that can be halted. Tauri desktop apps use the auto-update system to push previous versions. Database migrations always include rollback scripts.

**Zero-downtime deployments.** The platform never goes offline during deployment. Vercel uses atomic deployments with instant switchover. Supabase Edge Functions deploy without cold starts. Database migrations use expand-contract patterns. Mobile and desktop apps use staged rollouts.

---

## 17.2 CI Pipeline Architecture (GitHub Actions)

The CI pipeline consists of three distinct workflows, each triggered by different events and serving different purposes. The pipeline is designed for speed in PR validation (target: under 8 minutes) and thoroughness in deployment validation (target: under 20 minutes).

### 17.2.1 Pipeline 1: PR Validation

This pipeline runs on every pull request targeting `develop` or `main`. It is the gatekeeper for all code changes. The pipeline is split into parallel jobs to minimize total run time.

**Trigger:** `pull_request` events on `develop` and `main` branches.

```yaml
name: PR Validation
on:
  pull_request:
    branches: [develop, main]
    types: [opened, synchronize, reopened]

concurrency:
  group: pr-${{ github.event.pull_request.number }}
  cancel-in-progress: true

env:
  NODE_VERSION: '20'
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

The `concurrency` group ensures that pushing new commits to a PR cancels any in-progress CI runs for that PR. This prevents wasted compute on outdated commits.

**Job: Lint**

The lint job runs ESLint, Prettier, and TypeScript strict mode checks in sequence. These are fast checks that catch obvious issues early.

```yaml
lint:
  name: Lint & Format
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    - run: npm ci
    - name: ESLint
      run: npx eslint . --max-warnings 0
    - name: Prettier
      run: npx prettier --check .
    - name: TypeScript Strict
      run: npx tsc --noEmit
```

ESLint is configured with `--max-warnings 0` to ensure zero warnings in the codebase. Any warning is treated as a failure. Prettier checks enforce consistent formatting without manual intervention. TypeScript strict mode catches type errors at compile time.

**Job: Unit Tests**

The unit test job runs Vitest with coverage reporting and enforces minimum coverage thresholds.

```yaml
unit-tests:
  name: Unit Tests
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    - run: npm ci
    - name: Run Tests
      run: npx vitest run --coverage --reporter=junit --outputFile=test-results.xml
    - name: Coverage Check
      run: |
        COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
        if (( $(echo "$COVERAGE < 80" | bc -l) )); then
          echo "Coverage $COVERAGE% is below 80% threshold"
          exit 1
        fi
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: test-results
        path: |
          test-results.xml
          coverage/
```

The coverage threshold of 80% applies to line coverage across all packages. This is a global threshold—individual packages may have higher or lower coverage as long as the aggregate meets the minimum. Coverage reports are uploaded as artifacts for PR review.

**Job: Integration Tests**

Integration tests use React Testing Library to validate component behavior with mocked API responses.

```yaml
integration-tests:
  name: Integration Tests
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    - run: npm ci
    - name: Run Integration Tests
      run: npx vitest run --config vitest.integration.config.ts
```

Integration tests are separated from unit tests to allow different configuration, longer timeouts, and independent scaling. They validate component interactions, hook behavior, and state management flows.

**Job: Build**

The build job compiles all packages and performs bundle size analysis.

```yaml
build:
  name: Build & Bundle Analysis
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    - run: npm ci
    - name: Build All Packages
      run: npx turbo build --filter=!docs
    - name: Bundle Size Check
      run: node scripts/check-bundle-size.js
    - name: Analyze Bundle
      run: npx vite-bundle-visualizer --open false --template treemap
    - uses: actions/upload-artifact@v4
      with:
        name: bundle-analysis
        path: stats.html
```

The `check-bundle-size.js` script compares the current build output against the performance budgets defined in Chapter 18. If any budget is exceeded by more than 10%, the build fails. The bundle visualizer generates a treemap for manual review.

**Job: E2E Tests**

End-to-end tests run against the built application using Playwright. For PR validation, only Chromium is used to minimize run time.

```yaml
e2e-tests:
  name: E2E Tests (Chromium)
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    - run: npm ci
    - name: Install Playwright
      run: npx playwright install chromium --with-deps
    - name: Build App
      run: npx turbo build --filter=web
    - name: Run E2E Tests
      run: npx playwright test --project=chromium
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 7
```

Playwright tests validate critical user journeys: authentication flow, game session creation, score submission, leaderboard display, and profile management. Screenshots are captured on failure for debugging.

**Job: Security**

Security scanning runs npm audit, Snyk vulnerability scanning, and license compliance checks.

```yaml
security:
  name: Security Scan
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    - run: npm ci
    - name: npm audit
      run: npm audit --audit-level=high
    - name: Snyk Test
      run: npx snyk test --all-projects
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
    - name: License Check
      run: npx license-checker --production --failOn "GPL-3.0;AGPL-3.0"
```

npm audit checks for known vulnerabilities in dependencies. Snyk provides deeper analysis including transitive dependencies. The license check ensures no copyleft licenses enter the production bundle. GPL-3.0 and AGPL-3.0 are blocked due to their copyleft requirements.

**Job: Accessibility**

Automated accessibility checks run axe-core and Lighthouse CI to catch regressions.

```yaml
accessibility:
  name: Accessibility Checks
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    - run: npm ci
    - name: Build App
      run: npx turbo build --filter=web
    - name: Axe Core Tests
      run: npx vitest run --config vitest.a11y.config.ts
    - name: Lighthouse CI
      run: npx lhci autorun
      env:
        LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_TOKEN }}
```

Axe-core runs against rendered components to detect WCAG 2.1 AA violations. Lighthouse CI evaluates performance, accessibility, best practices, and SEO scores. The Lighthouse performance score must be 90 or above; the accessibility score must be 95 or above.

### 17.2.2 Pipeline 2: Staging Deploy

This pipeline runs on every push to the `develop` branch. It deploys the current state of develop to the staging environment for validation.

**Trigger:** `push` events to the `develop` branch.

```yaml
name: Staging Deploy
on:
  push:
    branches: [develop]

concurrency:
  group: staging-deploy
  cancel-in-progress: false

env:
  NODE_VERSION: '20'
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_STAGING_PROJECT_ID }}
```

The staging deploy uses `cancel-in-progress: false` because staging deployments should complete rather than being superseded by newer commits.

**Job: Deploy Web Application**

```yaml
deploy-web:
  name: Deploy Web to Staging
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    - run: npm ci
    - name: Install Vercel CLI
      run: npm i -g vercel
    - name: Pull Vercel Environment
      run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
    - name: Build
      run: vercel build --token=${{ secrets.VERCEL_TOKEN }}
    - name: Deploy to Vercel Preview
      id: deploy
      run: |
        URL=$(vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }})
        echo "url=$URL" >> $GITHUB_OUTPUT
    - name: Smoke Tests
      run: |
        npx playwright test --project=smoke \
          --grep @staging \
          --config=playwright.config.ts
      env:
        BASE_URL: ${{ steps.deploy.outputs.url }}
    - name: Comment on PR
      uses: actions/github-script@v7
      with:
        script: |
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            body: `🚀 Staging deployed: ${{ steps.deploy.outputs.url }}`
          })
```

Vercel creates a unique preview URL for each staging deployment. Smoke tests run against the live preview URL to validate the deployment. The preview URL is posted as a comment on the most recent PR for easy access.

**Job: Deploy Edge Functions**

```yaml
deploy-functions:
  name: Deploy Edge Functions to Staging
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: supabase/setup-cli@v1
      with:
        version: latest
    - name: Link to Staging Project
      run: supabase link --project-ref ${{ secrets.SUPABASE_STAGING_REF }}
    - name: Deploy Functions
      run: supabase functions deploy --no-verify-jwt
    - name: Test Functions
      run: |
        for fn in score-calculate sync-data leaderboards; do
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            "${{ secrets.SUPABASE_STAGING_URL }}/functions/v1/$fn")
          if [ "$STATUS" != "200" ] && [ "$STATUS" != "401" ]; then
            echo "Function $fn returned $STATUS"
            exit 1
          fi
        done
```

Edge Functions are deployed individually using the Supabase CLI. Each function is tested with a simple HTTP request to verify it responds. The `--no-verify-jwt` flag skips JWT verification for testing purposes; production deployments enforce JWT verification.

**Job: Update Staging Database**

```yaml
update-staging-db:
  name: Update Staging Database
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: supabase/setup-cli@v1
      with:
        version: latest
    - name: Link to Staging Project
      run: supabase link --project-ref ${{ secrets.SUPABASE_STAGING_REF }}
    - name: Run Migrations
      run: supabase db push
    - name: Seed Test Data
      run: |
        psql ${{ secrets.SUPABASE_STAGING_DB_URL }} -f supabase/seed-staging.sql
```

Database migrations are applied using `supabase db push` which detects and applies pending migrations. The staging seed script inserts representative test data including sample users, game sessions, and leaderboard entries.

**Job: Notify**

```yaml
notify:
  name: Notify Team
  runs-on: ubuntu-latest
  needs: [deploy-web, deploy-functions, update-staging-db]
  steps:
    - name: Slack Notification
      uses: slackapi/slack-github-action@v1
      with:
        payload: |
          {
            "text": "Staging deploy complete",
            "blocks": [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "*Staging Deploy Complete* :white_check_mark:\n• Branch: `${{ github.ref_name }}`\n• Commit: `${{ github.sha }}`\n• Web: ${{ needs.deploy-web.outputs.url }}\n• Author: ${{ github.actor }}"
                }
              }
            ]
          }
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### 17.2.3 Pipeline 3: Production Deploy

This pipeline runs on every push to the `main` branch. It includes additional safety checks, multi-platform deployment, and post-deployment monitoring.

**Trigger:** `push` events to the `main` branch.

```yaml
name: Production Deploy
on:
  push:
    branches: [main]

concurrency:
  group: production-deploy
  cancel-in-progress: false

env:
  NODE_VERSION: '20'
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

**Job: Pre-Deploy Validation**

```yaml
pre-deploy:
  name: Pre-Deploy Validation
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    - run: npm ci
    - name: Full Test Suite (All Browsers)
      run: npx vitest run --coverage
    - name: E2E Tests (All Browsers)
      run: npx playwright test
    - name: Performance Benchmark
      run: node scripts/performance-benchmark.js
    - name: Security Scan
      run: |
        npm audit --audit-level=critical
        npx snyk test --all-projects --severity-threshold=high
```

The pre-deploy job runs the full test suite across all browsers (Chromium, Firefox, WebKit) and performs a performance benchmark. The benchmark measures LCP, CLS, and bundle size against the budgets defined in Chapter 18. If any benchmark exceeds the maximum threshold, the deployment is blocked.

**Job: Deploy Web to Production**

```yaml
deploy-web:
  name: Deploy Web to Production
  runs-on: ubuntu-latest
  needs: pre-deploy
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    - run: npm ci
    - name: Install Vercel CLI
      run: npm i -g vercel
    - name: Pull Vercel Environment
      run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
    - name: Build
      run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
    - name: Deploy to Production
      id: deploy
      run: |
        URL=$(vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }})
        echo "url=$URL" >> $GITHUB_OUTPUT
    - name: Verify Deployment
      run: |
        for i in {1..10}; do
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${{ steps.deploy.outputs.url }}")
          if [ "$STATUS" = "200" ]; then
            echo "Deployment verified"
            exit 0
          fi
          sleep 5
        done
        echo "Deployment verification failed"
        exit 1
```

Production web deployment uses Vercel's `--prod` flag to deploy to the production URL. The verification step retries 10 times with 5-second intervals to account for CDN propagation.

**Job: Deploy Edge Functions to Production**

```yaml
deploy-functions:
  name: Deploy Edge Functions to Production
  runs-on: ubuntu-latest
  needs: pre-deploy
  steps:
    - uses: actions/checkout@v4
    - uses: supabase/setup-cli@v1
      with:
        version: latest
    - name: Link to Production Project
      run: supabase link --project-ref ${{ secrets.SUPABASE_PRODUCTION_REF }}
    - name: Deploy Functions
      run: supabase functions deploy
    - name: Warm Up Functions
      run: |
        for fn in score-calculate sync-data leaderboards; do
          curl -s "${{ secrets.SUPABASE_PRODUCTION_URL }}/functions/v1/$fn" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" > /dev/null
        done
    - name: Verify Functions
      run: |
        for fn in score-calculate sync-data leaderboards; do
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            "${{ secrets.SUPABASE_PRODUCTION_URL }}/functions/v1/$fn" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}")
          if [ "$STATUS" != "200" ]; then
            echo "Function $fn returned $STATUS"
            exit 1
          fi
        done
```

Production edge function deployment includes a warm-up step that invokes each function once. This eliminates cold start latency for the first real user request. The `--no-verify-jwt` flag is intentionally omitted—production functions enforce JWT verification.

**Job: Deploy Production Database Migrations**

```yaml
deploy-db:
  name: Deploy Database Migrations
  runs-on: ubuntu-latest
  needs: pre-deploy
  steps:
    - uses: actions/checkout@v4
    - uses: supabase/setup-cli@v1
      with:
        version: latest
    - name: Link to Production Project
      run: supabase link --project-ref ${{ secrets.SUPABASE_PRODUCTION_REF }}
    - name: Run Migrations
      run: supabase db push
    - name: Verify Migrations
      run: |
        MIGRATION_COUNT=$(supabase migration list --linked | tail -n +3 | wc -l)
        echo "Applied $MIGRATION_COUNT migrations"
```

Database migrations are applied to production using the same CLI command as staging. The difference is the project reference. Migrations must be backward-compatible because mobile and desktop clients may not update simultaneously.

**Job: Deploy Mobile Apps**

```yaml
deploy-mobile:
  name: Deploy Mobile Apps
  runs-on: macos-latest
  needs: pre-deploy
  if: contains(github.event.head_commit.message, 'release:')
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    - run: npm ci
    - name: Sync Capacitor
      run: npx cap sync
    - name: Build iOS
      run: |
        cd ios
        xcodebuild -workspace FOCUS.xcworkspace \
          -scheme FOCUS \
          -configuration Release \
          -archivePath $PWD/build/FOCUS.xcarchive \
          archive
        xcodebuild -exportArchive \
          -archivePath $PWD/build/FOCUS.xcarchive \
          -exportOptionsPlist ExportOptions.plist \
          -exportPath $PWD/build/
    - name: Upload to TestFlight
      run: |
        xcrun altool --upload-app \
          --type ios \
          --file ios/build/FOCUS.ipa \
          --username "${{ secrets.APPLE_ID }}" \
          --password "${{ secrets.APPLE_APP_PASSWORD }}"
    - name: Build Android
      run: |
        cd android
        ./gradlew assembleRelease
    - name: Upload to Play Console
      run: |
        fastlane android upload_to_play_store \
          --track internal
      env:
        GOOGLE_PLAY_JSON_KEY: ${{ secrets.GOOGLE_PLAY_JSON_KEY }}
```

Mobile deployment is conditional on the commit message containing `release:`. This prevents every commit from triggering a mobile build. iOS builds use Xcode's archive workflow. Android builds use Gradle. Both are uploaded to their respective internal testing tracks.

**Job: Deploy Desktop Apps**

```yaml
deploy-desktop:
  name: Deploy Desktop Apps
  runs-on: ${{ matrix.os }}
  needs: pre-deploy
  if: contains(github.event.head_commit.message, 'release:')
  strategy:
    matrix:
      include:
        - os: windows-latest
          target: x86_64-pc-windows-msvc
          artifact: .exe
        - os: macos-latest
          target: universal-apple-darwin
          artifact: .dmg
        - os: ubuntu-latest
          target: x86_64-unknown-linux-gnu
          artifact: .AppImage
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    - run: npm ci
    - uses: dtolnay/rust-toolchain@stable
    - name: Install Tauri CLI
      run: cargo install tauri-cli
    - name: Build
      run: cargo tauri build --target ${{ matrix.target }}
      env:
        TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
        APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
        APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
        APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
    - name: Upload Artifacts
      uses: actions/upload-artifact@v4
      with:
        name: desktop-${{ matrix.target }}
        path: src-tauri/target/${{ matrix.target }}/release/bundle/
    - name: Upload to Update Server
      run: |
        aws s3 sync src-tauri/target/${{ matrix.target }}/release/bundle/ \
          s3://focus-updates/${{ matrix.target }}/ \
          --exclude "*.dSYM/*"
```

Desktop builds run in parallel across Windows, macOS, and Linux using a matrix strategy. Each platform produces signed binaries. macOS builds produce universal binaries supporting both Intel and Apple Silicon. Binaries are uploaded to an S3-compatible auto-update server.

**Job: Post-Deploy Monitoring**

```yaml
post-deploy:
  name: Post-Deploy Monitoring
  runs-on: ubuntu-latest
  needs: [deploy-web, deploy-functions, deploy-db]
  steps:
    - name: Health Check
      run: |
        for endpoint in / /api/health /api/games; do
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://focusapp.io$endpoint")
          if [ "$STATUS" != "200" ]; then
            echo "Health check failed for $endpoint: $STATUS"
            exit 1
          fi
        done
    - name: Monitor Error Rate (15 minutes)
      run: |
        for i in {1..15}; do
          ERROR_RATE=$(curl -s "https://sentry.io/api/0/organizations/${{ secrets.SENTRY_ORG }}/stats/" \
            -H "Authorization: Bearer ${{ secrets.SENTRY_TOKEN }}" \
            | jq '.events[14].error_count / .events[14].total_count * 100')
          if (( $(echo "$ERROR_RATE > 1" | bc -l) )); then
            echo "Error rate $ERROR_RATE% exceeds 1% threshold"
            echo "Triggering rollback..."
            # Trigger rollback workflow
            exit 1
          fi
          echo "Error rate: $ERROR_RATE% (check $i/15)"
          sleep 60
        done
    - name: Rollback on Failure
      if: failure()
      run: |
        echo "Rolling back web deployment..."
        VERCEL_DEPLOYMENT_ID=$(curl -s "https://api.vercel.com/v6/deployments?projectId=${{ secrets.VERCEL_PROJECT_ID }}&limit=2" \
          -H "Authorization: Bearer ${{ secrets.VERCEL_TOKEN }}" \
          | jq '.deployments[1].id')
        curl -X PATCH "https://api.vercel.com/v13/deployments/$VERCEL_DEPLOYMENT_ID" \
          -H "Authorization: Bearer ${{ secrets.VERCEL_TOKEN }}" \
          -d '{"target":"production"}'
```

Post-deploy monitoring runs health checks immediately after deployment, then monitors the Sentry error rate for 15 minutes. If the error rate exceeds 1%, the previous deployment is promoted to production. This automated rollback ensures minimal user impact from failed deployments.

**Job: Notify**

```yaml
notify:
  name: Notify Team
  runs-on: ubuntu-latest
  needs: [deploy-web, deploy-functions, deploy-db, post-deploy]
  steps:
    - name: Slack Notification
      uses: slackapi/slack-github-action@v1
      with:
        payload: |
          {
            "text": "Production deploy complete",
            "blocks": [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "*Production Deploy Complete* :rocket:\n• Commit: `${{ github.sha }}`\n• Author: ${{ github.actor }}\n• Web: https://focusapp.io\n• Status: :white_check_mark: All health checks passed"
                }
              }
            ]
          }
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
    - name: Create GitHub Release
      if: contains(github.event.head_commit.message, 'release:')
      uses: softprops/action-gh-release@v1
      with:
        generate_release_notes: true
        draft: false
        prerelease: false
```

---

## 17.3 Build Configuration

### 17.3.1 Turborepo Monorepo Build

The FOCUS platform uses Turborepo for monorepo build orchestration. Turborepo provides incremental builds, build caching, and parallel execution across packages.

**Turborepo Configuration (`turbo.json`):**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env.local"],
  "globalEnv": ["NODE_ENV"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "env": ["NODE_ENV"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:integration": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "outputs": ["playwright-report/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

The `dependsOn: ["^build"]` configuration ensures that packages are built in dependency order. If `@shared/scoring` depends on `@shared/constants`, then `@shared/constants` is built first. The caret prefix (`^`) means "build my dependencies first."

**Build Caching:**

Turborepo uses both local and remote caching. Local caching stores build artifacts in `.turbo/cache/` within the repository. Remote caching uses Vercel's Turborepo cache server, allowing CI runners to share build artifacts across runs.

Remote caching configuration in CI:

```yaml
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

When a package's source code, dependencies, and build configuration have not changed, Turborepo skips the build and restores artifacts from cache. This reduces CI build times from ~5 minutes to ~30 seconds for unchanged packages.

**Incremental Builds:**

Only changed packages are rebuilt. The dependency graph determines which downstream packages also need rebuilding. For example, if only `packages/shared/src/utils/formatting.ts` changes:

1. `@shared/utils` is rebuilt
2. `@shared/scoring` (depends on `@shared/utils`) is rebuilt
3. `@ui/components` (depends on `@shared/utils`) is rebuilt
4. `web` (depends on all of the above) is rebuilt
5. All other packages are skipped

**Parallel Builds:**

Independent packages build in parallel. The dependency graph determines parallelism. Packages with no interdependencies build simultaneously on available CPU cores.

### 17.3.2 Build Artifacts

**Web Application:**

The web application is built using Vite, producing optimized static files:

- HTML: Entry points with injected script tags
- CSS: Extracted, minified, with source maps
- JavaScript: Code-split chunks with content hashes
- Images: Optimized WebP/AVIF formats
- Fonts: WOFF2 with unicode-range subsetting

Build output structure:

```
dist/
  index.html
  assets/
    main.[hash].js        # Core application bundle
    vendor.[hash].js      # Third-party libraries
    game-[name].[hash].js # Game-specific bundles
    main.[hash].css       # Core styles
    game-[name].[hash].css # Game-specific styles
  fonts/
    inter-latin.[hash].woff2
    inter-latin-ext.[hash].woff2
  images/
    hero.[hash].webp
    logo.[hash].svg
```

**Mobile Application (Capacitor):**

Capacitor wraps the web build in a native container:

```
ios/
  App/
    App/
      public/           # Web build output
      Resources/        # App icons, splash screens
      Info.plist        # iOS configuration
  Podfile              # iOS dependencies

android/
  app/
    src/main/
      assets/           # Web build output
      res/              # Android resources
      AndroidManifest.xml
    build.gradle        # Android dependencies
```

The `npx cap sync` command copies the web build output into the native project directories. This means the web build is always the source of truth for the application code.

**Desktop Application (Tauri):**

Tauri uses the system webview for rendering:

```
src-tauri/
  src/
    main.rs            # Rust backend
    commands/          # Tauri commands
    tray.rs            # System tray
  target/
    release/
      bundle/
        dmg/           # macOS DMG
        nsis/          # Windows NSIS installer
        appimage/      # Linux AppImage
        deb/           # Linux Debian package
        rpm/           # Linux RPM package
  tauri.conf.json      # Tauri configuration
```

---

## 17.4 Deployment Targets

### 17.4.1 Web (Vercel)

Vercel is the primary deployment target for the web application. It provides automatic preview deployments for PRs, production deployment on merge to main, edge functions for API routes, ISR for static pages, and edge middleware for authentication checks.

**Preview Deployments:**

Every PR automatically receives a preview deployment at a unique URL. The URL format is `focus-<hash>-<team>.vercel.app`. Preview deployments include:

- Full application build
- Edge function deployment
- Environment variables from the preview environment
- Database connection to the staging database

Preview deployments are automatically deleted when the PR is closed.

**Production Deployment:**

Production deployment occurs on merge to main. Vercel performs an atomic deployment—the new version replaces the previous version instantly. There is no downtime during the switch.

**Edge Functions:**

API routes are deployed as Vercel Edge Functions, running at the edge near the user. Edge functions have a 256MB memory limit and 30-second execution limit. Functions requiring longer execution or larger memory use Vercel Serverless Functions instead.

**ISR (Incremental Static Regeneration):**

Static pages like the landing page, about page, and documentation use ISR with a 60-second revalidation period. This provides the performance of static pages with the freshness of dynamic rendering.

**Edge Middleware:**

Authentication checks run at the edge before the request reaches the application. This blocks unauthenticated users from accessing protected routes without a full application round-trip.

### 17.4.2 iOS (Capacitor + App Store)

**Build Process:**

```bash
# Sync web assets to iOS project
npx cap sync ios

# Build for device
xcodebuild -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath build/App.xcarchive \
  archive

# Export IPA
xcodebuild -exportArchive \
  -archivePath build/App.xcarchive \
  -exportOptionsPlist ios/App/App/ExportOptions.plist \
  -exportPath build/
```

**Code Signing:**

iOS requires code signing with an Apple Developer certificate. The certificate and provisioning profile are stored as base64-encoded GitHub Secrets. The `ExportOptions.plist` specifies the signing identity and provisioning profile.

**App Store Submission:**

```bash
# Upload to TestFlight
xcrun altool --upload-app \
  --type ios \
  --file build/App.ipa \
  --username "$APPLE_ID" \
  --password "$APPLE_APP_PASSWORD"
```

**Review Process:**

App Store review typically takes 24-48 hours. The review checklist includes:

- App functionality works as described
- No crashes or bugs
- Compliance with App Store guidelines
- Privacy policy link
- App description matches functionality

**Staged Rollout:**

After approval, the release is deployed in stages:

1. Internal testing (TestFlight, 100% of internal team)
2. External testing (TestFlight, 100% of beta testers)
3. Production: 10% of users
4. Production: 50% of users
5. Production: 100% of users

Each stage monitors crash rates and user feedback before proceeding.

### 17.4.3 Android (Capacitor + Google Play)

**Build Process:**

```bash
# Sync web assets to Android project
npx cap sync android

# Build release APK/AAB
cd android
./gradlew bundleRelease
```

Android builds produce an App Bundle (`.aab`) rather than an APK. Google Play uses the App Bundle to generate optimized APKs for each device configuration.

**Code Signing:**

Android uses a keystore file for code signing. The keystore is stored as a base64-encoded GitHub Secret. The `gradle.properties` file references the keystore path and passwords from environment variables.

**Google Play Submission:**

```bash
# Upload to internal track
fastlane supply \
  --track internal \
  --aab app/build/outputs/bundle/release/app-release.aab \
  --json_key "$GOOGLE_PLAY_JSON_KEY" \
  --package_name com.focus.app
```

**Review Process:**

Google Play review typically takes 1-3 days. The review is automated with human review for flagged content.

**Staged Rollout:**

Similar to iOS, Android uses staged rollouts:

1. Internal testing track
2. Closed testing track
3. Open testing track (beta)
4. Production: 10% rollout
5. Production: 50% rollout
6. Production: 100% rollout

### 17.4.4 Windows (Tauri)

**Build Process:**

```bash
cargo tauri build --target x86_64-pc-windows-msvc
```

**Code Signing:**

Windows uses Authenticode certificate signing. The certificate is stored as a base64-encoded GitHub Secret. The `signtool.exe` utility signs the executable and installer.

**Installer:**

The NSIS installer produces a `.exe` file that handles:

- Installation directory selection
- Start menu shortcut creation
- Desktop shortcut creation
- Uninstaller creation
- Previous version detection and upgrade

**Distribution:**

- Auto-update server: S3-compatible storage
- Direct download: GitHub Releases
- Microsoft Store: Optional submission

### 17.4.5 macOS (Tauri)

**Build Process:**

```bash
cargo tauri build --target universal-apple-darwin
```

The universal binary supports both Intel and Apple Silicon Macs from a single binary.

**Code Signing:**

macOS requires code signing with a Developer ID certificate. The certificate is stored as a base64-encoded GitHub Secret.

**Notarization:**

```bash
xcrun notarytool submit build/macos/FOCUS.dmg \
  --apple-id "$APPLE_ID" \
  --password "$NOTARIZE_PASSWORD" \
  --team-id "$APPLE_TEAM_ID" \
  --wait
```

Notarization is required for macOS apps distributed outside the App Store. Apple scans the binary for malicious code and issues a ticket if clean.

**Distribution:**

- DMG: Drag-and-drop installation
- Auto-update: Tauri updater plugin
- Homebrew: Optional tap

### 17.4.6 Linux (Tauri)

**Build Process:**

```bash
cargo tauri build --target x86_64-unknown-linux-gnu
```

**Formats:**

Linux produces multiple package formats:

- `.deb`: Debian/Ubuntu package
- `.AppImage`: Universal Linux package (no installation required)
- `.rpm`: Red Hat/Fedora package

**Distribution:**

- GitHub Releases: Primary distribution channel
- Auto-update: Tauri updater plugin
- Package managers: Optional submission to AUR, Snap

**Code Signing:**

Linux does not use code signing in the traditional sense. Instead, GPG signatures are provided for verification:

```bash
gpg --detach-sign --armor FOCUS-1.0.0.AppImage
```

Users can verify the signature:

```bash
gpg --verify FOCUS-1.0.0.AppImage.sig FOCUS-1.0.0.AppImage
```

---

## 17.5 Versioning Strategy

The FOCUS platform uses Semantic Versioning (SemVer) for all packages and applications.

### 17.5.1 Version Format

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking changes, major feature additions, architectural changes. Examples: New game engine API, database schema redesign, authentication system change.
- **MINOR**: New features, non-breaking changes, new games. Examples: New game module, new leaderboard feature, new profile customization option.
- **PATCH**: Bug fixes, security patches, performance improvements. Examples: Fix score calculation bug, update vulnerable dependency, optimize render loop.

### 17.5.2 Version Storage

The version number is stored in multiple locations that must be kept in sync:

- `package.json`: `version` field in each package
- `tauri.conf.json`: `version` field for desktop app
- `capacitor.config.ts`: `version` field for mobile apps
- `ios/App/App/Info.plist`: `CFBundleShortVersionString` and `CFBundleVersion`
- `android/app/build.gradle`: `versionCode` and `versionName`

### 17.5.3 Automated Versioning with Changesets

Changesets automates version management through PR labels:

```bash
# Add a changeset
npx changeset

# This prompts for:
# 1. Package(s) affected
# 2. Version bump type (patch/minor/major)
# 3. Change description
```

Changesets creates a `.changeset/*.md` file that describes the change. When merged to `develop`, the Changesets GitHub Action creates a "Version Packages" PR that bumps versions and updates changelogs.

**Changeset Configuration (`.changeset/config.json`):**

```json
{
  "$schema": "https://unpkg.com/@changesets/config/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [["@focus/web", "@focus/mobile", "@focus/desktop"]],
  "access": "restricted",
  "baseBranch": "develop",
  "updateInternalDependencies": "patch",
  "ignore": ["@focus/docs"]
}
```

The `linked` configuration ensures that web, mobile, and desktop always share the same version number. When one is bumped, all are bumped together.

### 17.5.4 Release Notes

Release notes are auto-generated from PR titles using conventional commits. The format:

```markdown
## [1.2.0] - 2025-01-15

### Added
- New game: Stroop Test (#123)
- Dark mode toggle in settings (#124)

### Fixed
- Score calculation bug in Reaction Light Test (#125)
- Memory leak in game session hook (#126)

### Changed
- Updated Supabase client to v2.0 (#127)

### Security
- Updated vulnerable dependency lodash (#128)
```

---

## 17.6 Auto-Update Mechanism

### 17.6.1 Tauri Updater

The desktop application uses Tauri's built-in updater plugin for automatic updates.

**Configuration (`tauri.conf.json`):**

```json
{
  "plugins": {
    "updater": {
      "endpoint": "https://updates.focusapp.io/{{target}}/{{arch}}/{{current_version}}",
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQgbWVzc2FnZQ==",
      "windows": {
        "installerUrl": null,
        "signature": null
      }
    }
  }
}
```

**Update Flow:**

1. Application starts and checks the update endpoint
2. Endpoint returns the latest version and download URL if an update is available
3. Application downloads the update in the background
4. Application verifies the Ed25519 signature
5. Application prompts the user to restart and install
6. User clicks "Restart" and the update is applied
7. Application restarts with the new version

**Critical Updates:**

Security patches can be marked as critical. Critical updates force installation on the next restart with a 24-hour grace period. The user is notified that a critical security update is available and must be installed.

**Update Server:**

The update server is an S3-compatible storage bucket with a CloudFront distribution. The server responds to version check requests:

```json
{
  "version": "1.2.1",
  "notes": "Bug fixes and performance improvements",
  "pub_date": "2025-01-15T12:00:00Z",
  "platforms": {
    "darwin-x86_64": {
      "signature": "...",
      "url": "https://updates.focusapp.io/darwin/x86_64/FOCUS.app.tar.gz"
    },
    "darwin-aarch64": {
      "signature": "...",
      "url": "https://updates.focusapp.io/darwin/aarch64/FOCUS.app.tar.gz"
    },
    "windows-x86_64": {
      "signature": "...",
      "url": "https://updates.focusapp.io/windows/x86_64/FOCUS_1.2.1_x64-setup.exe"
    },
    "linux-x86_64": {
      "signature": "...",
      "url": "https://updates.focusapp.io/linux/x86_64/FOCUS-1.2.1.AppImage"
    }
  }
}
```

### 17.6.2 Mobile Updates

Mobile apps do not use auto-update in the traditional sense. Instead:

- **iOS**: Updates are distributed through the App Store. Users are prompted to update when a new version is available.
- **Android**: Google Play auto-updates apps in the background. Users can disable this in settings.

Capacitor's `CapacitorUpdater` plugin can be used for hot-patching web assets without a full app update. This allows pushing critical fixes to the web layer without waiting for app store review.

---

## 17.7 Rollback Strategy

### 17.7.1 Web Rollback

Vercel maintains a history of all deployments. Rollback is instantaneous:

```bash
# List recent deployments
vercel ls --token=$VERCEL_TOKEN

# Promote a previous deployment to production
vercel promote <deployment-id> --token=$VERCEL_TOKEN
```

Rollback takes effect within seconds. The previous deployment's static assets are still in the CDN cache, so there is no cold start penalty.

### 17.7.2 Mobile Rollback

Mobile rollback is more complex due to app store distribution:

- **Staged rollout**: If a bug is detected during staged rollout, the rollout can be paused at the current percentage
- **New version**: A fix must be submitted as a new version through the app store
- **Capacitor Updater**: If using Capacitor Updater, the web assets can be rolled back without a full app update

### 17.7.3 Desktop Rollback

Desktop rollback uses the auto-update system:

1. Previous version binaries remain on the update server
2. The update server can be configured to serve the previous version
3. On next check, desktop clients receive the previous version
4. The update is applied automatically

### 17.7.4 Database Rollback

Every database migration must include a rollback script. The naming convention:

```
supabase/migrations/
  20250115120000_add_game_sessions_table.sql    # Forward migration
  20250115120000_add_game_sessions_table.down.sql # Rollback migration
```

The rollback script is tested in CI by applying the migration and then immediately rolling it back. This ensures the rollback script is valid.

---

## 17.8 Environment Management

### 17.8.1 Environment Hierarchy

| Environment | Purpose | Database | URL |
|-------------|---------|----------|-----|
| Local Development | Individual development | Local Supabase | `localhost:3000` |
| Staging | Integration testing | Supabase staging project | `focus-staging.vercel.app` |
| Production | Live users | Supabase production project | `focusapp.io` |

### 17.8.2 Environment Variables

**Local Development (`.env.local`, git-ignored):**

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SENTRY_DSN=
VITE_ANALYTICS_KEY=
```

**GitHub Secrets (CI/CD):**

```
VERCEL_TOKEN
TURBO_TOKEN
TURBO_TEAM
SUPABASE_ACCESS_TOKEN
SUPABASE_STAGING_REF
SUPABASE_PRODUCTION_REF
SENTRY_TOKEN
SNYK_TOKEN
APPLE_ID
APPLE_APP_PASSWORD
GOOGLE_PLAY_JSON_KEY
TAURI_SIGNING_PRIVATE_KEY
SLACK_WEBHOOK
```

**Vercel Environment Variables (Web):**

```
VITE_SUPABASE_URL (Production)
VITE_SUPABASE_ANON_KEY (Production)
VITE_SENTRY_DSN (Production)
VITE_ANALYTICS_KEY (Production)
```

**Capacitor Config (Mobile):**

Mobile environment variables are baked into the build at compile time. The `capacitor.config.ts` file reads from environment variables during the build process.

**Tauri Config (Desktop):**

Desktop environment variables are embedded in the Rust binary during compilation. The `tauri.conf.json` file references environment variables that are resolved at build time.

---

## 17.9 Monitoring & Alerting

### 17.9.1 Error Monitoring (Sentry)

Sentry monitors error rates across all platforms:

- **Web**: Client-side and server-side errors
- **Mobile**: iOS and Android crash reports
- **Desktop**: Windows, macOS, and Linux crash reports
- **Edge Functions**: Server-side errors

**Alert Configuration:**

- Error rate > 1%: PagerDuty alert (critical)
- Error rate > 0.5%: Slack notification (warning)
- New error type: Slack notification (info)
- Performance regression: Slack notification (warning)

### 17.9.2 Performance Monitoring (Vercel Analytics)

Vercel Analytics tracks Core Web Vitals for the web application:

- LCP, FID, CLS, INP, TTFB
- Route-level performance
- Function execution time
- Edge function latency

### 17.9.3 Database Monitoring (Supabase)

Supabase provides database monitoring:

- Query performance
- Connection pool usage
- Storage usage
- API response times

### 17.9.4 Custom Monitoring

Custom metrics are tracked via the analytics pipeline:

- Game session success rate
- Sync success rate
- Score calculation accuracy
- Leaderboard update latency
- Authentication flow completion rate

### 17.9.5 Alert Escalation

```
Slack notification (warning)
  → If not acknowledged in 15 minutes → PagerDuty (critical)
    → If not acknowledged in 5 minutes → Phone call
      → If not acknowledged in 5 minutes → Escalation
```
