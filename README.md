# Software Multitool

Software Multitool is a customizable Next.js 15 monorepo for shipping modern SaaS products. It combines a React 19 App Router frontend with a typed Hono/oRPC backend, shared packages, and batteries-included tooling so your team can focus on product work instead of project setup.

## Highlights

- Next.js 15 + React 19 with server components, Tailwind CSS, Shadcn UI, and Radix primitives.
- Typed backend with Hono, oRPC, Prisma, and shared utilities under `packages/`.
- Multi-tenant ready authentication via better-auth with passkeys, magic links, and onboarding flows.
- Biome-powered formatting/linting, Turbo build orchestration, and pnpm workspaces.
- Built-in marketing site, SaaS dashboard, email templates, and localized content.

## Quick Start

1. Install dependencies: `pnpm install`
2. Copy environment defaults: `cp apps/web/.env.local.example apps/web/.env.local`
3. Pull secrets from Vercel: `pnpm web:env:pull` (requires `VERCEL_TOKEN`, `VERCEL_PROJECT`, and `VERCEL_SCOPE` in your shell or `apps/web/.env*`)
4. Install git hooks: `pre-commit install` (after installing [`pre-commit`](https://pre-commit.com/#install))
5. Launch the app: `pnpm dev`
6. Visit `http://localhost:3500` to explore the marketing site and `/app` for the dashboard.

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
