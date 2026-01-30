# CI/CD Troubleshooting

Common issues and solutions for CI/CD, preview environments, and database branching.

## Migration Check Failures on PRs

### Prisma Migration Conflict

```bash
git fetch origin main
git rebase origin/main
pnpm --filter @repo/database migrate
```

### Schema Drift Between Prisma and Supabase

```bash
SUPABASE_ACCESS_TOKEN="..." supabase db pull
git add supabase/migrations/
git commit -m "chore: sync supabase migrations"
```

### Missing Seed Data

```bash
psql $DATABASE_URL -f supabase/seed.sql
```

## Preview Environment Issues

### Vercel Preview Not Connecting to Database

1. Verify Supabase integration enabled in Vercel project settings
2. Check GitHub check shows Supabase branch created
3. Ensure `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` populated

### Supabase Branch Database Not Created

1. Verify GitHub integration authorized
2. Check Supabase project settings → Integrations
3. Look for errors in GitHub check details

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
3. Verify DATABASE_URL points to correct Supabase branch
4. See **api-proxy** skill for detailed debugging

## Storage Issues

### Storage Uploads Fail in Preview

**Root cause**: Supabase Storage buckets NOT copied to preview branches.

**Solution**: Add bucket to `supabase/seed.sql`:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('your-bucket', 'your-bucket', true, 5242880, ARRAY['image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;
```

**For existing preview branches**:

```sql
-- Run via Supabase Dashboard SQL Editor
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
```

## Seed Validation Failures

### Database Not Seeded

```bash
psql $DATABASE_URL -f supabase/seed.sql
```

### Wrong Database URL

```bash
echo $DATABASE_URL  # Should point to branch database, not production
```

### Seed File Syntax Error

```bash
supabase start
supabase db reset  # Applies migrations + seed
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
# Use local PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/local_softwaremultitool"

# Or use Supabase local
supabase start
# Use DATABASE_URL from supabase status output
```
