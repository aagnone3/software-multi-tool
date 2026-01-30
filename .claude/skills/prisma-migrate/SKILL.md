---
name: prisma-migrate
description: Provides Prisma database migration workflows with safety checks and advisory locking. Use when creating migrations, validating schema changes, or debugging drift. Covers validation scripts, staging helpers, and migration review workflows.
allowed-tools:
  - Bash
  - Read
  - Edit
---

# Prisma Migration Skill

This skill provides comprehensive Prisma migration support with safety checks, advisory locking, and automated workflows.

## ⚠️ CRITICAL: Migration Commands - Know the Difference

> **🚨 NEVER use `prisma db push` for schema changes 🚨**
>
> Using `push` causes **schema drift** that breaks integration tests and can corrupt production deployments.

| Command | Purpose | Creates Migration? | Use When |
| ------- | ------- | ------------------ | -------- |
| `pnpm --filter @repo/database migrate` | Create and apply migrations | ✅ Yes | **ALWAYS** for schema changes |
| `pnpm --filter @repo/database push` | ❌ **BLOCKED** | ❌ No | Never use for schema changes |
| `pnpm --filter @repo/database generate` | Regenerate Prisma client types | ❌ No | After pulling changes, or types are stale |

### Why `push` Is Blocked

When developers use `push` during local development:

1. **Integration tests fail** - Testcontainers applies migrations from scratch, missing pushed-only changes
2. **Production deployments fail** - CI/CD runs migrations, not push
3. **Schema confusion** - The database differs from migration history

### The Correct Workflow

```bash
# 1. Edit schema.prisma
# 2. Create migration (NEVER use push!)
pnpm --filter @repo/database migrate dev --name add-user-preferences

# 3. Review the generated migration file
# 4. Run tests to verify
pnpm test
```

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

# Standard database commands
pnpm --filter @repo/database generate        # Generate Prisma client and Zod schemas
pnpm --filter @repo/database migrate:execute # Execute staged migration
pnpm --filter @repo/database studio          # Open Prisma Studio GUI

# ❌ BLOCKED - DO NOT USE
# pnpm --filter @repo/database push          # Causes schema drift - use migrate instead!
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

- ✓ Advisory lock is present (`SELECT pg_advisory_xact_lock(...)`)
- ✓ **NO explicit BEGIN/COMMIT statements** (Prisma handles transactions)
- ✓ SQL statements match your schema changes
- ✓ No unexpected DROP or destructive operations
- ⚠ Add data migration queries if needed (see examples below)

**CRITICAL**: Never add `BEGIN`/`COMMIT` statements to migrations. Prisma Migrate automatically wraps each migration in a transaction. Adding explicit transaction control creates nested transactions which fail with: `"current transaction is aborted, commands ignored until end of transaction block"`

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
5. Remove the advisory lock (`pg_advisory_xact_lock`)
6. Add explicit `BEGIN`/`COMMIT` statements (Prisma handles transactions)
7. Commit migrations without testing locally

### ✅ ALWAYS

1. Run validation before staging
2. Review the generated migration.sql
3. Add data migrations for non-nullable fields
4. Test migrations locally before committing
5. Keep the `pg_advisory_xact_lock` call (but NOT explicit transactions)
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

## When to Use This Skill

Invoke this skill when:

- User mentions "migration", "prisma migrate", or "database schema"
- User wants to modify `schema.prisma`
- User needs to create/stage/execute a migration
- User encounters migration errors or drift
- User asks about database changes

**Note**: Background jobs are now handled by **Inngest** (not pg-boss). See the architecture skill for Inngest documentation.

## Related Skills

- **architecture**: Overall database and backend architecture
- **git-worktrees**: Database configuration in isolated worktree environments
- **sub-app**: Creating database models for new tools
- **dev:migrate-database**: Skill for executing migrations in workflow context
