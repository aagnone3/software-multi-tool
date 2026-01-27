---
name: application-environments
description: Use this skill when working with environment configuration, deployment targets, or understanding how the application runs across local development, preview deployments, and production. Covers the preview-first development workflow, Vercel deployments, Supabase branching, and environment variables.
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Grep
  - Glob
---

# Application Environments

This project uses a **preview-first development model**: local development for fast frontend iteration, preview deployments for full-stack testing.

## Quick Reference

| Environment | Purpose | Database | URL |
| ----------- | ------- | -------- | --- |
| **Local** | Frontend development | None (or preview DB) | `localhost:3500` |
| **Preview** | Full-stack PR testing | Supabase branch | `*.vercel.app` |
| **Production** | Live application | Supabase main | Custom domain |

## Local Development

Local dev is optimized for **fast frontend iteration**. No database setup required.

### Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file
cp apps/web/.env.local.example apps/web/.env.local

# 3. Start dev server
pnpm dev
```

**That's it.** Web app runs at `http://localhost:3500`.

### What Works Locally

- Frontend development with hot reload
- Component development and styling
- TypeScript checking and linting

### What Requires Preview Environment

- Database operations
- Authentication flows
- API endpoints that need data
- Full end-to-end testing

## Preview Environment (Primary Testing)

Every PR automatically gets a complete, isolated environment.

### What Happens on PR

```text
PR Created/Updated
      ↓
GitHub Action triggers
      ↓
├── Supabase: Creates database branch
├── Supabase: Applies migrations
├── Supabase: Seeds test data
└── Vercel: Deploys preview
      ↓
Ready to test at preview URL
```

### Test Credentials

All preview environments have a test user:

| Field | Value |
| ----- | ----- |
| Email | `test@preview.local` |
| Password | `TestPassword123` |

The login page shows "Quick Login as Test User" in preview environments.

### Preview URLs

- **Vercel preview**: `<branch>-<project>.vercel.app`
- **Supabase Studio**: Available in Supabase dashboard under Branches

## Production

Production deploys automatically when PRs merge to `main`.

| Component | Platform |
| --------- | -------- |
| Web App | Vercel |
| API Server | Render |
| Database | Supabase |

## Environment Variables

### Required Files

| File | When Needed |
| ---- | ----------- |
| `apps/web/.env.local` | Always (copy from `.env.local.example`) |
| `apps/api-server/.env.local` | Only for local API server |

### Key Variables

| Variable | Local | Preview | Production |
| -------- | ----- | ------- | ---------- |
| `NEXT_PUBLIC_SITE_URL` | `localhost:3500` | Auto-set | Production URL |
| `POSTGRES_PRISMA_URL` | Not needed | Auto-set | Auto-set |

### Managing Vercel Variables

```bash
pnpm web:env:list              # List all
pnpm web:env:pull              # Pull to .env.local
```

## Connecting Local to Preview Database (Optional)

For local debugging with real data, connect to a preview branch's database:

1. Get connection string from Supabase dashboard (your PR's branch)
2. Add to `apps/web/.env.local`:

```bash
POSTGRES_PRISMA_URL="<connection-string-from-supabase>"
POSTGRES_URL_NON_POOLING="<connection-string-from-supabase>"
```

1. Restart dev server

## Supabase Local Stack

For offline development or Supabase-specific features (Storage, Realtime, Edge Functions).

### Commands

```bash
pnpm supabase:check   # Verify CLI installed
pnpm supabase:start   # Start Docker stack
pnpm supabase:status  # Check status and URLs
pnpm supabase:stop    # Stop stack
pnpm supabase:reset   # Reset database with migrations + seed
```

### Service URLs (Local)

| Service | URL |
| ------- | --- |
| Supabase Studio | http://127.0.0.1:54323 |
| Supabase API | http://127.0.0.1:54321 |
| PostgreSQL | localhost:54322 |
| Mailpit (Email) | http://127.0.0.1:54324 |

**Note:** Supabase local uses fixed ports (54321-54327) and doesn't support multiple parallel instances.

### Setting Up Local Supabase in a Worktree

**⚠️ Critical Issue:** The `pnpm supabase:*` commands run from the **monorepo root**, not the worktree. This means:

- `supabase:reset` uses `seed.sql` from `main` branch, not your worktree
- Worktree changes to `supabase/seed.sql` or migrations won't be applied automatically

#### Step 1: Start Supabase (from monorepo root)

```bash
# These commands work from anywhere but use monorepo root's supabase/ directory
pnpm supabase:start
pnpm supabase:reset   # Applies main branch's seed.sql
```

#### Step 2: Update Worktree Environment Variables

Edit `apps/web/.env.local` in your worktree to point to local Supabase:

```bash
# Database - use local Supabase PostgreSQL (port 54322)
POSTGRES_PRISMA_URL="postgresql://postgres:postgres@localhost:54322/postgres"
POSTGRES_URL_NON_POOLING="postgresql://postgres:postgres@localhost:54322/postgres"

# Supabase API
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_PROJECT_ID="local"

# Storage - use local Supabase S3 (get keys from `pnpm supabase:status`)
S3_ACCESS_KEY_ID="<from supabase:status>"
S3_SECRET_ACCESS_KEY="<from supabase:status>"
S3_ENDPOINT="http://127.0.0.1:54321/storage/v1/s3"
S3_REGION="local"
```

#### Step 3: Apply Worktree-Specific Seed Data

If your worktree has changes to `supabase/seed.sql` that aren't on `main` yet:

```bash
# Option A: Run seed.sql directly against local database
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres \
  -f /path/to/worktree/supabase/seed.sql

# Option B: Apply specific changes manually
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c "
  UPDATE account SET password = 'new-hash' WHERE ...
"
```

#### Step 4: Regenerate Prisma Client

```bash
pnpm --filter @repo/database generate
```

#### Step 5: Verify Setup

```bash
# Check database connection
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT count(*) FROM \"user\";"

# Check storage buckets
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT name, public FROM storage.buckets;"

# Start dev server
pnpm dev
```

### Environment Variable Reference

| Variable | Remote Supabase | Local Supabase |
| -------- | --------------- | -------------- |
| `POSTGRES_PRISMA_URL` | `postgresql://...supabase.co:5432/postgres` | `postgresql://postgres:postgres@localhost:54322/postgres` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project>.supabase.co` | `http://127.0.0.1:54321` |
| `S3_ENDPOINT` | `https://<project>.supabase.co/storage/v1/s3` | `http://127.0.0.1:54321/storage/v1/s3` |
| `S3_REGION` | `us-east-1` | `local` |

### Switching Back to Remote Supabase

To switch back to using the remote Supabase (preview branch or production):

```bash
# Pull fresh environment from Vercel
pnpm web:env:pull

# Or manually restore the remote values in .env.local
```

### Troubleshooting

#### Login fails with "Invalid credentials"

The local database may have different seed data than expected. Check and update:

```bash
# Verify test user exists
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c \
  "SELECT email FROM \"user\" WHERE email = 'test@preview.local';"

# If using worktree's seed.sql with different password hash, apply it:
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c \
  "UPDATE account SET password = '<hash-from-worktree-seed.sql>' WHERE \"userId\" = (SELECT id FROM \"user\" WHERE email = 'test@preview.local');"
```

#### Storage API returns 403 Unauthorized

Ensure you're using the correct S3 credentials from `pnpm supabase:status`.

#### Database connection refused

```bash
# Check if Supabase is running
pnpm supabase:status

# If not running, start it
pnpm supabase:start
```

## Debugging

### Local Issues

```bash
# Check if dev server is running
lsof -i :3500

# Restart dev server
pkill -f "next dev" && pnpm dev
```

### Preview Issues

```bash
# View Vercel logs
vercel logs <preview-url>

# Check Supabase branch status
# Use Supabase dashboard → Branches
```

## Related Skills

- **`cicd`**: CI/CD pipelines and deployment automation
- **`api-proxy`**: Preview environment authentication
- **`debugging`**: Comprehensive troubleshooting
- **`git-worktrees`**: Parallel development workflow
