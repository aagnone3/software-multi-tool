# Prisma Migration Examples

This document provides complete, real-world examples of common migration scenarios.

## Example 1: Adding a New Optional Field

### Example 1 - Scenario

Adding an optional `avatarUrl` field to the User table.

### Example 1 - Schema Change

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatarUrl String?  // New field
  createdAt DateTime @default(now())
}
```

### Example 1 - Workflow

```bash
# Step 1: Validate
pnpm --filter @repo/scripts prisma:validate

# Step 2: Stage migration
pnpm --filter @repo/scripts prisma:stage --name add-user-avatar-url

# Step 3: Review migration file
# File: packages/database/prisma/migrations/<timestamp>_add-user-avatar-url/migration.sql
```

Expected migration content:

```sql
-- Acquire an advisory lock in a transaction
BEGIN;
SELECT pg_advisory_lock(1234567890::bigint);

-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;

-- Release the advisory lock and commit the transaction
SELECT pg_advisory_unlock(1234567890::bigint);
COMMIT;
```

**No manual edits needed** - optional fields are safe.

```bash
# Step 4: Execute migration
pnpm --filter @repo/database migrate:execute

# Step 5: Verify
pnpm test
```

---

## Example 2: Adding a Required Field with Default Value

### Example 2 - Scenario

Adding a required `role` field with a default value to existing users.

### Example 2 - Schema Change

```prisma
enum UserRole {
  USER
  ADMIN
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      UserRole @default(USER)  // New required field with default
  createdAt DateTime @default(now())
}
```

### Example 2 - Workflow

```bash
# Step 1: Validate
pnpm --filter @repo/scripts prisma:validate

# Step 2: Stage migration
pnpm --filter @repo/scripts prisma:stage --name add-user-role
```

Generated migration (with advisory lock):

```sql
-- Acquire an advisory lock in a transaction
BEGIN;
SELECT pg_advisory_lock(9876543210::bigint);

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

-- Release the advisory lock and commit the transaction
SELECT pg_advisory_unlock(9876543210::bigint);
COMMIT;
```

**No manual edits needed** - Prisma handles the default value.

```bash
# Step 3: Execute migration
pnpm --filter @repo/database migrate:execute
```

---

## Example 3: Adding Required Foreign Key (Complex Data Migration)

### Example 3 - Scenario

Every user must belong to an organization. Adding `organizationId` as a required foreign key.

### Example 3 - Schema Change

```prisma
model Organization {
  id        String   @id @default(cuid())
  name      String
  users     User[]
  createdAt DateTime @default(now())
}

model User {
  id             String       @id @default(cuid())
  email          String       @unique
  organizationId String       // New required FK
  organization   Organization @relation(fields: [organizationId], references: [id])
  createdAt      DateTime     @default(now())
}
```

### Example 3 - Workflow

```bash
# Step 1: Validate
pnpm --filter @repo/scripts prisma:validate

# Step 2: Stage migration
pnpm --filter @repo/scripts prisma:stage --name add-user-organization
```

Generated migration (before manual edits):

```sql
-- Acquire an advisory lock in a transaction
BEGIN;
SELECT pg_advisory_lock(1122334455::bigint);

-- CreateTable
CREATE TABLE "Organization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "User" ADD COLUMN "organizationId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Release the advisory lock and commit the transaction
SELECT pg_advisory_unlock(1122334455::bigint);
COMMIT;
```

### Example 3 - Step 3: Manual Edit Required

**Problem:** You can't add a NOT NULL foreign key to a table with existing rows.

**Solution:** Edit the migration to add the field in stages:

```sql
-- Acquire an advisory lock in a transaction
BEGIN;
SELECT pg_advisory_lock(1122334455::bigint);

-- CreateTable
CREATE TABLE "Organization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- Create a default organization for existing users
INSERT INTO "Organization" ("id", "name") VALUES ('default-org-id', 'Default Organization');

-- AlterTable - Add column as NULLABLE first
ALTER TABLE "User" ADD COLUMN "organizationId" TEXT;

-- Data migration - Assign all existing users to default organization
UPDATE "User" SET "organizationId" = 'default-org-id' WHERE "organizationId" IS NULL;

-- Now make the column required
ALTER TABLE "User" ALTER COLUMN "organizationId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Release the advisory lock and commit the transaction
SELECT pg_advisory_unlock(1122334455::bigint);
COMMIT;
```

```bash
# Step 4: Execute migration
pnpm --filter @repo/database migrate:execute

# Step 5: Verify
pnpm test
```

---

## Example 4: Renaming a Column (Preserve Data)

### Example 4 - Scenario

Renaming `name` to `fullName` without losing data.

### Example 4 - Schema Change

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  fullName  String?  // Renamed from 'name'
  createdAt DateTime @default(now())
}
```

### Example 4 - Workflow

```bash
# Step 1: Validate
pnpm --filter @repo/scripts prisma:validate

# Step 2: Stage migration
pnpm --filter @repo/scripts prisma:stage --name rename-user-name-to-fullname
```

**Problem:** Prisma sees this as DROP + CREATE, which loses data!

Generated migration (WRONG):

```sql
-- Acquire an advisory lock in a transaction
BEGIN;
SELECT pg_advisory_lock(5544332211::bigint);

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN "fullName" TEXT;

-- Release the advisory lock and commit the transaction
SELECT pg_advisory_unlock(5544332211::bigint);
COMMIT;
```

### Example 4 - Step 3: Manual Edit Required

Replace DROP+ADD with RENAME:

```sql
-- Acquire an advisory lock in a transaction
BEGIN;
SELECT pg_advisory_lock(5544332211::bigint);

-- RenameColumn (preserves data)
ALTER TABLE "User" RENAME COLUMN "name" TO "fullName";

-- Release the advisory lock and commit the transaction
SELECT pg_advisory_unlock(5544332211::bigint);
COMMIT;
```

```bash
# Step 4: Execute migration
pnpm --filter @repo/database migrate:execute
```

---

## Example 5: Creating a New Schema

### Example 5 - Scenario

Adding tables in a new PostgreSQL schema for multi-tenancy.

### Example 5 - Schema Change

```prisma
model TenantUser {
  id        String   @id @default(cuid())
  email     String
  tenantId  String
  createdAt DateTime @default(now())

  @@schema("tenant")
  @@unique([email, tenantId])
}
```

### Example 5 - Workflow

**IMPORTANT:** Create the schema in your database FIRST:

```bash
# Connect to your database and run:
# psql $DATABASE_URL -c "CREATE SCHEMA IF NOT EXISTS tenant;"

# Or via Prisma Studio SQL:
pnpm --filter @repo/database studio
# Execute: CREATE SCHEMA IF NOT EXISTS tenant;
```

Then proceed with migration:

```bash
# Step 1: Validate
pnpm --filter @repo/scripts prisma:validate

# Step 2: Stage migration
pnpm --filter @repo/scripts prisma:stage --name create-tenant-schema-tables
```

Generated migration:

```sql
-- Acquire an advisory lock in a transaction
BEGIN;
SELECT pg_advisory_lock(9988776655::bigint);

-- CreateTable
CREATE TABLE "tenant"."TenantUser" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TenantUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantUser_email_tenantId_key" ON "tenant"."TenantUser"("email", "tenantId");

-- Release the advisory lock and commit the transaction
SELECT pg_advisory_unlock(9988776655::bigint);
COMMIT;
```

### Step 3: Optional Manual Edit

Add explicit schema creation for safety:

```sql
-- Acquire an advisory lock in a transaction
BEGIN;
SELECT pg_advisory_lock(9988776655::bigint);

-- Ensure schema exists
CREATE SCHEMA IF NOT EXISTS tenant;

-- CreateTable
CREATE TABLE "tenant"."TenantUser" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TenantUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantUser_email_tenantId_key" ON "tenant"."TenantUser"("email", "tenantId");

-- Release the advisory lock and commit the transaction
SELECT pg_advisory_unlock(9988776655::bigint);
COMMIT;
```

```bash
# Step 4: Execute migration
pnpm --filter @repo/database migrate:execute
```

---

## Example 6: Handling Migration Errors

### Example 6 - Scenario

Migration fails during execution with a constraint violation.

### Example 6 - Error Output

```text
Error: P2010: Raw query failed. Code: `23505`. Message: `db error: ERROR: duplicate key value violates unique constraint "User_email_key"`
```

### Recovery Steps

1. **DO NOT PANIC** - the advisory lock prevented partial migration

2. **Check migration state:**

   ```bash
   pnpm --filter @repo/database studio
   # Check the _prisma_migrations table
   ```

3. **Fix the underlying issue:**

   ```sql
   -- Find duplicate emails
   SELECT email, COUNT(*) FROM "User" GROUP BY email HAVING COUNT(*) > 1;

   -- Clean up duplicates manually
   DELETE FROM "User" WHERE id IN (
     SELECT id FROM "User" WHERE email = 'duplicate@example.com' LIMIT 1
   );
   ```

4. **Retry the migration:**

   ```bash
   pnpm --filter @repo/database migrate:execute
   ```

5. **Mark migration as applied if needed:**

   ```bash
   cd packages/database
   dotenv -c -e ../../apps/web/.env -- \
     pnpm prisma migrate resolve --applied <migration-name>
   ```

---

## Common Patterns Summary

### Safe Migrations (No Manual Edit Needed)

- ✅ Adding optional fields
- ✅ Adding required fields with defaults
- ✅ Creating new tables
- ✅ Adding indexes
- ✅ Creating enums

### Requires Manual Edit

- ⚠️ Adding required foreign keys to tables with data
- ⚠️ Renaming columns (Prisma sees as drop+create)
- ⚠️ Changing data types with transformations
- ⚠️ Adding NOT NULL to existing nullable columns with data
- ⚠️ Creating new schemas (ensure schema exists first)

### High-Risk Operations

- 🛑 Dropping columns with data
- 🛑 Changing primary keys
- 🛑 Removing foreign key constraints
- 🛑 Changing column types incompatibly (e.g., TEXT to INT)

**Always review and test migrations locally before committing!**
