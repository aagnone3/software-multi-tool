# Prisma Migration Debugging & Advanced Operations

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

