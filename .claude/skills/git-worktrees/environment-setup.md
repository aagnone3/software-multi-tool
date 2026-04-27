# Worktree Environment Setup

Detailed environment configuration for git worktrees.

> **🚨 CRITICAL: Only use Docker Compose PostgreSQL 🚨**
>
> Worktrees must use **Docker Compose PostgreSQL** (port 54322).
>
> **NEVER use Homebrew PostgreSQL** (port 5432). It lacks proper seeding and will cause auth failures.
>
> The `worktree-setup.sh` script automatically enforces Docker Compose PostgreSQL.

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

### Local Development (Docker Compose PostgreSQL)

**All worktrees share Docker Compose PostgreSQL** for development consistency.

**Connection string**:

```text
postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

**Start database** (from any worktree):

```bash
pnpm db:start     # Start PostgreSQL via Docker Compose
pnpm db:reset     # Reset database, apply migrations + seed
```

**Why Docker Compose PostgreSQL?**

- Same seed.sql runs automatically (`packages/database/seed.sql`)
- Test user works immediately (`test@preview.local` / `TestPassword123`)

### Storage Configuration

Storage is handled by S3-compatible providers. See the `storage` skill for provider configuration details.

**If storage features fail with "Storage is not configured"**:

Verify S3 environment variables are set in `apps/web/.env.local`. See `apps/web/.env.local.example` for required variables.

## Git Configuration

Per-worktree `.env.local` files are git-ignored by default. This prevents accidentally committing worktree-specific configuration.
