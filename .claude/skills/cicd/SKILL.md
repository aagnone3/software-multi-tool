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

### Supabase Migrations (Sync)

- **Location**: `supabase/migrations/`
- **Purpose**: Supabase branching and preview environments
- **When to use**: Synced from production after Prisma migrations are applied
- **Workflow**: `supabase db pull` after production deploy

Supabase migrations are used by the branching system to create preview databases.

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
│  4. PR Review & Merge                                            │
│     └── Prisma migration applies to production                   │
│                                                                   │
│  5. Sync Supabase Migrations                                     │
│     └── supabase db pull                                         │
│                                                                   │
│  6. Commit Supabase Migrations                                   │
│     └── git commit -m "chore: sync supabase migrations"          │
└─────────────────────────────────────────────────────────────────┘
```

### Why Two Systems?

| Aspect                 | Prisma                 | Supabase                     |
| ---------------------- | ---------------------- | ---------------------------- |
| **Primary use**        | Development workflow   | Preview environments         |
| **Schema changes**     | Yes                    | Sync only                    |
| **CI/CD integration**  | GitHub Actions deploy  | Automatic branching          |
| **Local development**  | `pnpm dev`             | `supabase start` (optional)  |
| **Production deploy**  | Manual/CD pipeline     | Mirrors production           |

### Keeping in Sync

After any Prisma migration is deployed to production:

```bash
# Pull latest schema from production
SUPABASE_ACCESS_TOKEN="..." supabase db pull

# This updates supabase/migrations/ with production schema
# Commit the changes
git add supabase/migrations/
git commit -m "chore: sync supabase migrations from production"
```

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

Supabase branching creates the database but does **not** automatically set `DATABASE_URL` or `DIRECT_URL` environment variables. Since this project uses Prisma, you must configure these manually.

**Prisma requires two connection strings** (from `packages/database/prisma/schema.prisma`):

```prisma
datasource db {
    provider  = "postgresql"
    url       = env("DATABASE_URL")      # Pooled connection (for app)
    directUrl = env("DIRECT_URL")        # Direct connection (for migrations)
}
```

**For Supabase branch databases**, construct the URLs from the branch connection info:

```bash
# Pooled connection (Transaction mode via Supavisor)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (for Prisma migrations)
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

**Where to find these values**:

1. Go to Supabase Dashboard → Database → Branches
2. Select your PR's branch
3. Click "Connect" to view connection strings
4. Use "Transaction" mode URL for `DATABASE_URL`
5. Use "Session" mode URL for `DIRECT_URL`

**Configure in Vercel for preview deployments**:

```bash
# Set for Preview environment only
pnpm web:env:set DATABASE_URL "postgresql://..." --target preview
pnpm web:env:set DIRECT_URL "postgresql://..." --target preview
```

**Note**: Each Supabase branch has unique credentials. For dynamic preview environments, consider using Supabase's Vercel integration which can auto-inject the correct branch database URL, or set up a GitHub Action to update Vercel env vars when branches are created.

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

Render preview environments need these env vars configured manually:

| Variable              | Description                                      |
| --------------------- | ------------------------------------------------ |
| `DATABASE_URL`        | Pooled connection to Supabase branch database    |
| `DIRECT_URL`          | Direct connection for Prisma migrations          |
| `BETTER_AUTH_SECRET`  | Same as production (or preview-specific)         |

**Important**: Render does not automatically receive Supabase branch database credentials. You must:

1. Get the branch database connection strings from Supabase Dashboard
2. Configure them in Render Dashboard → Service → Environment
3. Use the same `DATABASE_URL` and `DIRECT_URL` format as described in the Vercel section above

For truly dynamic preview environments, consider setting up a GitHub Action that:

1. Listens for Supabase branch creation webhook
2. Updates Render environment variables via Render API

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

**Prisma can't connect: "DATABASE_URL not set" or connection errors**:

Supabase branching does NOT automatically set `DATABASE_URL` or `DIRECT_URL`. You must configure them manually.

1. Get connection strings from Supabase Dashboard → Database → Branches → [Your Branch] → Connect
2. Set both `DATABASE_URL` (pooled/transaction mode) and `DIRECT_URL` (session mode)
3. For Vercel: `pnpm web:env:set DATABASE_URL "..." --target preview`
4. For Render: Dashboard → Service → Environment

**Vercel preview not connecting to database**:

1. Verify `DATABASE_URL` AND `DIRECT_URL` are both set for Preview environment
2. Check the URLs point to the **branch** database, not production
3. Ensure the branch database was created (check Supabase Dashboard → Branches)
4. Verify the password in the URL is correct (branch DBs have unique passwords)

**Render preview failing to start**:

1. Check build logs in Render dashboard for Prisma connection errors
2. Verify both `DATABASE_URL` and `DIRECT_URL` are set
3. Ensure URLs use the correct branch database credentials

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
