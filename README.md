# Software Multitool

Software Multitool is a customizable Next.js 15 monorepo for shipping modern SaaS products. It combines a React 19 App Router frontend with a typed Hono/oRPC backend, shared packages, and batteries-included tooling so your team can focus on product work instead of project setup.

## Highlights

- Next.js 15 + React 19 with server components, Tailwind CSS, Shadcn UI, and Radix primitives.
- Typed backend with Hono, oRPC, Prisma, and shared utilities under `packages/`.
- Multi-tenant ready authentication via better-auth with passkeys, magic links, and onboarding flows.
- Biome-powered formatting/linting, Turbo build orchestration, and pnpm workspaces.
- Built-in marketing site, SaaS dashboard, email templates, and localized content.

## Quick Start

### Choose your path

- **Local evaluation:** boot the app quickly to inspect the marketing site, dashboard shell, and overall project shape without making Vercel-managed secrets the default first step.
- **Full integrated setup:** connect Vercel-managed env plus external providers so auth, email, storage, analytics, payments, and deployment-sensitive flows behave like a real product environment.

### Shared prerequisites

1. Install dependencies: `pnpm install`

### Path A: Local evaluation

Before you run `pnpm run setup`, make sure these are installed and available in your shell:

- Docker (with the daemon running)
- pnpm

Optional but faster on a cold machine:

- Supabase CLI (the local-evaluation path does **not** require a global install; if missing, the repo will fall back to a pinned `pnpm dlx supabase` invocation)

1. Prepare the local database/runtime dependencies with `pnpm run setup`.
   - preflights the local prerequisites up front and stops with a short recovery path if Docker or pnpm is missing/unavailable
   - uses a globally installed Supabase CLI when present, otherwise falls back to a repo-owned pinned `pnpm dlx supabase` invocation
   - starts local Supabase if needed
   - resets/seeds the local database when the preview test user is missing or invalid
   - creates `apps/web/.env.local` from `apps/web/.env.local.example` when missing
   - auto-populates the local boot-critical defaults in `apps/web/.env.local` (`PORT`, `NEXT_PUBLIC_SITE_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `BETTER_AUTH_SECRET`)
2. Review `apps/web/.env.local` after setup only if you want to add optional provider credentials (OAuth, email, storage, analytics, payments, AI, etc.).
3. Launch the app: `pnpm dev`
4. Visit `http://localhost:3500`
5. Sign in with the seeded preview user when you want to validate auth-backed flows:
   - email: `test@preview.local`
   - password: `TestPassword123`
6. When you want a repeatable proof instead of a manual spot-check, run `pnpm local-eval:smoke`
   - reruns `pnpm run setup`
   - verifies the seeded preview user still exists in local Postgres via a repo-owned check (no host `psql` client required)
   - starts the app locally and checks the marketing home page plus `/auth/login`

Expected local success state:

- the marketing site loads at `/`
- local auth-backed flows can be exercised with the seeded preview user without hunting for hidden local Supabase/env values
- email, analytics, storage, AI, and payment integrations may still remain provider-gated until you wire real credentials

### Path B: Full integrated setup

1. Pull managed secrets from Vercel: `pnpm web:env:pull`
   - requires `VERCEL_TOKEN`, `VERCEL_PROJECT`, and `VERCEL_SCOPE` in your shell or `apps/web/.env*`
2. Add or verify the external provider credentials your setup uses.
3. Launch the app: `pnpm dev`
4. Validate the fully wired flows you care about.

### Contributor extras

- Install git hooks: `pre-commit install` (after installing [`pre-commit`](https://pre-commit.com/#install))
- Run lint, type-check, and tests before opening changes
- For parallel feature work, use `pnpm worktree:create`, `pnpm worktree:resume`, `pnpm worktree:list`, and `pnpm worktree:remove` for the repo-managed worktree flow. In practice that helper needs `pnpm` plus Docker (daemon running); a global Supabase CLI install is optional because the helper falls back to the repo-owned pinned CLI path when `supabase` is not already installed.

### Environment guide

Use `apps/web/.env.local.example` as the starting point, then separate variables by what they unlock:

| Category | Variables | Required for local evaluation? | Notes |
|----------|-----------|--------------------------------|-------|
| Boot‑critical | `PORT`, `NEXT_PUBLIC_SITE_URL`, `BETTER_AUTH_SECRET`, `POSTGRES_PRISMA_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` plus local runtime setup (Supabase + seeded Postgres) | Yes | These are the minimum variables needed to boot the app locally. The `pnpm setup` script auto‑populates them. |
| Auth‑required | GitHub/Google OAuth credentials and related provider config | No | Required for social sign‑in, passkeys, magic links, and onboarding flows. |
| Email‑required | SMTP, Plunk, Resend, Postmark, or Mailgun credentials | No | Required for transactional/auth email flows. |
| Storage / AI / analytics / payments | Optional integrations | No | Configure when validating those product areas. |
| Deploy‑only / hosted‑environment config | Vercel‑managed values (`VERCEL_TOKEN`, `VERCEL_PROJECT`, `VERCEL_SCOPE`) plus other production‑sensitive credentials | No | Not required for first local read‑through. |

## Pre-commit Hooks

After `pre-commit install`, each commit runs:

- `pnpm exec biome check --write` – Biome formatting + linting on staged files.
- `pnpm lint` – repository-wide Biome lint.
- `pnpm --filter web run type-check` – TypeScript checks for the web app.

## Common Tasks

- `pnpm dev` – run the development servers with Turbo.
- `pnpm build` – create production builds for all apps and packages.
- `pnpm start` – serve the production build locally.
- `pnpm lint` / `pnpm check` / `pnpm format` – lint, validate, and format with Biome.
- `pnpm worktree:create` / `pnpm worktree:resume` / `pnpm worktree:list` / `pnpm worktree:remove` – manage repo-owned git worktrees for parallel feature work.
- `pnpm --filter web run e2e` – execute Playwright end-to-end tests.
- `pre-commit run --all-files` – apply the configured git hooks manually.

## Testing

- `pnpm test` – run the Vitest workspace pipeline (scoped to affected packages via Turbo).
- `pnpm test -- --runInBand` – run the same pipeline serially for noisy environments and pre-commit checks.
- `pnpm test:ci` – execute tests with coverage thresholds enforced (matches the CI job).
- `pnpm --filter <workspace> test` – focus on a single workspace (e.g., `pnpm --filter @repo/api test`).
- `pnpm --filter web run e2e` / `pnpm --filter web run e2e:ci` – launch the Playwright UI runner or the headless CI variant. Append `-- --grep "test name"` to target individual specs.
- `pnpm --filter web run type-check` – run the web app's TypeScript project references.
- Database integration suites rely on Docker-backed Postgres containers; see `docs/postgres-integration-testing.md` for harness details and usage.
- Coverage reports are written to each workspace's `coverage/` directory after running the suites.
- Coverage thresholds are enforced per workspace; adjust the guardrails in `tooling/test/coverage-thresholds.ts` when raising expectations.

## Environment Management

- `pnpm web:env:list` – inspect Vercel environment variables for `apps/web` (add `--target <environment>` to scope).
- `pnpm web:env:pull` – download Vercel secrets directly into `apps/web/.env.local`.
- `pnpm web:env:set <key> <value>` – upsert a Vercel environment variable (defaults to the development target; override with `--target` or `--all-targets`).
- `pnpm web:env:unset <key>` – remove a Vercel environment variable for the selected target(s).
- `.env*` files now live alongside the Next.js app in `apps/web/` so each workspace can manage its secrets independently.

## Repository Layout

- `apps/web` – Next.js App Router frontend (marketing + SaaS experience).
- `packages` – shared domain packages (`ai`, `api`, `auth`, `database`, `i18n`, `mail`, etc.).
- `config` – central configuration (feature flags, branding, payments, i18n).
- `tooling` – shared build scripts and TypeScript configuration.

## Documentation

- In-app docs live under `apps/web/content/docs`.
- Agent/developer guidance, including Linear workflow helpers, is captured in `AGENTS.md`.
- Contributor workflow details (including testing expectations) are documented in `CONTRIBUTING.md`.

Have feedback or ideas? Open an issue or start a discussion in this repository to help shape Software Multitool.

<!-- Test commit for worktree skill verification - 2026-01-27 -->
