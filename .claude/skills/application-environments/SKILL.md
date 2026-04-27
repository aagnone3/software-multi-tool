---
name: configuring-environments
description: Configures development environments using a local PostgreSQL container (Docker Compose, port 54322), Vercel preview deployments backed by Neon database branches, and production. Covers local setup, preview branch creation, environment variables, and database connection troubleshooting. Use when setting up local dev, fixing connection errors, configuring previews, or resolving "table not found" errors.
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

This project uses a **local PostgreSQL container** (Docker Compose, port 54322) for development. `pnpm setup` starts the container, applies Prisma migrations, and seeds the preview test user. Don't point `DATABASE_URL` at a separately installed Postgres (e.g. Homebrew on port 5432) — the seed and migration tooling assumes the Compose-managed container on port 54322.

## Quick Reference

| Environment    | Purpose               | Database                      | URL             |
| -------------- | --------------------- | ----------------------------- | --------------- |
| **Local**      | Full-stack development| Postgres (Docker Compose)     | `localhost:3500`|
| **Preview**    | Full-stack PR testing | Neon database branch          | `*.vercel.app`  |
| **Production** | Live application      | Neon (main)                   | Custom domain   |

**Supported databases:**

| Database                       | Port     | Use Case                    |
| ------------------------------ | -------- | --------------------------- |
| Postgres via Docker Compose    | 54322    | Local development (default) |
| Neon database branch           | Remote   | PR testing, integration     |
| ~~Homebrew Postgres~~          | ~~5432~~ | ❌ **Don't use** — seed/migrate tooling assumes port 54322 |

### Complete Local Setup Workflow

When setting up local development for the first time:

1. Run `pnpm setup` to ensure environment is ready (starts the Postgres container, applies migrations, seeds the database, creates env files)
2. Start the dev server: `pnpm dev`
3. Verify the application is accessible at the reported URL

Setup is complete when the dev server is running and accessible.

### Working on Feature Branches with New Migrations

**IMPORTANT**: When switching to a feature branch (or worktree) that introduces new database migrations, the local database won't have those migrations applied yet. This causes "table not found" or "column not found" errors.

**Symptom**: API errors like "Failed to create X" when testing new features that added database tables.

**Solution**: Reset the database to apply all migrations from the current branch:

```bash
pnpm db:reset
```

This destroys the database volume, restarts PostgreSQL, re-applies all Prisma migrations, and re-seeds with test data.

**When to reset:**

- After switching to a branch with new migrations
- After pulling changes that include new migrations
- When you see database errors about missing tables/columns

## Local Development

### Quick Start (Recommended)

```bash
pnpm install
pnpm setup    # Starts Postgres (Docker Compose), seeds database, creates .env.local files
pnpm dev      # Start Next.js dev server
```

**IMPORTANT**: Always use `pnpm dev` from monorepo root. This starts:

- **Web app**: `http://localhost:3500` (or PORT from `.env.local`)

### Frontend-Only Development

For fast iteration on UI without a running database:

```bash
pnpm dev   # Start Next.js without the database (API calls will fail)
```

Suitable for:

- Component development and styling
- TypeScript checking and linting
- Storybook (`pnpm --filter web storybook`)

### Full-Stack Local (Postgres via Docker Compose)

For authentication, database, and API testing, `pnpm setup` handles everything automatically. For manual control:

```bash
pnpm db:start   # Start PostgreSQL via Docker Compose
pnpm db:reset   # Destroy volume, re-apply migrations, and re-seed (REQUIRED for test user!)
pnpm dev        # Start Next.js dev server
```

> **Note:** Running only `pnpm db:start` does NOT seed the database. Use `pnpm setup` or `pnpm db:reset` to ensure the test user exists.

**Service URLs (Local)**:

| Service     | URL                |
| ----------- | ------------------ |
| PostgreSQL  | localhost:54322    |

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
2. Neon creates a database branch and the workflow applies migrations + seeds data
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
| Database        | Neon (Postgres)              |

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

This usually means the database wasn't seeded. Run:

```bash
pnpm setup --force-reset
```

Or verify test user exists manually:

```bash
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c \
  "SELECT email FROM \"user\" WHERE email = 'test@preview.local';"
```

If missing, reset the database: `pnpm db:reset`

### Database Connection Refused

```bash
pnpm db:status  # Check if running
pnpm db:start   # Start if not
```

### API Errors: "Failed to create X" or "Table not found"

This typically means you're on a feature branch with new database migrations that haven't been applied to your local Postgres container.

```bash
# Reset database to apply all migrations from current branch
pnpm db:reset
```

**Common scenario**: You created a worktree for a feature branch that adds new database tables. The shared Postgres container still has the schema from `main`.

## When to Use This Skill

Invoke this skill when:

- Setting up local development environment
- Understanding preview vs production deployments
- Configuring environment variables
- Troubleshooting environment-specific issues
- Starting the local Postgres container for full-stack development

**Activation keywords**: local dev, preview environment, environment setup, env variables, docker compose, pnpm setup, pnpm db:start, database connection

## Related Skills

- **git-worktrees**: Parallel development with isolated worktrees and port allocation
- **cicd**: CI/CD pipelines and preview environment automation
- **debugging**: Comprehensive troubleshooting across platforms
- **prisma-migrate**: Database migrations and schema management
- **better-auth**: Authentication configuration requiring proper database setup
- **architecture**: Overall deployment infrastructure
- **storage**: S3 (or any S3-compatible service) configuration for file uploads
