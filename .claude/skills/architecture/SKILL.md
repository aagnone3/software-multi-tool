---
name: architecture
description: Use this skill when exploring the codebase structure, understanding integrations, or navigating the monorepo. Provides comprehensive architecture overview including API layer, frontend, database, and external integrations.
allowed-tools:
  - Read
  - Grep
  - Glob
---

# Architecture Skill

This skill provides comprehensive guidance for understanding and navigating the codebase architecture, including the monorepo structure, API layer, frontend patterns, and external integrations.

## Quick Reference

| Component        | Entry Point                               |
| ---------------- | ----------------------------------------- |
| Backend API      | `packages/api/index.ts`                   |
| API Router       | `packages/api/orpc/router.ts`             |
| Procedures       | `packages/api/orpc/procedures.ts`         |
| **API Server**   | **`apps/api-server/src/index.ts`**        |
| **API Server**   | **`apps/api-server/src/lib/server.ts`**   |
| Auth             | `packages/auth/auth.ts`                   |
| Database         | `packages/database/prisma/schema.prisma`  |
| Web App          | `apps/web/app/`                           |
| API Catch-All    | `apps/web/app/api/[[...rest]]/route.ts`   |
| **API Proxy**    | **`apps/web/app/api/proxy/[...path]/`**   |
| Environment URLs | `packages/utils/lib/api-url.ts`           |
| Config           | `config/index.ts`                         |
| Theme            | `tooling/tailwind/theme.css`              |
| PR Validation    | `.github/workflows/validate-prs.yml`      |
| DB Migrations    | `.github/workflows/db-migrate-deploy.yml` |
| Env Scripts      | `tooling/scripts/src/env/`                |
| Render Deploy    | `render.yaml`                             |
| Next.js Config   | `apps/web/next.config.ts`                 |
| Turbo Config     | `turbo.json`                              |

## Monorepo Structure

This is a **pnpm + Turbo monorepo** with workspace dependencies. All commands use `dotenv -c` to load environment variables from `apps/web/.env.local`.

```text
/
├── apps/
│   ├── web/                    # Next.js 15 App Router (Vercel)
│   └── api-server/             # Fastify backend (Render)
├── packages/                   # Backend/shared logic
│   ├── api/                    # Hono + oRPC API
│   ├── auth/                   # better-auth configuration
│   ├── database/               # Prisma ORM + Zod schemas
│   ├── payments/               # Payment providers
│   ├── mail/                   # Email providers + templates
│   ├── storage/                # File storage (S3)
│   ├── ai/                     # AI SDK integration
│   ├── i18n/                   # Internationalization
│   ├── logs/                   # Logging
│   └── utils/                  # Shared utilities
├── config/                     # App configuration
├── tooling/                    # Build infrastructure
└── render.yaml                 # Render deployment config
```

### Apps

**`apps/web`** - Next.js 15 App Router application (deployed to Vercel)

- `app/(marketing)/` - Public marketing pages with locale-based routing
- `app/(saas)/` - Authenticated SaaS dashboard with organization support
- `app/api/[[...rest]]/` - Catch-all route that proxies to Hono backend
- `app/auth/` - Authentication pages (login, signup, etc.)
- Dev server runs on port 3500

**`apps/api-server`** - Fastify backend service (deployed to Render)

- `src/index.ts` - Main entry point with graceful shutdown
- `src/lib/server.ts` - Fastify server configuration with oRPC + WebSocket
- `src/config/env.ts` - Environment validation with Zod
- Supports long-running jobs beyond Vercel's timeout limits
- Native WebSocket support for real-time communication
- Shares database and auth with Next.js app
- Dev server runs on port 4000

### Packages

All backend logic lives in `packages/`:

| Package          | Purpose                                               | Key Files                                |
| ---------------- | ----------------------------------------------------- | ---------------------------------------- |
| `@repo/api`      | Hono + oRPC typed API routes                          | `index.ts`, `orpc/router.ts`, `modules/` |
| `@repo/auth`     | better-auth with passkeys, magic links, organizations | `auth.ts`, `client.ts`                   |
| `@repo/database` | Prisma schema, generated types, Zod schemas           | `prisma/schema.prisma`                   |
| `@repo/payments` | Multi-provider payment integration                    | `index.ts`, `providers/`                 |
| `@repo/mail`     | React Email templates + Nodemailer                    | `index.ts`, `templates/`                 |
| `@repo/storage`  | AWS S3 file/image storage                             | `index.ts`                               |
| `@repo/ai`       | Vercel AI SDK integration                             | `index.ts`                               |
| `@repo/logs`     | Centralized logging (consola)                         | `index.ts`                               |
| `@repo/utils`    | Shared utility functions                              | `index.ts`                               |

### Configuration

**`config/`** - Central application configuration

- `index.ts` - Main config export with feature flags, branding, payments settings
- Used by packages to determine enabled features

**`tooling/`** - Build infrastructure

- `typescript/` - Shared TypeScript configs
- `tailwind/` - Shared Tailwind theme with CSS variables in `theme.css`
- `scripts/` - CLI tooling for env management, Linear integration, metrics
- `test/` - Vitest coverage thresholds

## Hybrid Backend Architecture

The application uses a **dual-backend hybrid architecture** with complementary strengths:

### Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                         User/Browser                             │
└───────────────┬──────────────────────────────┬──────────────────┘
                │                               │
                ▼                               ▼
    ┌──────────────────────┐        ┌──────────────────────┐
    │   Next.js Frontend   │        │  WebSocket Client    │
    │     (Vercel)         │        │   (Browser WS)       │
    │  - SSR/SSG pages     │        └──────────┬───────────┘
    │  - Light API routes  │                   │
    │  - TanStack Query    │                   │
    └──────────┬───────────┘                   │
               │                               │
               ▼                               ▼
    ┌──────────────────────┐        ┌──────────────────────┐
    │    Hono + oRPC       │        │  Fastify Backend     │
    │   (Serverless)       │        │     (Render)         │
    │  - /api/rpc/*        │        │  - /ws (WebSocket)   │
    │  - 60s timeout       │        │  - /api/rpc/*        │
    └──────────┬───────────┘        │  - /api/* (OpenAPI)  │
               │                    │  - No timeout        │
               │                    │  - Long-running jobs │
               └────────────────────┴──────────────────────┘
                                    │
                                    ▼
                        ┌──────────────────────┐
                        │   PostgreSQL (DB)    │
                        │   Better Auth        │
                        └──────────────────────┘
```

### When to Use Each Backend

**Use Next.js/Hono (Vercel)** for:

- Quick API requests (< 60 seconds)
- Server-side rendering (SSR) and static generation (SSG)
- Edge functions and CDN-optimized routes
- Standard CRUD operations
- Most user-facing API endpoints

**Use Fastify (Render)** for:

- Long-running AI/ML processing jobs
- WebSocket connections for real-time updates
- Background job processing
- Slack/Discord bot integrations
- Tasks requiring > 60 seconds
- Persistent connections

### Shared Resources

Both backends share:

- **PostgreSQL database** (same `DATABASE_URL`)
- **Better Auth sessions** (same `BETTER_AUTH_SECRET`)
- **oRPC API definitions** (from `@repo/api`)
- **Prisma ORM** (from `@repo/database`)
- **Environment configuration**

### Deployment

- **Next.js**: Vercel (serverless, edge functions)
- **Fastify**: Render (Docker, persistent process)
- **Database**: Render Postgres or external provider

## API Architecture (Hono + oRPC)

The backend uses **Hono** web framework with **oRPC** for end-to-end type safety.

### Request Flow

```text
User Action (frontend)
    ↓
TanStack Query mutation/query
    ↓
oRPC client call to /api/rpc/module/procedure
    ↓
Next.js catch-all route (apps/web/app/api/[[...rest]]/route.ts)
    ↓
Hono middleware (logging, CORS, auth, payments)
    ↓
oRPC router dispatch
    ↓
API module procedure (public/protected/admin)
    ↓
Database interaction via Prisma
    ↓
Response with Zod-validated schema
    ↓
TanStack Query cache update
    ↓
UI re-renders
```

### Module Organization

API modules are organized by domain in `packages/api/modules/`:

```text
packages/api/modules/
├── admin/          # Admin operations
├── ai/             # AI endpoints
├── contact/        # Contact form
├── newsletter/     # Newsletter subscriptions
├── organizations/  # Organization management
├── payments/       # Payment operations
└── users/          # User management
```

Each module exports a router that composes into the main router at `packages/api/orpc/router.ts`.

### Procedure Types

Defined in `packages/api/orpc/procedures.ts`:

```typescript
// Base context with headers
publicProcedure    → { headers }

// Requires authenticated session via better-auth
protectedProcedure → { headers, session, user }

// Requires admin role
adminProcedure     → { headers, session, user } + admin check
```

### API Endpoints

| Endpoint                 | Purpose                         |
| ------------------------ | ------------------------------- |
| `/api/rpc/*`             | oRPC JSON-RPC calls (type-safe) |
| `/api/openapi`           | Merged OpenAPI schema           |
| `/api/docs`              | Scalar API documentation UI     |
| `/api/health`            | Health check                    |
| `/api/webhooks/payments` | Payment provider webhooks       |
| `/api/auth/**`           | better-auth routes              |

### Type Safety

The API exports `ApiRouterClient` type for frontend consumption:

```typescript
// In packages/api/orpc/router.ts
export type ApiRouterClient = typeof apiRouter;

// Frontend uses @orpc/tanstack-query for type-safe calls
```

### API Proxy for Preview Environments

**Skill available**: Use the `api-proxy` skill for detailed proxy guidance.

In preview environments, the frontend (Vercel) and backend (Render) are deployed to different domains, which breaks session cookies. The API proxy makes requests appear same-origin:

```text
Production:  Browser → api.domain.com (direct, cookies work)
Preview:     Browser → /api/proxy/* → Render preview (cookies forwarded)
```

**Key components:**

| Component          | Location                                     |
| ------------------ | -------------------------------------------- |
| Proxy Route        | `apps/web/app/api/proxy/[...path]/route.ts`  |
| Proxy Utilities    | `apps/web/app/api/proxy/lib.ts`              |
| Environment URLs   | `packages/utils/lib/api-url.ts`              |

**Environment detection:**

```typescript
import { getOrpcUrl, isPreviewEnvironment } from "@repo/utils";

// Returns "/api/proxy/rpc" in preview, "{baseUrl}/api/rpc" in production
const orpcUrl = getOrpcUrl();
```

## Frontend Architecture

### Technology Stack

- **Next.js 15** - App Router with React Server Components
- **React 19** - Latest with automatic batching and server actions
- **TypeScript** - Full type coverage
- **Tailwind CSS 4** - Utility-first styling
- **Shadcn UI** - Pre-built accessible components
- **Radix UI** - Headless UI primitives
- **TanStack Query v5** - Data fetching and caching
- **TanStack Table v8** - Advanced data tables
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **next-intl** - Internationalization with locale routing
- **nuqs** - URL state management (querystring sync)

### Component Patterns

- **React Server Components** by default (zero JS when possible)
- **Client components** (`"use client"`) only when needed for:
  - Interactivity (onClick, onChange, etc.)
  - React hooks (useState, useEffect, etc.)
  - Browser APIs (localStorage, etc.)
- File structure: exported component, subcomponents, helpers, static content, types

### State Management

| Type                  | Solution                             |
| --------------------- | ------------------------------------ |
| URL state             | nuqs                                 |
| Server state          | TanStack Query + oRPC                |
| Local component state | React hooks                          |
| No Redux/Zustand      | Not needed with RSC + TanStack Query |

### Styling

- Global theme variables in `tooling/tailwind/theme.css`
- `cn()` utility for Tailwind class merging
- Mobile-first responsive design

## Data Layer

### Primary ORM: Prisma

- Schema: `packages/database/prisma/schema.prisma`
- Generated client: `packages/database/prisma/generated/`
- Auto-generated Zod schemas via `prisma-zod-generator`

### Secondary ORM: Drizzle

Dual-ORM setup for flexibility. Drizzle available alongside Prisma.

### Client-Side Data Fetching

- **TanStack Query** for caching and mutations
- **oRPC client** for type-safe API calls
- No manual fetch calls needed

### Testing

- Integration tests use **Testcontainers** with Postgres 17
- Test harness: `packages/database/tests/postgres-test-harness.ts`

## Key Integrations

### Authentication

**Skill available**: Use the `better-auth` skill for detailed auth guidance.

- **better-auth** framework with multiple auth methods
- Passkeys, magic links, OAuth (Google, GitHub)
- Multi-tenant organizations with RBAC
- Configuration: `packages/auth/auth.ts`

### Payments

Multi-provider architecture supporting:

- **Stripe** (primary)
- Polar SH
- LemonSqueezy
- Chargebee
- DodoPayments

Webhook handler: `POST /api/webhooks/payments`

Configuration: `packages/payments/`

### Credit System

Usage-based consumption model for tools:

- **Credit packs only** (no overage billing) - users have predictable costs
- Plans include credits per billing period (Free: 10, Pro: 500, Enterprise: 5000)
- Tools consume credits based on `creditCost` in `config/index.ts`
- When credits run out, users purchase additional credit packs

See the **tools skill** for detailed credit system documentation.

### Email

- **React Email** for component-based templates
- **Nodemailer** transport
- Multi-language support via next-intl
- Templates: `packages/mail/templates/`

### Storage

- **AWS S3** via AWS SDK v3
- Presigned URL support
- Configuration: `packages/storage/`

### AI

- **Vercel AI SDK** for LLM abstraction
- Providers: OpenAI (GPT), Anthropic (Claude)
- Configuration: `packages/ai/`

## Deployment Infrastructure

### Hosting: Vercel

The application is deployed to **Vercel** (serverless):

- Web app: `apps/web` (Next.js 15)
- Automatic deployments on push to main
- Preview deployments for pull requests
- Environment targets: development, preview, production

### CI/CD: GitHub Actions

Located in `.github/workflows/`:

| Workflow                | Trigger       | Purpose                     |
| ----------------------- | ------------- | --------------------------- |
| `validate-prs.yml`      | Pull requests | Lint, E2E tests, unit tests |
| `db-migrate-deploy.yml` | Push to main  | Apply Prisma migrations     |

**PR Validation Pipeline:**

1. Biome CI (lint + format)
2. Playwright E2E tests (60 min timeout)
3. Vitest unit tests (30 min timeout)
4. Uploads test artifacts (reports, screenshots, traces)

**Database Migration Pipeline:**

- Runs on main branch push
- Applies Prisma migrations via `pnpm db:migrate:deploy`
- Uses concurrency control (no cancel in progress)

### Database: Supabase (Production)

PostgreSQL hosted on **Supabase** with connection pooling (pgbouncer).

### Database: Local Development

Local PostgreSQL for development runs on the default Homebrew installation:

| Setting  | Value             |
| -------- | ----------------- |
| Host     | localhost         |
| Port     | 5432              |
| Database | local_aimultitool |
| User     | postgres          |
| Password | postgres          |

**Connection string:**

```text
postgresql://postgres:postgres@localhost:5432/local_aimultitool
```

**Setup (if needed):**

```bash
# Create the database (using template1 since default postgres db may not exist)
PGPASSWORD=postgres psql -h localhost -U postgres -d template1 -c "CREATE DATABASE local_aimultitool;"
```

### Environment Management

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

### Build Configuration

**Next.js** (`apps/web/next.config.ts`):

- Transpiles workspace packages
- Webpack plugins for Prisma monorepo

**Turbo** (`turbo.json`):

- Pipeline: generate -> build -> test
- Global dependencies: `.env.*local` files
- Cached outputs: dist, .next

## Workspace References

Reference internal packages via `@repo/*` workspace alias:

```typescript
import { auth } from "@repo/auth";
import { db } from "@repo/database";
import { apiClient } from "@repo/api/client";
```

## When to Use This Skill

Invoke this skill when:

- Exploring the codebase structure
- Understanding how components connect
- Navigating the monorepo
- Finding where specific functionality lives
- Understanding the API request flow
- Learning the frontend data fetching patterns
- Adding new modules or packages (see examples.md)
- Understanding the CI/CD pipeline
- Managing environment variables
- Troubleshooting deployment issues

## Related Skills

- **api-proxy**: Preview environment authentication proxy
- **better-auth**: Authentication implementation details
- **cicd**: CI/CD pipeline and preview environments
- **prisma-migrate**: Database migration workflows
- **linear**: Project management integration
- **github-cli**: GitHub operations

## Additional Resources

- In-app docs: `apps/web/content/docs`
- Testing docs: `docs/postgres-integration-testing.md`
- Cursor rules: `.cursor/rules/`
