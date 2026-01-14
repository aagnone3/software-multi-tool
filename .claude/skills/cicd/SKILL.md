---
name: cicd
description: Use this skill when working with CI/CD, preview environments, database branching, or deployment workflows. Covers Supabase branching, Vercel preview deployments, Render preview environments, and the relationship between Prisma and Supabase migrations.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# CI/CD Skill

This skill provides comprehensive guidance for the CI/CD pipeline, preview environments, and database branching workflow used in this repository.

## Quick Reference

| Component                  | Location/URL                                        |
| -------------------------- | --------------------------------------------------- |
| GitHub Actions Workflows   | `.github/workflows/`                                |
| PR Validation              | `.github/workflows/validate-prs.yml`                |
| DB Migration Deploy        | `.github/workflows/db-migrate-deploy.yml`           |
| Supabase Config            | `supabase/config.toml`                              |
| Supabase Migrations        | `supabase/migrations/`                              |
| Supabase Seed              | `supabase/seed.sql`                                 |
| Prisma Schema              | `packages/database/prisma/schema.prisma`            |
| Prisma Migrations          | `packages/database/prisma/migrations/`              |
| Render Config              | `render.yaml`                                       |
| Validate Seed Script       | `pnpm --filter @repo/scripts supabase:validate-seed`|
| Vercel Project             | Vercel Dashboard                                    |
| Supabase Project           | https://supabase.com/dashboard                      |

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Repository                         │
│                                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐   │
│  │   PR Open   │───▶│ CI Checks   │───▶│ Preview Environments │   │
│  └─────────────┘    └─────────────┘    └─────────────────────┘   │
│                                                │                  │
│                                                ▼                  │
│         ┌────────────────────────────────────────────────┐       │
│         │              Preview Stack                      │       │
│         │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │       │
│         │  │ Vercel   │  │ Render   │  │ Supabase     │  │       │
│         │  │ Preview  │  │ Preview  │  │ Branch DB    │  │       │
│         │  │ (Web)    │  │ (API)    │  │ (PostgreSQL) │  │       │
│         │  └──────────┘  └──────────┘  └──────────────┘  │       │
│         └────────────────────────────────────────────────┘       │
│                                                │                  │
│                                                ▼                  │
│         ┌────────────────────────────────────────────────┐       │
│         │            PR Merge to Main                     │       │
│         │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │       │
│         │  │ Vercel   │  │ Render   │  │ Supabase     │  │       │
│         │  │ Prod     │  │ Prod     │  │ Prod DB      │  │       │
│         │  └──────────┘  └──────────┘  └──────────────┘  │       │
│         └────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## Supabase Branching

Supabase branching creates isolated PostgreSQL databases for each pull request, enabling safe testing of schema changes and seeded data.

### How It Works

1. **PR Opens** → Supabase GitHub integration detects the PR
2. **Branch Created** → Supabase creates a branch database with:
   - Schema from `supabase/migrations/`
   - Seed data from `supabase/seed.sql`
3. **Branch Database URL** → Available via Supabase dashboard or GitHub check
4. **PR Merged** → Branch database is automatically deleted

### Key Files

| File                        | Purpose                                         |
| --------------------------- | ----------------------------------------------- |
| `supabase/config.toml`      | Supabase project configuration                  |
| `supabase/migrations/*.sql` | Database schema migrations                      |
| `supabase/seed.sql`         | Preview branch seed data (test tenant + user)   |

### Branch Database URLs

Preview branch databases have connection strings in this format:

```text
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

To find your preview branch database URL:

1. Go to Supabase Dashboard → Database → Branches
2. Select the branch matching your PR
3. Copy the connection string from Settings

### Seed Data

The `supabase/seed.sql` file provisions test data for preview environments:

- **Test User**: `test@preview.local` (id: `preview_user_001`)
- **Test Org**: `preview-test-org` (id: `preview_org_001`)
- **Membership**: Test user is an owner of the test org
- **Seed Marker**: Verification entry for validation script

### Validating Seed Data

Run the validation script to confirm seed data exists:

```bash
# Set DATABASE_URL to your preview branch database
export DATABASE_URL="postgresql://postgres:...@db.xxx.supabase.co:5432/postgres"

# Run validation
pnpm --filter @repo/scripts supabase:validate-seed
```

Expected output:

```text
Checking for test user...
  [PASS] Test user found: Preview Test User (test@preview.local)

Checking for test organization...
  [PASS] Test org found: Preview Test Organization (slug: preview-test-org)

Checking for membership...
  [PASS] User is member of org with role: owner

Checking for seed marker...
  [PASS] Seed marker found: seeded_at_2024-01-15T10:30:00Z

========================================
VALIDATION SUMMARY
========================================
Test User:     PASS
Organization:  PASS
Membership:    PASS
Seed Marker:   PASS
----------------------------------------
Result: 4/4 checks passed

Seed validation PASSED - Preview branch is ready for testing
```

### Supabase CLI Commands

```bash
# Initialize Supabase (already done)
supabase init

# Link to remote project
SUPABASE_ACCESS_TOKEN="..." supabase link --project-ref rhcyfnrwgavrtxkiwzyv

# Pull schema from production
SUPABASE_ACCESS_TOKEN="..." supabase db pull

# Push local migrations to remote (DANGEROUS - use with care)
supabase db push

# Start local Supabase stack
supabase start

# Stop local Supabase stack
supabase stop

# Check migration status
supabase migration list
```

## Prisma vs Supabase Migrations

This project uses **two migration systems** that serve different purposes:

### Prisma Migrations (Primary)

- **Location**: `packages/database/prisma/migrations/`
- **Purpose**: Application schema changes
- **When to use**: All schema changes during development
- **Workflow**: `pnpm --filter @repo/database migrate`

Prisma is the **source of truth** for the application schema. All development work uses Prisma migrations.

### Supabase Migrations (Derived)

- **Location**: `supabase/migrations/`
- **Purpose**: Supabase branching and preview environments
- **When to use**: Automatically synced from Prisma by CI
- **Workflow**: CI syncs on PRs with migration changes; manual sync also available

Supabase migrations are **derived from Prisma migrations** and used by the branching system to create preview databases.

### Automatic Migration Sync

A sync script (`tooling/scripts/src/supabase/sync-prisma-to-supabase.sh`) automatically converts Prisma migrations to Supabase format:

| System | Format |
| ------ | ------ |
| Prisma | `migrations/TIMESTAMP_name/migration.sql` |
| Supabase | `migrations/TIMESTAMP_name.sql` |

**CI Integration**: The `validate-prs.yml` workflow automatically:

1. Detects Prisma migration changes in PRs
2. Runs the sync script to create Supabase-format migrations
3. Commits the synced migrations back to the PR branch
4. Supabase preview branches then apply these migrations

**Manual Sync**:

```bash
# Preview what would be synced
./tooling/scripts/src/supabase/sync-prisma-to-supabase.sh --dry-run

# Sync migrations
./tooling/scripts/src/supabase/sync-prisma-to-supabase.sh
```

### Migration Workflow

```text
┌─────────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT WORKFLOW                          │
│                                                                   │
│  1. Modify Prisma Schema                                         │
│     └── packages/database/prisma/schema.prisma                   │
│                                                                   │
│  2. Create Prisma Migration                                      │
│     └── pnpm --filter @repo/database migrate                     │
│                                                                   │
│  3. Commit & Create PR                                           │
│     └── git commit -m "feat: add new table"                      │
│                                                                   │
│  4. CI Auto-Syncs Supabase Migrations                            │
│     └── sync-prisma-to-supabase.sh runs automatically            │
│     └── Synced migrations committed to PR branch                 │
│                                                                   │
│  5. Supabase Preview Branch Created                              │
│     └── Applies synced migrations to preview database            │
│     └── Validates migrations BEFORE merge                        │
│                                                                   │
│  6. PR Review & Merge                                            │
│     └── Prisma migration applies to production                   │
└─────────────────────────────────────────────────────────────────┘
```

### Why Two Systems?

| Aspect                   | Prisma                 | Supabase                     |
| ------------------------ | ---------------------- | ---------------------------- |
| **Primary use**          | Development workflow   | Preview environments         |
| **Schema changes**       | Yes                    | Derived from Prisma          |
| **CI/CD integration**    | GitHub Actions deploy  | Automatic branching + sync   |
| **Local development**    | `pnpm dev`             | `supabase start` (optional)  |
| **Production deploy**    | Manual/CD pipeline     | N/A (uses Prisma)            |
| **Pre-merge validation** | No                     | Yes (preview branches)       |

### Benefits of Automatic Sync

1. **Pre-merge validation**: Migrations are validated on Supabase preview branches before merge
2. **Single source of truth**: Prisma remains the source; Supabase format is derived
3. **No manual steps**: CI handles sync automatically
4. **Fail-fast**: If a migration fails on preview branch, the PR shows the failure

## Vercel Preview Deployments

Vercel automatically creates preview deployments for each PR.

### Vercel Workflow

1. **PR Opens** → Vercel builds preview deployment
2. **Build Completes** → Preview URL available (e.g., `project-name-git-feature-branch.vercel.app`)
3. **PR Updates** → Preview deployment rebuilds
4. **PR Merged** → Preview deployment removed

### Vercel Environment Variables

Preview deployments use `Preview` environment in Vercel:

```bash
# List preview env vars
pnpm web:env:list --target preview

# Set preview env var
pnpm web:env:set VARIABLE_NAME "value" --target preview

# Unset preview env var
pnpm web:env:unset VARIABLE_NAME --target preview
```

### Connecting to Preview Database (Prisma Configuration)

The Vercel-Supabase integration automatically provides database connection strings for preview branches. The Prisma schema is configured to use these variables directly:

| Variable                    | Purpose                         |
| --------------------------- | ------------------------------- |
| `POSTGRES_PRISMA_URL`       | Pooled connection (app runtime) |
| `POSTGRES_URL_NON_POOLING`  | Direct connection (migrations)  |

**No additional configuration needed** - preview deployments automatically connect to the correct branch database.

## Render Preview Environments

Render creates preview environments for the API server on each PR.

### Render Workflow

1. **PR Opens** → Render detects PR via GitHub webhook
2. **Preview Service Created** → Render spins up preview API server
3. **Service URL** → Available in Render dashboard
4. **PR Merged/Closed** → Preview service deleted

### Configuration

Preview environments are configured in `render.yaml`:

```yaml
services:
  - type: web
    name: api-server
    runtime: node
    buildCommand: pnpm install && pnpm build
    startCommand: pnpm start
    envVars:
      - key: DATABASE_URL
        sync: false  # Set per-environment
```

### Render Environment Variables

Render preview environments require these environment variables:

| Variable                   | Description                                   | Source           |
| -------------------------- | --------------------------------------------- | ---------------- |
| `POSTGRES_PRISMA_URL`      | Pooled connection to Supabase branch database | Auto-synced      |
| `POSTGRES_URL_NON_POOLING` | Direct connection for Prisma migrations       | Auto-synced      |
| `CORS_ORIGIN`              | Vercel preview URL for CORS                   | Auto-synced      |
| `BETTER_AUTH_SECRET`       | Same as production (or preview-specific)      | Manual           |

**Note**: Database credentials and CORS origin are automatically synced by the `preview-env-sync` workflow.

## Automated Preview Environment Sync

A GitHub Actions workflow automatically synchronizes environment variables across all three preview services (Supabase, Vercel, Render) when a PR is opened or updated.

### Sync Workflow

```text
┌─────────────────────────────────────────────────────────────────┐
│                    preview-env-sync Workflow                     │
│                                                                  │
│  1. PR Opened/Updated                                           │
│         │                                                        │
│         ▼                                                        │
│  2. Wait for all services (parallel polling)                    │
│     ├── Supabase branch ready?                                  │
│     ├── Vercel preview ready?                                   │
│     └── Render preview ready?                                   │
│         │                                                        │
│         ▼                                                        │
│  3. Sync environment variables                                  │
│     ├── Render ← Supabase DB credentials                        │
│     ├── Render ← Vercel preview URL (CORS)                      │
│     └── Vercel ← Render API URL                                 │
│         │                                                        │
│         ▼                                                        │
│  4. Trigger Render redeploy (if env vars changed)               │
└─────────────────────────────────────────────────────────────────┘
```

### Environment Variable Flow

| Target | Variable                     | Source   | Purpose                       |
| ------ | ---------------------------- | -------- | ----------------------------- |
| Render | `POSTGRES_PRISMA_URL`        | Supabase | Branch DB pooled connection   |
| Render | `POSTGRES_URL_NON_POOLING`   | Supabase | Branch DB direct connection   |
| Render | `CORS_ORIGIN`                | Vercel   | Allow requests from preview   |
| Vercel | `NEXT_PUBLIC_API_SERVER_URL` | Render   | API endpoint for frontend     |

### Workflow Triggers

The workflow runs automatically on:

- `pull_request: [opened, synchronize, reopened]`

Manual trigger available via:

- `workflow_dispatch` with `pr_number` input

### Required GitHub Secrets

| Secret                   | Purpose                         | Where to Get                           |
| ------------------------ | ------------------------------- | -------------------------------------- |
| `SUPABASE_ACCESS_TOKEN`  | Supabase Management API         | Supabase Dashboard → Account → Tokens  |
| `SUPABASE_PROJECT_REF`   | Project identifier              | `rhcyfnrwgavrtxkiwzyv`                 |
| `RENDER_API_KEY`         | Render API                      | Render Dashboard → Account Settings    |
| `VERCEL_TOKEN`           | Vercel API                      | Vercel Dashboard → Settings → Tokens   |
| `VERCEL_PROJECT`         | Vercel project ID               | Vercel Dashboard → Project Settings    |
| `VERCEL_SCOPE`           | Vercel team/scope ID            | Vercel Dashboard → Team Settings       |

### Manual Sync

If the workflow fails or you need to re-sync:

```bash
# Run the sync script locally
pnpm --filter @repo/scripts preview-sync run --pr <PR_NUMBER> --branch <BRANCH_NAME>

# Or trigger the workflow manually from GitHub Actions tab
```

### Race Condition Handling

The workflow handles race conditions by:

1. **Parallel polling** - Waits for all 3 services simultaneously
2. **Exponential backoff** - Starts at 5s, increases to max 30s between attempts
3. **Idempotency** - Only updates env vars if values differ
4. **Conditional redeploy** - Only triggers redeploy if env vars changed

## Troubleshooting

### Migration Check Failures on PRs

**Symptom**: PR checks fail with migration-related errors

**Common causes**:

1. **Prisma migration conflict**

   ```bash
   # Solution: Rebase on main and regenerate migration
   git fetch origin main
   git rebase origin/main
   pnpm --filter @repo/database migrate
   ```

2. **Schema drift between Prisma and Supabase**

   ```bash
   # Solution: Sync Supabase migrations
   SUPABASE_ACCESS_TOKEN="..." supabase db pull
   git add supabase/migrations/
   git commit -m "chore: sync supabase migrations"
   ```

3. **Missing seed data**

   ```bash
   # Verify seed file syntax
   psql $DATABASE_URL -f supabase/seed.sql
   ```

### Preview Environment Issues

**Vercel preview not connecting to database**:

1. Verify Supabase integration is enabled in Vercel project settings
2. Check that the Supabase branch was created (GitHub check should show status)
3. Ensure `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` are being populated

**Render preview failing to start**:

1. Check build logs for Prisma connection errors
2. Verify `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` are set manually
3. Ensure URLs use the correct branch database credentials from Supabase Dashboard

**Supabase branch database not created**:

1. Verify GitHub integration is authorized
2. Check Supabase project settings → Integrations
3. Look for errors in GitHub check details

### Seed Validation Fails

**Symptom**: `supabase:validate-seed` script fails

**Solutions**:

1. **Database not seeded**

   ```bash
   # Manually run seed
   psql $DATABASE_URL -f supabase/seed.sql
   ```

2. **Wrong database URL**

   ```bash
   # Verify URL points to branch database, not production
   echo $DATABASE_URL
   ```

3. **Seed file syntax error**

   ```bash
   # Test seed file locally
   supabase start
   supabase db reset  # Applies migrations + seed
   ```

### Local Development Database

For local development (not preview environments):

```bash
# Use local PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/local_softwaremultitool"

# Or use Supabase local stack
supabase start
# Use the DATABASE_URL from supabase status output
```

## Best Practices

### 1. Always Use Prisma for Schema Changes

```bash
# CORRECT: Modify Prisma schema first
vim packages/database/prisma/schema.prisma
pnpm --filter @repo/database migrate

# INCORRECT: Modifying supabase/migrations directly
# Don't do this - changes will be overwritten by db pull
```

### 2. Keep Supabase Migrations in Sync

After any production deployment with schema changes:

```bash
SUPABASE_ACCESS_TOKEN="..." supabase db pull
git add supabase/
git commit -m "chore: sync supabase migrations"
```

### 3. Test Seed Data in PRs

Before merging PRs that modify seed data:

```bash
# Get preview branch DATABASE_URL
export DATABASE_URL="postgresql://..."

# Validate seed
pnpm --filter @repo/scripts supabase:validate-seed
```

### 4. Use Environment-Specific Configs

- **Development**: Local PostgreSQL or `supabase start`
- **Preview**: Supabase branch database (automatic)
- **Production**: Supabase production database

### 5. Monitor CI Checks

Always wait for all CI checks to pass:

- `validate-prs` - Lint, type-check, tests
- `Supabase` - Branch database creation
- `Vercel` - Preview deployment
- `Render` - Preview API server (if configured)

## Related Skills

- **prisma-migrate**: Database migration workflows
- **architecture**: Overall system architecture
- **render**: Render deployment details
- **better-auth**: Authentication system
