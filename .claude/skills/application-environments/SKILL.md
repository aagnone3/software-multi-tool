---
name: application-environments
description: Use this skill when working with environment configuration, deployment targets, or understanding how the application runs across local development, preview deployments, and production. Covers Supabase local stack, Vercel preview environments, Render deployments, environment variables, and cross-cutting concerns like authentication and database access.
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Grep
  - Glob
---

# Application Environments

This skill documents how the application is configured and deployed across three distinct environments: local development, preview (staging), and production.

## Environment Overview

| Environment | Purpose | Database | Auth | URL Pattern |
| ----------- | ------- | -------- | ---- | ----------- |
| **Local** | Developer workstation | Local PostgreSQL / Supabase | Better Auth (local) | `localhost:3500` |
| **Preview** | PR validation, stakeholder review | Supabase branch | Better Auth (preview) | `*.vercel.app` |
| **Production** | Live application | Supabase main | Better Auth (prod) | Custom domain |

## Local Development

### Quick Start (Complete Setup)

Follow these steps in order for a working local development environment:

```bash
# 1. Install dependencies
pnpm install

# 2. Set up web app environment
cp apps/web/.env.local.example apps/web/.env.local

# 3. Set up api-server environment
cp apps/api-server/.env.example apps/api-server/.env.local

# 4. Configure database connection in apps/web/.env.local
#    Update these lines with your local PostgreSQL connection:
#    POSTGRES_PRISMA_URL="postgresql://postgres:postgres@localhost:5432/local_softwaremultitool"
#    POSTGRES_URL_NON_POOLING="postgresql://postgres:postgres@localhost:5432/local_softwaremultitool"

# 5. Create local database (if not exists)
PGPASSWORD=postgres psql -h localhost -U postgres -d template1 \
  -c "CREATE DATABASE local_softwaremultitool;"

# 6. Run database migrations
pnpm --filter @repo/database migrate

# 7. Seed test data (optional but recommended)
PGPASSWORD=postgres psql -h localhost -U postgres \
  -d local_softwaremultitool -f supabase/seed.sql

# 8. Start development server
pnpm dev
```

**After startup:**

- Web app: `http://localhost:3500`
- API server: `http://localhost:4000`
- Test login: `test@preview.local` / `PreviewPassword123!`

### Database Options

You have two mutually exclusive options for local database:

#### Option A: Local PostgreSQL (Recommended for simplicity)

Uses Homebrew PostgreSQL on port 5432. This is the default configuration.

| Setting | Value |
| ------- | ----- |
| Database | `local_softwaremultitool` |
| User | `postgres` |
| Password | `postgres` |
| Port | `5432` |

**Connection string:**

```text
postgresql://postgres:postgres@localhost:5432/local_softwaremultitool
```

**Configure in `apps/web/.env.local`:**

```bash
POSTGRES_PRISMA_URL="postgresql://postgres:postgres@localhost:5432/local_softwaremultitool"
POSTGRES_URL_NON_POOLING="postgresql://postgres:postgres@localhost:5432/local_softwaremultitool"
```

#### Option B: Supabase Local Stack (For full Supabase features)

Uses Docker-based Supabase on port 54322. Choose this if you need Storage, Realtime, or Edge Functions.

**Start the stack:**

```bash
pnpm supabase:start
```

**Configure in `apps/web/.env.local`:**

```bash
POSTGRES_PRISMA_URL="postgresql://postgres:postgres@localhost:54322/postgres"
POSTGRES_URL_NON_POOLING="postgresql://postgres:postgres@localhost:54322/postgres"
```

**Note:** When using local PostgreSQL (Option A), the `storage.buckets` tables from `seed.sql` will error (harmless) since the storage schema only exists in Supabase.

### Supabase Local Stack

The local Supabase stack provides API, Database, Studio, Storage, Realtime, and Inbucket services.

**Management Commands:**

| Command | Description |
| ------- | ----------- |
| `pnpm supabase:check` | Verify CLI installation and version (requires >= 2.0.0) |
| `pnpm supabase:start` | Start all local Supabase services |
| `pnpm supabase:stop` | Gracefully stop all services |
| `pnpm supabase:status` | Check status and display service URLs |
| `pnpm supabase:reset` | Reset database with migrations and seed data |

**Service URLs (when running):**

| Service | URL |
| ------- | --- |
| API | `http://localhost:54321` |
| Database | `postgresql://postgres:postgres@localhost:54322/postgres` |
| Studio | `http://localhost:54323` |
| Inbucket (email) | `http://localhost:54324` |
| Analytics | `http://localhost:54327` |

**Prerequisites:**

- Docker running
- Supabase CLI installed (`brew install supabase/tap/supabase`)

### Port Allocation

Default ports for local development:

| App | Default Port | Worktree Range |
| --- | ------------ | -------------- |
| Web | 3500 | 3501-3999 |
| API Server | 4000 | 4001-4499 |
| Storybook | 6006 | - |

For worktree-based development with unique ports, see the `git-worktrees` skill.

### Test User

A test user is available for local development:

| Field | Value |
| ----- | ----- |
| Email | `test@preview.local` |
| Password | `PreviewPassword123!` |

**Seed the test user and sample data:**

```bash
PGPASSWORD=postgres psql -h localhost -U postgres \
  -d local_softwaremultitool -f supabase/seed.sql
```

This seeds:

- Test user and organization
- Credit balance (500 included, 247 used, 100 purchased)
- 17 credit transactions over 14 days
- 8 tool jobs (7 completed, 1 failed)

**Note:** Storage bucket inserts will error on local PostgreSQL (harmless - storage schema is Supabase-only).

## Preview Environment

Preview environments are automatically created for each pull request, providing isolated testing with production-like configuration.

### How It Works

```text
PR Created → GitHub Action → Supabase Branch + Vercel Preview
     ↓
PR Updated → Migrations Applied → Preview Deployed
     ↓
PR Merged → Branch Deleted → Preview Removed
```

### Supabase Database Branching

Each PR gets an isolated Supabase database branch:

- **Branch creation**: Automatic on PR open
- **Migration sync**: Prisma migrations are converted to Supabase format
- **Data isolation**: Each branch has its own data
- **Cleanup**: Branch deleted when PR is closed

**Migration sync script:** `tooling/scripts/src/supabase/sync-prisma-to-supabase.sh`

| System | Format |
| ------ | ------ |
| Prisma | `migrations/TIMESTAMP_name/migration.sql` |
| Supabase | `migrations/TIMESTAMP_name.sql` |

### Vercel Preview Deployments

- **URL pattern**: `<branch>-<project>.vercel.app`
- **Environment**: Production-like with preview database
- **Auto-deploy**: On every push to PR branch

### Preview Authentication

Preview environments use an API proxy to handle cross-origin authentication:

**Problem**: Better Auth cookies don't work cross-origin (Vercel → Supabase)

**Solution**: API proxy at `/api/proxy/[...path]` routes auth requests through the same origin

See the `api-proxy` skill for implementation details.

### Test User in Preview

Preview environments are automatically seeded with a test user:

| Field | Value |
| ----- | ----- |
| Email | `test@preview.local` |
| Password | `PreviewPassword123!` |

The login page shows a "Quick Login as Test User" button in non-production environments.

## Production Environment

### Deployment Platforms

| Component | Platform | Configuration |
| --------- | -------- | ------------- |
| Web App | Vercel | `vercel.json`, auto-deploy from `main` |
| API Server | Render | `render.yaml`, background workers |
| Database | Supabase | Production project |

### Production Database

- **Platform**: Supabase (managed PostgreSQL)
- **Connection**: Via `DATABASE_URL` environment variable
- **Pooling**: PgBouncer for connection management

### Deployment Flow

```text
main branch → GitHub Actions → Build & Test → Deploy
                    ↓
              Vercel (web)
              Render (api-server)
```

## Cross-Cutting Concerns

### Environment Detection

```typescript
// Check current environment
const isProduction = process.env.NODE_ENV === 'production';
const isPreview = process.env.VERCEL_ENV === 'preview';
const isDevelopment = process.env.NODE_ENV === 'development';

// Check for Vercel deployment
const isVercel = !!process.env.VERCEL;
```

### Environment Variables

**Required environment files:**

| File | Purpose |
| ---- | ------- |
| `apps/web/.env.local` | Web app config, database connection strings |
| `apps/api-server/.env.local` | API server config, auth secrets |

**Loading order:**

1. `.env` - Base configuration
2. `.env.local` - Local overrides (git-ignored)
3. `.env.development` / `.env.production` - Environment-specific
4. Vercel/Render environment configuration

**Key variables by environment:**

| Variable | Local | Preview | Production |
| -------- | ----- | ------- | ---------- |
| `POSTGRES_PRISMA_URL` | Local PG | Supabase branch | Supabase main |
| `NEXT_PUBLIC_SITE_URL` | `localhost:3500` | Preview URL | Production domain |
| `BETTER_AUTH_URL` | `localhost:4000` | API proxy | Production API |

**Managing Vercel env vars:**

```bash
pnpm web:env:list              # List all variables
pnpm web:env:set KEY=value     # Set a variable
pnpm web:env:pull              # Pull to .env.local
```

### Database Migrations

Migrations flow through the environment pipeline:

```text
Local Development → PR (Preview Branch) → Main (Production)
        ↓                   ↓                    ↓
    prisma migrate      supabase sync       prisma deploy
```

**Local migration command:**

```bash
pnpm --filter @repo/database migrate
```

See the `prisma-migrate` skill for detailed migration workflows.

### Authentication

Better Auth handles authentication across all environments:

| Environment | Configuration |
| ----------- | ------------- |
| Local | Direct API calls |
| Preview | API proxy for cookies |
| Production | Direct with proper CORS |

See the `better-auth` skill for implementation details.

## Debugging by Environment

### Local Issues

```bash
# Check Supabase status
pnpm supabase:status

# View logs
docker logs <container-id>

# Reset database
pnpm supabase:reset

# Check database connectivity
PGPASSWORD=postgres psql -h localhost -U postgres -d local_softwaremultitool -c "SELECT 1"
```

### Preview Issues

```bash
# Check Supabase branch status
# (via Supabase dashboard or CLI)

# View Vercel deployment logs
vercel logs <deployment-url>

# Check preview environment variables
vercel env ls --environment preview
```

### Production Issues

```bash
# View Vercel production logs
vercel logs --environment production

# Check Render logs
# (via Render dashboard)

# View Sentry for errors
# (via Sentry dashboard)
```

See the `debugging` skill for comprehensive troubleshooting.

## Related Skills

- **`cicd`**: CI/CD pipelines, GitHub Actions, deployment automation
- **`api-proxy`**: Preview environment authentication proxy
- **`debugging`**: Environment-specific troubleshooting
- **`render`**: Render deployment configuration
- **`git-worktrees`**: Local environment isolation for parallel development
- **`better-auth`**: Authentication across environments
- **`prisma-migrate`**: Database migration workflows
