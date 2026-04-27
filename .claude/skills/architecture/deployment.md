# Deployment Infrastructure

This document provides comprehensive deployment infrastructure details for the software-multi-tool monorepo.

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                        Production                            │
├─────────────────┬─────────────────┬─────────────────────────┤
│     Vercel      │     Inngest     │       Neon              │
│  (Next.js App)  │  (Job Queue)    │  (Postgres)             │
│  - SSR/SSG      │  - 8 functions  │  - Database             │
│  - API routes   │  - Retries      │  - Connection pooling   │
│  - Edge funcs   │  - Observability│  - Auto-scaling         │
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

## Database: Neon (Production)

PostgreSQL hosted on **Neon** via the Vercel Marketplace integration.

| Variable | Purpose |
| -------- | ------- |
| `DATABASE_URL` | Pooled connection string (auto-injected by Vercel/Neon integration) |
| `DATABASE_URL_UNPOOLED` | Direct connection string for migrations (auto-injected) |

## Database: Local Development

Local PostgreSQL runs via **Docker Compose** (postgres:17 on port 54322):

| Setting  | Value     |
| -------- | --------- |
| Host     | 127.0.0.1 |
| Port     | 54322     |
| Database | postgres  |
| User     | postgres  |
| Password | postgres  |

**Connection string:**

```text
postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

**Setup:**

```bash
pnpm setup    # Starts Docker Compose, runs migrations, seeds database
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
