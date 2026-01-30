# Worktree Environment Setup

Detailed environment configuration for git worktrees.

> **🚨 CRITICAL: Only use Supabase databases 🚨**
>
> Worktrees must use **Supabase Local** (port 54322) or **Supabase Preview**.
>
> **NEVER use Homebrew PostgreSQL** (port 5432). It lacks storage, proper seeding, and will cause auth failures.
>
> The `worktree-setup.sh` script automatically enforces Supabase Local.

## Environment Variable Isolation

### Shared Variables (Default)

By default, worktrees share the parent `apps/web/.env.local`. This is fine for:

- API keys (PostHog, Stripe, etc.)
- Database credentials (not used by Testcontainers)
- Feature flags

### Per-Worktree Variables (Required for Parallel Development)

Create worktree-specific `.env.local` files for:

1. **PORT**: Dev server port (automatically allocated)
2. Any variables causing conflicts when running parallel servers

**Setup with automatic port allocation**:

```bash
cd .worktrees/feat-pra-35-auth

# Copy parent template
cp ../../apps/web/.env.local apps/web/.env.local

# Auto-allocate port
WORKTREE_PORT=$(../../tooling/scripts/src/worktree-port.sh .)
echo "" >> apps/web/.env.local
echo "# Auto-allocated port for this worktree" >> apps/web/.env.local
echo "PORT=$WORKTREE_PORT" >> apps/web/.env.local

# Update NEXT_PUBLIC_SITE_URL to match
sed -i.bak "s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=\"http://localhost:$WORKTREE_PORT\"|" apps/web/.env.local
rm -f apps/web/.env.local.bak
```

## Port Allocation Strategy

| App        | Port Range | Calculation                          |
|------------|------------|--------------------------------------|
| Web        | 3501-3999  | `hash(worktree_path) % 499 + 3501`   |

**Port allocator features**:

- **Deterministic**: Same worktree → same port (based on path hash)
- **Collision-safe**: Checks actual port usage with `lsof`
- **Auto-recovery**: Finds next available port if conflict

```bash
# Allocate port
WORKTREE_PORT=$(../../tooling/scripts/src/worktree-port.sh .)

# Check if specific port is free
tooling/scripts/src/worktree-port.sh .worktrees/feat-pra-35-auth --check-only

# List all ports in use
lsof -i :3500-3999 | grep LISTEN
```

## Integration Test Credentials

**All integration tests require API credentials** in `apps/web/.env.local`.

Tests **FAIL** (not skip) when credentials are missing. Required:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Affected tests**:

- `packages/agent-sdk/integration.test.ts`
- `packages/api/modules/news-analyzer/lib/processor.integration.test.ts`

**If tests fail with "ANTHROPIC_API_KEY required"**:

```bash
# Copy from parent (includes credentials)
cp ../../apps/web/.env.local apps/web/.env.local

# Preserve worktree PORT
WORKTREE_PORT=$(grep "^PORT=" apps/web/.env.local | cut -d'=' -f2)
if [ -n "$WORKTREE_PORT" ]; then
  echo "PORT=$WORKTREE_PORT" >> apps/web/.env.local
fi
```

## Database Configuration

### Integration Tests (Testcontainers)

**No manual configuration needed!** Testcontainers automatically:

- Allocates random ports for PostgreSQL containers
- Configures `DATABASE_URL` in test environment
- Cleans up after tests

### Local Development (Supabase Local)

**All worktrees share Supabase local** for development consistency.

**Connection string**:

```text
postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

**Start Supabase** (from any worktree):

```bash
supabase start
supabase db reset  # Apply migrations + seed
```

**Why Supabase local?**

- Same seed.sql runs automatically
- Storage buckets created
- Test user works immediately (`test@preview.local` / `TestPassword123`)

### Supabase Storage Configuration

The worktree setup script automatically configures Supabase local storage by adding these environment variables:

```bash
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

These are **required** for features that use Supabase storage (file uploads, speaker separation audio files, etc.). The `SUPABASE_SERVICE_ROLE_KEY` is the standard local development key used by Supabase CLI.

**If storage features fail with "Storage is not configured"**:

```bash
# Add to apps/web/.env.local
echo 'SUPABASE_URL=http://127.0.0.1:54321' >> apps/web/.env.local
echo 'SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU' >> apps/web/.env.local

# Then restart dev servers
```

## Git Configuration

Per-worktree `.env.local` files are git-ignored by default. This prevents accidentally committing worktree-specific configuration.
