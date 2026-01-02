# Database Migration Deployments

This repository promotes database schema changes with Prisma migrations. The deploy workflow is kept thin by delegating logic to the `pnpm db:migrate:deploy` script.

## Local usage

```bash
# Ensure DATABASE_URL (and optionally DIRECT_URL) point at the target database.
DATABASE_URL="postgres://..." pnpm db:migrate:deploy
```

The script:

- Exits early if it cannot resolve `DATABASE_URL` (optionally falls back to `PROD_DATABASE_URL`).
- Mirrors the value into `DIRECT_URL` when it is absent.
- Executes `prisma migrate deploy` inside the `@repo/database` package.

## GitHub Actions workflow

`db-migrate-deploy.yml` runs on pushes to `main`. It installs dependencies and invokes the same `pnpm db:migrate:deploy` script so future command changes happen in one place.

Required secrets on the `production` environment:

- `DATABASE_URL`
- `DIRECT_URL` (optional if the direct URL matches the primary connection)

Optional additions:

- Pre-migration backups (e.g. Render snapshot) can be layered in via extra `pnpm` scripts.
- Post-migration smoke tests can chain after the deploy script.
