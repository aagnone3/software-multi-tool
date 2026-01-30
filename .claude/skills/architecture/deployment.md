# Deployment Infrastructure

This document provides comprehensive deployment infrastructure details for the software-multi-tool monorepo.

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                        Production                            │
├─────────────────┬─────────────────┬─────────────────────────┤
│     Vercel      │     Inngest     │       Supabase          │
│  (Next.js App)  │  (Job Queue)    │  (Postgres + Realtime)  │
│  - SSR/SSG      │  - 8 functions  │  - Database             │
│  - API routes   │  - Retries      │  - Storage              │
│  - Edge funcs   │  - Observability│  - Realtime channels    │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## Hosting: Vercel

The application is deployed to **Vercel** (serverless):

- Web app: `apps/web` (Next.js 15)
- Automatic deployments on push to main
- Preview deployments for pull requests
- Environment targets: development, preview, production

## Background Jobs: Inngest

Background job processing via **Inngest** (Vercel Marketplace integration):

| Environment | Dashboard | Event Delivery |
| ----------- | --------- | -------------- |
| Local | localhost:8288 | Inngest Dev Server |
| Preview | app.inngest.com | Inngest Cloud |
| Production | app.inngest.com | Inngest Cloud |

### Local Development

```bash
npx inngest-cli@latest dev
```

### Inngest Environment Variables

| Variable | Purpose |
| -------- | ------- |
| `INNGEST_EVENT_KEY` | API key for sending events |
| `INNGEST_SIGNING_KEY` | Webhook signature verification |

Note: In production, Inngest auto-detects Vercel environment via Marketplace integration.

## Real-time: Supabase

Real-time messaging via **Supabase Realtime**:

- Broadcast channels for pub/sub
- Presence for who's online
- No separate WebSocket server needed

### Supabase Environment Variables

| Variable | Purpose |
| -------- | ------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (client-safe) |

## CI/CD: GitHub Actions

Located in `.github/workflows/`:

| Workflow                | Trigger       | Purpose                     |
| ----------------------- | ------------- | --------------------------- |
| `validate-prs.yml`      | Pull requests | Lint, E2E tests, unit tests |
| `db-migrate-deploy.yml` | Push to main  | Apply Prisma migrations     |

### PR Validation Pipeline

1. Biome CI (lint + format)
2. Playwright E2E tests (60 min timeout)
3. Vitest unit tests (30 min timeout)
4. Uploads test artifacts (reports, screenshots, traces)

### Database Migration Pipeline

- Runs on main branch push
- Applies Prisma migrations via `pnpm db:migrate:deploy`
- Uses concurrency control (no cancel in progress)

## Database: Supabase (Production)

PostgreSQL hosted on **Supabase** with connection pooling (pgbouncer).

## Database: Local Development

Local PostgreSQL for development runs on the default Homebrew installation:

| Setting  | Value                   |
| -------- | ----------------------- |
| Host     | localhost               |
| Port     | 5432                    |
| Database | local_softwaremultitool |
| User     | postgres                |
| Password | postgres                |

**Connection string:**

```text
postgresql://postgres:postgres@localhost:5432/local_softwaremultitool
```

**Setup (if needed):**

```bash
# Create the database (using template1 since default postgres db may not exist)
PGPASSWORD=postgres psql -h localhost -U postgres -d template1 -c "CREATE DATABASE local_softwaremultitool;"
```

## Environment Management

**Vercel CLI integration:**

```bash
pnpm web:env:list    # List env vars
pnpm web:env:set     # Set env var (--target for scope)
pnpm web:env:unset   # Remove env var
pnpm web:env:pull    # Pull to .env.local
```

**Key environment files:**

- `apps/web/.env.local` - Local development
- `apps/web/.env.local.example` - Template

## Build Configuration

**Next.js** (`apps/web/next.config.ts`):

- Transpiles workspace packages
- Webpack plugins for Prisma monorepo

**Turbo** (`turbo.json`):

- Pipeline: generate -> build -> test
- Global dependencies: `.env.*local` files
- Cached outputs: dist, .next
