---
name: managing-cicd
description: Manages CI/CD with GitHub Actions, Vercel preview deployments, Supabase database branching, Prisma-to-Supabase migration sync, preview environment creation, env var syncing, and API proxy patterns. Use when debugging deployments, syncing migrations, troubleshooting GitHub Actions, configuring preview environments, or resolving CI failures.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# CI/CD Skill

CI/CD pipeline, preview environments, and database branching workflow.

## When to Use This Skill

Invoke this skill when:

- Understanding CI/CD pipeline flow
- Debugging preview environment issues
- Working with database branching
- Syncing Prisma and Supabase migrations
- Configuring environment variables for deployments
- Troubleshooting GitHub Actions workflows
- Understanding Vercel/Supabase integration

## Quick Reference

| Component           | Location                                              |
| ------------------- | ----------------------------------------------------- |
| GitHub Actions      | `.github/workflows/`                                  |
| PR Validation       | `.github/workflows/validate-prs.yml`                  |
| Supabase Config     | `supabase/config.toml`                                |
| Supabase Migrations | `supabase/migrations/`                                |
| Prisma Schema       | `packages/database/prisma/schema.prisma`              |
| Prisma Migrations   | `packages/database/prisma/migrations/`                |
| Seed Script         | `pnpm --filter @repo/scripts supabase:validate-seed`  |

## Architecture Overview

```text
PR Created → CI Checks → Preview Environments
                              ↓
              ┌──────────┬──────────┐
              │ Vercel   │ Supabase │
              │ Preview  │ Branch   │
              └──────────┴──────────┘
                              ↓
              PR Merge → Production Deploy
```

## Supabase Branching

Each PR gets an isolated database branch automatically.

### How It Works

1. **PR Opens** → Supabase GitHub integration detects PR
2. **Branch Created** → Database with schema + seed data
3. **PR Merged** → Branch database deleted

### Key Files

| File                        | Purpose               |
| --------------------------- | --------------------- |
| `supabase/config.toml`      | Project configuration |
| `supabase/migrations/*.sql` | Schema migrations     |
| `supabase/seed.sql`         | Preview seed data     |

### Storage Buckets

Buckets are NOT copied to preview branches. Add to `supabase/seed.sql`:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880,
        ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
```

### Validating Seed Data

```bash
export DATABASE_URL="postgresql://postgres:...@db.xxx.supabase.co:5432/postgres"
pnpm --filter @repo/scripts supabase:validate-seed
```

## Prisma vs Supabase Migrations

**Prisma** = Source of truth for development.
**Supabase** = Derived format for preview branches.

### Migration Workflow

1. Modify Prisma schema
2. `pnpm --filter @repo/database migrate`
3. Commit & create PR
4. CI auto-syncs Supabase format
5. Supabase preview branch applies migrations
6. PR merge → Prisma migration applies to production

### Sync Migrations Manually

```bash
./tooling/scripts/src/supabase/sync-prisma-to-supabase.sh --dry-run
./tooling/scripts/src/supabase/sync-prisma-to-supabase.sh
```

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

GitHub Actions automatically syncs env vars between Supabase and Vercel when PR opens.

### Sync Flow

1. Wait for Supabase branch and Vercel preview to be ready (parallel polling)
2. Sync: Vercel ← Supabase DB credentials (DATABASE_URL, DIRECT_URL)
3. Sync: Vercel ← Supabase API credentials (SUPABASE_URL, keys)

### Required GitHub Secrets

| Secret                  | Purpose                 |
| ----------------------- | ----------------------- |
| `SUPABASE_ACCESS_TOKEN` | Supabase Management API |
| `SUPABASE_PROJECT_REF`  | Project identifier      |
| `VERCEL_TOKEN`          | Vercel API              |
| `VERCEL_PROJECT`        | Vercel project ID       |
| `VERCEL_SCOPE`          | Vercel team ID          |

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

1. **Use Prisma for schema changes** - Never edit `supabase/migrations/` directly
2. **Keep Supabase in sync** - `supabase db pull` after production deploys
3. **Test seed data in PRs** - Run `supabase:validate-seed` against preview DB
4. **Wait for all CI checks** - `validate-prs`, Supabase, Vercel

## Troubleshooting

See [troubleshooting.md](troubleshooting.md) for:

- Migration check failures
- Preview environment issues
- Storage upload failures
- Seed validation failures
- E2E test blocking

## Related Skills

- **architecture**: API proxy implementation details and deployment infrastructure
- **prisma-migrate**: Database migration workflows and Prisma-to-Supabase sync
- **application-environments**: Environment overview and configuration
- **git-worktrees**: Worktree-based development and branch workflows
- **debugging**: Troubleshooting preview environment and deployment issues
- **github-cli**: GitHub operations and PR management
