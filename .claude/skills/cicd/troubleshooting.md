# CI/CD Troubleshooting

Common issues and solutions for CI/CD, preview environments, and database branching.

## Migration Check Failures on PRs

### Prisma Migration Conflict

```bash
git fetch origin main
git rebase origin/main
pnpm --filter @repo/database migrate
```

### Missing Seed Data

```bash
psql $DATABASE_URL -f packages/database/seed.sql
```

## Preview Environment Issues

### Vercel Preview Not Connecting to Database

1. Verify database integration enabled in Vercel project settings
2. Ensure `DATABASE_URL` and `DATABASE_URL_UNPOOLED` populated

### Preview Env Vars Not Taking Effect

Vercel bakes env vars at build time. Changes need redeploy:

```bash
git commit --allow-empty -m "chore: trigger redeploy" && git push
```

Check if env var is branch-specific:

```bash
vercel env ls preview | grep <VAR_NAME>
```

### Session Authentication Not Working in Preview

1. Check browser DevTools Network - requests should go to `/api/proxy/*`
2. Verify `NEXT_PUBLIC_VERCEL_ENV` is `preview` in Vercel
3. Verify DATABASE_URL points to correct database
4. See **api-proxy** skill for detailed debugging

## Storage Issues

### Storage Uploads Fail in Preview

**Root cause**: Storage buckets are managed by S3 configuration, not the database.

**Solution**: Verify S3/storage environment variables are set correctly in the preview environment. See the `storage` skill for provider configuration details.

## Seed Validation Failures

### Database Not Seeded

```bash
psql $DATABASE_URL -f packages/database/seed.sql
```

### Wrong Database URL

```bash
echo $DATABASE_URL  # Should point to branch database, not production
```

### Seed File Syntax Error

```bash
pnpm db:reset  # Resets database, applies migrations + seed
```

## E2E Tests Blocked by Vercel Login

**Cause**: Vercel Deployment Protection blocking unauthenticated requests.

**Solution**:

1. Get bypass secret: Vercel → Project Settings → Deployment Protection → Protection Bypass
2. Pass to test:

```bash
VERCEL_AUTOMATION_BYPASS_SECRET=prj_xxx \
BASE_URL=https://your-preview.vercel.app \
pnpm --filter web exec playwright test --config=tests/playwright.external.config.ts
```

1. For CI, add `VERCEL_AUTOMATION_BYPASS_SECRET` to GitHub Actions secrets

## Local Development Database

```bash
# Start local PostgreSQL via Docker Compose
pnpm db:start

# Connection string
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```
