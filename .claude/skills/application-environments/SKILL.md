---
name: application-environments
description: Configures local, preview, and production environments including Supabase local, Vercel previews, and environment variables. Use when setting up development, understanding deployment targets, troubleshooting environment issues, or configuring databases for different environments.
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

## Database Requirements

This project requires **Supabase Local** (port 54322) or **Supabase Preview** for development. Homebrew PostgreSQL (port 5432) or standalone Postgres installations are not supported because they lack:

- Storage (S3-compatible file storage for uploads)
- Proper seeding (test user won't work)
- Schema compatibility (missing `storage` schema)

If your `.env.local` points to port `5432`, the database configuration is incorrect.

## Quick Reference

| Environment    | Purpose               | Database       | URL             |
| -------------- | --------------------- | -------------- | --------------- |
| **Local**      | Full-stack development| Supabase local | `localhost:3500`|
| **Preview**    | Full-stack PR testing | Supabase branch| `*.vercel.app`  |
| **Production** | Live application      | Supabase main  | Custom domain   |

**Supported databases:**

| Database              | Port     | Use Case                    |
| --------------------- | -------- | --------------------------- |
| Supabase Local        | 54322    | Local development (default) |
| Supabase Preview      | Remote   | PR testing, integration     |
| ~~Homebrew Postgres~~ | ~~5432~~ | ❌ **Never use**            |

## When to Use This Skill

Invoke this skill when:

- Setting up local development environment
- Understanding preview vs production deployments
- Configuring environment variables
- Troubleshooting environment-specific issues
- Starting Supabase local for full-stack development

**Activation keywords**: local dev, preview environment, environment setup, Supabase local, env variables

### Complete Local Setup Workflow

When setting up local development for the first time:

1. Check if Supabase local is running: `supabase status`
2. Start Supabase if needed: `supabase start`
3. Verify `apps/web/.env.local` exists (create from `.env.local.example` if missing)
4. Start the dev server: `pnpm dev`
5. Verify the application is accessible at the reported URL

Setup is complete when the dev server is running and accessible.

## Local Development

### Quick Start

```bash
pnpm install
cp apps/web/.env.local.example apps/web/.env.local
pnpm dev
```

**IMPORTANT**: Always use `pnpm dev` from monorepo root. This starts:

- **Web app**: `http://localhost:3500` (or PORT from `.env.local`)

### Frontend-Only Development

For fast iteration without backend:

- Component development and styling
- TypeScript checking and linting
- Hot reload

### Full-Stack Local (Supabase)

For authentication, database, and API testing:

```bash
supabase start        # Start PostgreSQL + Storage + Auth
supabase db reset     # Apply migrations and seed data
pnpm dev              # Start Next.js dev server
```

**Service URLs (Local)**:

| Service         | URL                       |
| --------------- | ------------------------- |
| Supabase Studio | http://127.0.0.1:54323    |
| PostgreSQL      | localhost:54322           |
| Mailpit (Email) | http://127.0.0.1:54324    |

### Background Jobs Local (Inngest)

For testing background job processing locally:

```bash
npx inngest-cli@latest dev    # Start Inngest dev server
```

This starts a local Inngest dashboard at http://localhost:8288 where you can:

- See registered functions
- View event history
- Trace function runs

**Note**: In production, Inngest is installed via the Vercel Marketplace and runs automatically. Local dev requires the CLI.

**Connection string**:

```text
postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

**Test user credentials**:

| Field    | Value              |
| -------- | ------------------ |
| Email    | test@preview.local |
| Password | TestPassword123    |

## Preview Environment

Every PR gets a complete, isolated environment automatically.

### What Happens on PR

1. GitHub Action triggers
2. Supabase creates database branch + applies migrations + seeds data
3. Vercel deploys preview
4. Ready to test at preview URL

### Test Credentials

Same as local: `test@preview.local` / `TestPassword123`

The login page shows "Quick Login as Test User" in preview environments.

## Production

Production deploys automatically when PRs merge to `main`.

| Component       | Platform                     |
| --------------- | ---------------------------- |
| Web App         | Vercel                       |
| Background Jobs | Inngest (Vercel Marketplace) |
| Database        | Supabase                     |

## Environment Variables

### Required Files

| File                           | When Needed           |
| ------------------------------ | --------------------- |
| `apps/web/.env.local`          | Always                |

### Managing Vercel Variables

```bash
pnpm web:env:list              # List all
pnpm web:env:pull              # Pull to .env.local
pnpm web:env:set VAR "value"   # Set variable
```

## Worktree-Specific Setup

When using git worktrees for parallel development, each worktree needs its own environment configuration with unique ports.

See the **git-worktrees** skill for complete worktree environment setup including:

- Port allocation for parallel dev servers
- Copying and configuring `.env.local` files

## Troubleshooting

### Dev Server Returns 404 on All Routes

Check for EMFILE errors (`too many open files`):

```bash
ulimit -n 65536
pnpm dev
```

**Permanent fix**: Add `ulimit -n 65536` to `~/.zshrc`.

### Login Fails with "Invalid credentials"

Verify test user exists in local database:

```bash
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c \
  "SELECT email FROM \"user\" WHERE email = 'test@preview.local';"
```

If missing, reset the database: `pnpm supabase:reset`

### Database Connection Refused

```bash
pnpm supabase:status  # Check if running
pnpm supabase:start   # Start if not
```

## Related Skills

- **git-worktrees**: Parallel development with isolated worktrees
- **cicd**: CI/CD pipelines and preview environment automation
- **debugging**: Comprehensive troubleshooting across platforms
