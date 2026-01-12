---
name: database-migration
description: Use this skill for Prisma database migration workflows including validation, staging, review, and execution. This skill wraps the Prisma CLI and custom migration helpers.
allowed-tools:
  - Bash
  - Read
  - Edit
---

# Prisma Migration Skill

This skill provides comprehensive Prisma migration support with safety checks, advisory locking, and automated workflows.

## Prerequisites

- `DATABASE_URL` must be set in `apps/web/.env.local` (or `.env`)
- Prisma schema located at `packages/database/prisma/schema.prisma`
- Docker running (for shadow database in development)

### Local Database Setup

Local PostgreSQL runs on Homebrew installation:

| Setting  | Value                   |
| -------- | ----------------------- |
| Host     | localhost               |
| Port     | 5432                    |
| Database | local_softwaremultitool |
| User     | postgres                |
| Password | postgres                |

**Connection string for `.env.local`:**

```text
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/local_softwaremultitool"
```

**Create database (if needed):**

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d template1 -c "CREATE DATABASE local_softwaremultitool;"
```

## Core Command Patterns

All Prisma operations use pnpm workspace filtering:

```bash
# Helper scripts (validation and staging)
pnpm --filter @repo/scripts prisma:validate
pnpm --filter @repo/scripts prisma:stage --name <migration-name>

# Existing database commands
pnpm --filter @repo/database generate        # Generate Prisma client and Zod schemas
pnpm --filter @repo/database push            # Push schema changes (dev only, skips migrations)
pnpm --filter @repo/database migrate:execute # Execute staged migration
pnpm --filter @repo/database studio          # Open Prisma Studio GUI
```

## Migration Workflow (Step-by-Step)

### Step 1: Analyze Schema Changes

Before creating a migration, understand what changed:

```bash
# Review recent schema.prisma edits
code packages/database/prisma/schema.prisma
```

**Determine an appropriate migration name** by:

- Looking at existing migrations in `packages/database/prisma/migrations/`
- Following kebab-case naming: `add-feature`, `update-field`, `remove-table`
- Being descriptive but concise

Example migration names:

- `add-user-preferences`
- `add-organization-settings`
- `update-user-email-unique`
- `remove-deprecated-fields`

### Step 2: Validate Migration Environment

Run pre-flight validation checks:

```bash
pnpm --filter @repo/scripts prisma:validate
```

This validates:

- ✓ DATABASE_URL is configured
- ✓ Schema file exists and is readable
- ✓ Schema syntax is valid
- ✓ Shadow database support is available
- ✓ Schema changes are detected (drift check)

**DO NOT PROCEED if validation fails.** Fix errors before staging.

### Step 3: Stage the Migration

Create the migration with advisory lock wrapping:

```bash
pnpm --filter @repo/scripts prisma:stage --name <migration-name>
```

This script automates:

1. Runs `prisma format` on schema
2. Creates migration with `prisma migrate dev --create-only`
3. **Stops immediately if Prisma wants to reset the database** (indicates corruption)
4. Wraps migration SQL in PostgreSQL advisory lock transaction
5. Outputs migration file path for review

**CRITICAL SAFETY CHECK:** If you see output containing "reset", "drop", or warnings, the script will abort. This means the migration state is corrupted and must be resolved manually before continuing.

### Step 4: Review and Edit Migration File

#### MANDATORY MANUAL STEP - DO NOT SKIP

The migration file will be at:

```text
packages/database/prisma/migrations/<timestamp>_<name>/migration.sql
```

Open and review the migration:

```bash
code packages/database/prisma/migrations/<latest>/migration.sql
```

**Review for:**

- ✓ Advisory lock wrapping is present (BEGIN/END with pg_advisory_lock)
- ✓ SQL statements match your schema changes
- ✓ No unexpected DROP or destructive operations
- ⚠ Add data migration queries if needed (see examples below)

**Common data migration scenarios:**

1. **Adding non-nullable field with foreign key:**

   ```sql
   -- First, add the column as nullable
   ALTER TABLE "User" ADD COLUMN "organizationId" TEXT;

   -- Populate with default/placeholder values
   UPDATE "User" SET "organizationId" = '<default-org-id>' WHERE "organizationId" IS NULL;

   -- Then add the NOT NULL constraint
   ALTER TABLE "User" ALTER COLUMN "organizationId" SET NOT NULL;

   -- Finally add the foreign key
   ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey"
     FOREIGN KEY ("organizationId") REFERENCES "Organization"("id");
   ```

2. **Renaming a field (preserve data):**

   ```sql
   -- Prisma sees this as drop + create, but we want to preserve data
   ALTER TABLE "User" RENAME COLUMN "name" TO "fullName";
   ```

3. **Creating new schema:**

   ```sql
   -- Ensure schema exists before creating tables in it
   CREATE SCHEMA IF NOT EXISTS my_new_schema;
   ```

### Step 5: Execute the Migration

After reviewing and editing the migration file:

```bash
pnpm --filter @repo/database migrate:execute
```

This runs `prisma migrate dev` which:

- Applies the migration to your local database
- Updates the `_prisma_migrations` table
- Regenerates Prisma client and Zod schemas

**Watch for:**

- ✓ Migration applies successfully
- ✓ No errors in output
- ✓ Prisma client regenerates

### Step 6: Verify Migration Success

```bash
# Check migration history
pnpm --filter @repo/database studio

# Run tests to ensure nothing broke
pnpm test

# Check for any drift (should be none after successful migration)
pnpm --filter @repo/scripts prisma:validate
```

## Migration Naming Conventions

**Follow existing patterns** in `packages/database/prisma/migrations/`:

✅ Good names:

- `add-user-avatar-field`
- `create-notifications-table`
- `update-email-unique-constraint`
- `remove-deprecated-columns`
- `add-user-preferences`

❌ Bad names:

- `migration1` (not descriptive)
- `update` (too vague)
- `changes` (meaningless)
- `fix_stuff` (use kebab-case)

## Safety Rules (CRITICAL)

### 🛑 NEVER

1. Skip the validation step
2. Ignore database reset warnings
3. Skip manual migration review
4. Run migrations on production directly (use CI/CD)
5. Remove the advisory lock wrapping
6. Commit migrations without testing locally

### ✅ ALWAYS

1. Run validation before staging
2. Review the generated migration.sql
3. Add data migrations for non-nullable fields
4. Test migrations locally before committing
5. Keep advisory lock transaction wrapping
6. Follow existing naming conventions

## Debugging

### Database Drift Detected

If your database doesn't match your schema:

```bash
# Generate a diff script to see what's different
cd packages/database
dotenv -c -e ../../apps/web/.env -- \
  pnpm prisma migrate diff \
    --from-url "$DATABASE_URL" \
    --to-schema-datamodel prisma/schema.prisma \
    --script > drift.sql

# Review the drift
code drift.sql
```

### Migration State Corruption

If Prisma wants to reset your database during staging:

1. **DO NOT PROCEED** - the stage script will abort automatically
2. Check migration history: `packages/database/prisma/migrations/`
3. Manually resolve conflicts in your local database
4. Consider using `prisma migrate resolve` if needed
5. Consult Prisma docs: https://www.prisma.io/docs/concepts/components/prisma-migrate/mental-model

### Shadow Database Issues

If shadow database creation fails:

```bash
# Ensure DATABASE_URL is PostgreSQL
echo $DATABASE_URL

# Verify Docker is running (shadow DB needs it)
docker ps
```

## New Schema Creation

When adding a new PostgreSQL schema:

1. **Create schema in ALL databases first** (local, shadow, staging, production):

   ```sql
   CREATE SCHEMA IF NOT EXISTS my_new_schema;
   ```

2. Add tables to schema in `schema.prisma`:

   ```prisma
   model MyModel {
     @@schema("my_new_schema")
   }
   ```

3. Run migration workflow as normal

## Advanced Operations

### Pull Changes from Database

Sometimes it helps to make changes directly in the database and pull them into Prisma:

```bash
cd packages/database
dotenv -c -e ../../apps/web/.env -- pnpm prisma db pull
```

**Note:** This may create formatting-only changes. Remove those before committing.

### Baseline a New Database

For setting up a fresh database with existing schema:

```bash
cd packages/database
pnpm dotenv -s -c -e .env -- \
  prisma migrate diff \
    --from-empty \
    --to-schema-datamodel prisma/schema.prisma \
    --script > prisma/migrations/0_init/migration.sql

dotenv -c -e .env -- pnpm prisma migrate resolve --applied 0_init
```

## Integration with Development Workflow

When working on features that require database changes:

1. Update `packages/database/prisma/schema.prisma`
2. Run full migration workflow (validate → stage → review → execute)
3. Update any affected queries in `packages/database/prisma/queries/`
4. Regenerate types: `pnpm --filter @repo/database generate`
5. Run tests: `pnpm test`
6. Commit schema + migration + code changes together

## pg-boss Schema Management

This project uses pg-boss for background job processing. The pg-boss schema is managed through Prisma migrations using raw SQL.

### Why Raw SQL for pg-boss?

pg-boss uses PostgreSQL features that Prisma cannot model:

- **Partitioned tables**: `pgboss.job` uses LIST partitioning by queue name
- **Custom enums**: `pgboss.job_state` with specific values
- **Stored functions**: `create_queue()` and `delete_queue()` for dynamic partitions
- **Schema versioning**: `pgboss.version` table for compatibility checks

### pg-boss Schema Version Pinning

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

### Creating pg-boss Migrations (Workflow)

**🛑 NEVER reset the local database**. Database resets are an anti-pattern that hide configuration issues.

The correct workflow for creating pg-boss migrations:

#### Step 1: Temporarily Create Tables

Use the init script to create pg-boss tables in your local database:

```bash
cd packages/database
pnpm pgboss:init
```

This runs pg-boss with `migrate: true` (default) to create all required schema objects.

#### Step 2: Introspect the Schema

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

#### Step 3: Remove the Tables

**Important**: Remove the tables that pg-boss created so Prisma can apply the migration cleanly:

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d local_softwaremultitool -c "DROP SCHEMA pgboss CASCADE;"
```

#### Step 4: Create the Migration File

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

#### Step 5: Apply and Verify

```bash
# Apply the migration
pnpm --filter @repo/database migrate:execute

# Verify pg-boss can start
pnpm --filter @repo/database pgboss:verify
```

### pg-boss Configuration in Application Code

After migration, pg-boss should be configured to NOT manage its own schema:

```typescript
const boss = new PgBoss({
  connectionString: process.env.DATABASE_URL,
  migrate: false,      // Don't let pg-boss manage schema
  noSupervisor: true,  // Optional: disable maintenance workers in certain contexts
});
```

### Upgrading pg-boss

When upgrading the pg-boss package:

1. **Check schema version requirements** in pg-boss release notes
2. **Create a new migration** if schema changes are needed
3. **Update the version record** in pgboss.version table
4. **Run verification** to ensure startup works

```bash
# Example: Check if pg-boss starts correctly after upgrade
pnpm --filter @repo/database pgboss:verify
```

### pg-boss Integration Tests

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

### Helper Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| pgboss:init | `pnpm --filter @repo/database pgboss:init` | Create pg-boss tables (for introspection) |
| pgboss:verify | `pnpm --filter @repo/database pgboss:verify` | Verify pg-boss works with Prisma-managed schema |
| db:pull | `pnpm --filter @repo/database db:pull` | Pull schema from database into Prisma |

### Troubleshooting pg-boss Migrations

**Problem: "Database version X does not match expected Y"**

The pg-boss package expects a different schema version than what's in the database.

Solution:
1. Check pg-boss package version: `pnpm --filter @repo/database list pg-boss`
2. Check database version: `SELECT version FROM pgboss.version`
3. Create a migration to update the version if needed

**Problem: "relation pgboss.job does not exist"**

The pg-boss schema migration hasn't been applied.

Solution:
1. Run `pnpm --filter @repo/database migrate:execute`
2. Verify migration is in `_prisma_migrations` table

**Problem: pg-boss creates duplicate tables on startup**

The application is configured with `migrate: true` (default).

Solution: Always set `migrate: false` in application code when using Prisma-managed schema.

## When to Use This Skill

Invoke this skill when:

- User mentions "migration", "prisma migrate", or "database schema"
- User wants to modify `schema.prisma`
- User needs to create/stage/execute a migration
- User encounters migration errors or drift
- User asks about database changes
- User needs to work with pg-boss schema or background jobs
