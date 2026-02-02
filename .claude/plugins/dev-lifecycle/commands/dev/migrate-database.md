---
description: Process a database migration using Prisma on a local Postgres database
---

# Migrate Database

Run the migration workflow using Prisma.

**First, load the database-migration skill:**

```text
Use Skill tool with skill: "database-migration"
```

**Then follow the workflow steps in the skill.**

See `.claude/skills/database-migration/SKILL.md` for complete documentation.
See `.claude/skills/database-migration/examples.md` for migration examples.

## Quick Reference

### Create a Migration

```bash
cd packages/database
dotenv -- pnpm prisma migrate dev --name <migration_name>
```

### Generate Prisma Client

```bash
pnpm --filter @repo/database generate
```

### Check Migration Status

```bash
dotenv -- pnpm prisma migrate status
```

## Debugging

### Debugging Database Drift

```bash
dotenv -- \
bash -c '
pnpm -s prisma migrate diff \
  --to-schema-datamodel packages/database/prisma/schema.prisma \
  --from-url $DATABASE_URL \
  --script \
  > diff.sql
' \
&& code diff.sql
```

### Baseline a New Database

```bash
cd $(pnpm -w exec pwd)
pnpm dotenv -s -c -e ../../packages/database/.env -- \
prisma migrate diff \
    --from-empty \
    --to-schema-datamodel packages/database/prisma/schema.prisma \
    --script > packages/database/prisma/migrations/0_init/migration.sql

dotenv -- pnpm -s prisma migrate resolve --applied 0_init
```

### Pull Changes from Database

```bash
cd $(pnpm -w exec pwd)/packages/database
dotenv -- pnpm prisma db pull
```

NOTE: This may create formatting-only changes to `schema.prisma`. Remove them.

## Migration Safety

Before running migrations, consider using the migration review agent:

```text
Use Task tool with subagent_type: "dev-lifecycle:review:migration"
Prompt: "Review this migration for safety: [migration file path]"
```

The agent checks:

- Reversibility
- Data preservation
- Downtime risk
- Index strategy

---
Context: $ARGUMENTS
