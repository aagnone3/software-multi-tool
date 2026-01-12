# pg-boss Schema Reference

This document contains detailed pg-boss migration workflows, version pinning, and troubleshooting guidance.

## Why Raw SQL for pg-boss?

pg-boss uses PostgreSQL features that Prisma cannot model:

- **Partitioned tables**: `pgboss.job` uses LIST partitioning by queue name
- **Custom enums**: `pgboss.job_state` with specific values
- **Stored functions**: `create_queue()` and `delete_queue()` for dynamic partitions
- **Schema versioning**: `pgboss.version` table for compatibility checks

## Schema Version Pinning

**CRITICAL**: pg-boss checks schema version on startup. The migration must match the pg-boss npm package version.

| pg-boss Package | Schema Version | Notes |
|-----------------|----------------|-------|
| 10.4.x          | 24             | Current version in this project |
| 10.0.x - 10.3.x | 23             | Do not use - version mismatch will cause startup failure |

**Always verify** the expected schema version when upgrading pg-boss:

```bash
# Check current pg-boss version
pnpm --filter @repo/database list pg-boss

# pg-boss exposes version check in startup logs
# Schema version mismatch will throw an error like:
# "Database version 23 does not match expected 24"
```

## Creating pg-boss Migrations (Workflow)

**NEVER reset the local database**. Database resets are an anti-pattern that hide configuration issues.

### Step 1: Temporarily Create Tables

Use the init script to create pg-boss tables in your local database:

```bash
cd packages/database
pnpm pgboss:init
```

This runs pg-boss with `migrate: true` (default) to create all required schema objects.

### Step 2: Introspect the Schema

Export the pg-boss schema for reference:

```bash
PGPASSWORD=postgres pg_dump -h localhost -U postgres -d local_softwaremultitool \
  --schema=pgboss --schema-only --no-owner --no-privileges \
  > /tmp/pgboss-schema-reference.sql
```

Or pull directly into Prisma (for syntax reference only):

```bash
pnpm --filter @repo/database db:pull
```

### Step 3: Remove the Tables

**Important**: Remove the tables that pg-boss created so Prisma can apply the migration cleanly:

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d local_softwaremultitool -c "DROP SCHEMA pgboss CASCADE;"
```

### Step 4: Create the Migration File

Create a new migration directory with raw SQL:

```bash
mkdir -p packages/database/prisma/migrations/<timestamp>_add_pgboss_schema
```

The migration must include:

1. **Advisory lock** for safe concurrent migrations
2. **Schema creation**: `CREATE SCHEMA IF NOT EXISTS pgboss`
3. **Enum types**: `pgboss.job_state`
4. **Tables**: version, queue, schedule, subscription, job (partitioned), archive
5. **Functions**: create_queue, delete_queue
6. **Version record**: INSERT into pgboss.version with correct version number

See `packages/database/prisma/migrations/20260112205243_add_pgboss_schema/migration.sql` for a complete example.

### Step 5: Apply and Verify

```bash
# Apply the migration
pnpm --filter @repo/database migrate:execute

# Verify pg-boss can start
pnpm --filter @repo/database pgboss:verify
```

## Application Configuration

After migration, pg-boss should be configured to NOT manage its own schema:

```typescript
const boss = new PgBoss({
  connectionString: process.env.DATABASE_URL,
  migrate: false,      // Don't let pg-boss manage schema
  noSupervisor: true,  // Optional: disable maintenance workers in certain contexts
});
```

## Upgrading pg-boss

When upgrading the pg-boss package:

1. **Check schema version requirements** in pg-boss release notes
2. **Create a new migration** if schema changes are needed
3. **Update the version record** in pgboss.version table
4. **Run verification** to ensure startup works

```bash
# Example: Check if pg-boss starts correctly after upgrade
pnpm --filter @repo/database pgboss:verify
```

## Integration Tests

The database package includes integration tests for pg-boss schema:

```bash
# Run pg-boss integration tests (requires Docker)
pnpm --filter @repo/database run test:integration
```

Tests verify:

- pg-boss starts with `migrate: false`
- Queue creation and job sending work
- Schema version is correct
- All required tables exist
- Required functions exist

## Helper Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| pgboss:init | `pnpm --filter @repo/database pgboss:init` | Create pg-boss tables (for introspection) |
| pgboss:verify | `pnpm --filter @repo/database pgboss:verify` | Verify pg-boss works with Prisma-managed schema |
| db:pull | `pnpm --filter @repo/database db:pull` | Pull schema from database into Prisma |

## Troubleshooting

### "Database version X does not match expected Y"

The pg-boss package expects a different schema version than what's in the database.

**Solution:**
1. Check pg-boss package version: `pnpm --filter @repo/database list pg-boss`
2. Check database version: `SELECT version FROM pgboss.version`
3. Create a migration to update the version if needed

### "relation pgboss.job does not exist"

The pg-boss schema migration hasn't been applied.

**Solution:**
1. Run `pnpm --filter @repo/database migrate:execute`
2. Verify migration is in `_prisma_migrations` table

### pg-boss creates duplicate tables on startup

The application is configured with `migrate: true` (default).

**Solution:** Always set `migrate: false` in application code when using Prisma-managed schema.
