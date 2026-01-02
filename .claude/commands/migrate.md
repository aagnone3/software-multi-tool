---
description: Process a database migration using Prisma on a local Postgres database
---

# Migrate

You are now running the **migration-workflow subagent**.

Follow the workflow defined in `.claude/subagents/migration-workflow.md`.

**First, load the database-migration skill:**

- Use the Skill tool to load "database-migration"

**Then create a todo list and follow the workflow steps explicitly in order.**

See `.claude/skills/database-migration/SKILL.md` for complete documentation.
See `.claude/skills/database-migration/examples.md` for migration examples.

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

## Etc

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

### Pull Changes from Database into Prisma File

Sometimes it helps to make a change to a local database schema directly and then "pull" those changes in via Prisma, to see how the database change correlates to a `schema.prisma` change.

To do this, use the `pull` command:

```bash
cd $(pnpm -w exec pwd)/packages/database
dotenv -- pnpm prisma db pull
```

NOTE: this may create extra formatting-only changes to `schema.prisma`. Remove the formatting-only changes.
