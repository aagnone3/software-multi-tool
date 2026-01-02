# AGENTS.md

This guide equips coding agents to work effectively inside this pnpm/Turbo-powered Next.js monorepo.

## Core Workflows

- `pnpm dev` – launch the hot-reloading development server.
- `pnpm build` – compile all apps and packages for production; run before `pnpm start`.
- `pnpm test` – execute the Turbo-powered workspace Vitest pipeline.
- `pnpm test:ci` – run tests with coverage + thresholds enforced (CI parity).
- `pnpm start` – serve the production build locally.
- `pnpm lint` / `pnpm check` / `pnpm format` – run Biome linting, validation, and formatting.
- `pnpm web:env:pull` – pull the latest environment variables from Vercel into `apps/web/.env.local` (requires Vercel CLI auth or `VERCEL_TOKEN`).
- `pnpm web:env:list` / `pnpm web:env:set` / `pnpm web:env:unset` – inspect, upsert, and remove Vercel environment variables for `apps/web` (use `--target <env>` as needed).
- `pre-commit run --all-files` – execute the git hooks on demand.

## Testing

- `pnpm --filter web run e2e` – execute Playwright E2E tests with the UI.
- `pnpm --filter web run e2e:ci` – run the E2E suite headlessly for CI.
- `pnpm --filter web run type-check` – perform TypeScript checks for the web app.
- Add `-- --grep "test name"` to target individual Playwright tests.

## Monorepo Layout

- `apps/web/` – Next.js 15 App Router frontend using React 19, Tailwind CSS, Shadcn UI.
- `packages/ai/` – AI-related helpers.
- `packages/api/` – Hono + oRPC server routes.
- `packages/auth/` – better-auth configuration.
- `packages/database/` – Prisma schema and generated types.
- `packages/i18n/` – next-intl translation helpers.
- `packages/logs/`, `packages/mail/`, `packages/payments/`, `packages/storage/`, `packages/utils/` – shared infrastructure and utilities.
- `config/`, `tooling/` – build configuration and shared scripts.

## Tech Stack Snapshot

- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS, Shadcn UI, Radix UI.
- Backend: Hono with oRPC for typed APIs.
- State & Data: TanStack Query, nuqs, Prisma.
- Tooling: Turbo builds, pnpm workspaces, Biome for lint/format, Playwright for E2E.

## Working Practices

- Prefer React Server Components; use client components only when required.
- Stick to functional components and TypeScript interfaces (avoid classes/enums).
- Use the shared `cn()` utility for Tailwind class composition.
- Build mobile-first responsive UIs.
- Reference internal packages via the `@repo/*` workspace alias.
- Follow the `apps/web/.env.local.example` pattern when touching environment variables.
- Install the git hooks with `pre-commit install` after cloning; they run Biome formatting (`pnpm exec biome check --write`), workspace linting (`pnpm lint`), and TypeScript checks for the web app (`pnpm --filter web run type-check`) before each commit.

## Linear Integration

- MCP linear tool handles standard CRUD; for gaps use the helper CLI in `tooling/scripts/src/linear/index.mjs`.
- Set `LINEAR_API_KEY` in `apps/web/.env.local` so helper scripts can load it automatically.
- Run commands via `pnpm --filter @repo/scripts linear <resource> <action>`.
  - `projects list [--query]`
  - `projects dependency --blocking <ref> --blocked <ref> [--anchor] [--related-anchor] [--type]`
  - `projects dependency --remove --id <relationId>`
  - `milestones list --project <ref>`
  - `milestones create --project <ref> --name <text> [--description] [--target] [--sort]`
  - `issues set-milestone --issue <key> --project <ref> --milestone <ref>`
  - `issues dependency --blocked <key> --blocking <key>`
