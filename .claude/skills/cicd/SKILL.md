---
name: managing-cicd
description: Manages CI/CD with GitHub Actions, Vercel preview deployments, Neon database branching, preview environment creation, environment variable syncing, and API proxy patterns. Use when debugging CI failures, understanding preview environments, or configuring deployment variables.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# CI/CD Skill

CI/CD pipeline, preview environments, and database branching workflow.

## Quick Reference

| Component         | Location                                 |
| ----------------- | ---------------------------------------- |
| GitHub Actions    | `.github/workflows/`                     |
| PR Validation     | `.github/workflows/validate-prs.yml`     |
| Preview Env Sync  | `.github/workflows/preview-env-sync.yml` |
| Neon API Client   | `tooling/scripts/src/neon/api-client.mjs` |
| Prisma Schema     | `packages/database/prisma/schema.prisma` |
| Prisma Migrations | `packages/database/prisma/migrations/`   |

## Architecture Overview

```text
PR Created → CI Checks → Preview Environments
                              ↓
              ┌──────────┬──────────┐
              │ Vercel   │   Neon   │
              │ Preview  │  Branch  │
              └──────────┴──────────┘
                              ↓
              PR Merge → Production Deploy
```

## Neon Database Branching

Each PR gets an isolated database branch via Neon's Vercel Previews Integration.

### How It Works

1. **PR Opens** → Neon creates a `preview/{branch}` database branch (copy-on-write from main)
2. **Branch Inherits** → Schema + seed data from parent branch automatically
3. **Vercel Builds** → `prisma migrate deploy` applies any new migrations
4. **PR Merged** → Neon branch auto-deleted when git branch is deleted

### Key Facts

- Prisma migrations are the sole source of truth (no dual migration system)
- Seed data is inherited via copy-on-write (no re-seeding needed)
- `DATABASE_URL` and `DATABASE_URL_UNPOOLED` are auto-injected by the Neon Vercel integration

### Migration Workflow

1. Modify Prisma schema
2. `pnpm --filter @repo/database migrate`
3. Commit & create PR
4. Neon preview branch inherits schema from parent
5. Vercel build step runs `prisma migrate deploy` to apply new migrations
6. PR merge → Prisma migration applies to production

## Vercel Preview Deployments

### Deployment Protection Bypass

For automated testing against preview URLs:

1. Get secret: Vercel → Project Settings → Deployment Protection
2. Configure Playwright:

```typescript
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
  extraHTTPHeaders["x-vercel-protection-bypass"] =
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
}
```

1. Run tests:

```bash
VERCEL_AUTOMATION_BYPASS_SECRET=prj_xxx \
BASE_URL=https://your-preview.vercel.app \
pnpm --filter web exec playwright test
```

### Environment Variables

```bash
pnpm web:env:list --target preview
pnpm web:env:set VARIABLE_NAME "value" --target preview
```

## Preview Environment Sync

GitHub Actions syncs env vars between Neon and Vercel when PR has the `preview` label.

### Sync Flow

1. Wait for Neon branch and Vercel preview to be ready (parallel polling)
2. Sync: Vercel ← Neon DB credentials (`DATABASE_URL`, `DATABASE_URL_UNPOOLED`)

### Required GitHub Secrets

| Secret           | Purpose            |
| ---------------- | ------------------ |
| `NEON_API_KEY`   | Neon Management API |
| `NEON_PROJECT_ID`| Neon project ID    |
| `VERCEL_TOKEN`   | Vercel API         |
| `VERCEL_PROJECT` | Vercel project ID  |
| `VERCEL_SCOPE`   | Vercel team ID     |

### Trigger Sync Manually

```bash
pnpm --filter @repo/scripts preview-sync run --pr <PR_NUMBER> --branch <BRANCH_NAME>
```

## API Proxy for Preview Auth

Preview environments use `/api/proxy/*` to forward requests (different domains can't share cookies).

**Key files**:

- Proxy: `apps/web/app/api/proxy/[...path]/route.ts`
- URL detection: `packages/utils/lib/api-url.ts`

For details, see the **architecture** skill's deployment section.

## Best Practices

1. **Use Prisma for schema changes** — single source of truth for all environments
2. **Seed the main Neon branch** — preview branches inherit data via copy-on-write
3. **Wait for all CI checks** — `validate-prs`, Neon branch, Vercel preview
4. **Run `prisma migrate deploy` in build step** — ensures preview branches have latest schema

## Troubleshooting

See [troubleshooting.md](troubleshooting.md) for:

- Migration check failures
- Preview environment issues
- E2E test blocking

## When to Use This Skill

Invoke this skill when:

- Understanding CI/CD pipeline flow
- Debugging preview environment issues
- Working with database branching
- Configuring environment variables for deployments
- Troubleshooting GitHub Actions workflows
- Understanding Vercel/Neon integration

**Activation keywords**: CI, CD, GitHub Actions, preview environment, deployment, Vercel deploy, Neon branch, PR checks, pipeline

## Related Skills

- **architecture**: API proxy implementation details and deployment infrastructure
- **prisma-migrate**: Database migration workflows
- **application-environments**: Environment overview and configuration
- **git-worktrees**: Worktree-based development and branch workflows
- **debugging**: Troubleshooting preview environment and deployment issues
- **github-cli**: GitHub operations and PR management
