# @repo/admin

Operational CLI for ad-hoc administration tasks (database queries, env
inspection) across environments.

## Why this exists

The web app's `apps/web/.env.local` is for local development. Production
credentials must not live there — turbo, Next.js, and various tools
auto-discover `*.env.local` files across the workspace, and one stray
copy of prod secrets pollutes every subprocess.

This package is the **only place** that touches prod credentials. They
live in `tooling/admin/.secrets/<env>.env` (gitignored) and are loaded
explicitly by the admin CLI when you opt in via `--env prod`.

## Safety properties

| Concern | Mitigation |
|---|---|
| Auto-loaded by other tools | Filename is `.secrets/<env>.env` — outside `**/.env.*local` glob and outside `apps/web/.env*`. Nothing else reads it. |
| Committed by accident | `.gitignore` covers `.secrets/` |
| Run against prod by mistake | Default is `--env local`. Active env is printed on every command. |
| Untraceable use | `.secrets/audit.log` (gitignored) records every command + target env + timestamp. |
| Mutating action by mistake | Read-only `sql` subcommand by default. See "Future work" below. |

## Commands

```bash
# Pull prod env from Vercel into the secrets dir (requires Vercel CLI logged in)
pnpm admin env pull --env prod

# Ad-hoc SQL (defaults to local DB)
pnpm admin sql "SELECT count(*) FROM tool_job"

# Ad-hoc SQL against prod
pnpm admin sql --env prod "SELECT count(*) FROM organization"

# SQL from a file
pnpm admin sql --env prod --file ./reports/org-jobs.sql

# Show what env would be active without doing anything
pnpm admin env show --env prod
```

## What `--env` does

- `--env local` (default) — loads `apps/web/.env.local`. Hits your local Docker Postgres.
- `--env preview` — loads `tooling/admin/.secrets/preview.env`. For testing reports against the preview branch DB before running them in prod.
- `--env prod` — loads `tooling/admin/.secrets/prod.env`. Production. Read carefully.

The CLI errors out if the secrets file is missing — it never falls back to a different env.

## Audit log

Every command writes a line to `tooling/admin/.secrets/audit.log`:

```text
2026-05-21T14:23:01Z env=prod cmd=sql sql="SELECT count(*) FROM..." rows=1
```

Useful for "did I really run that?" sanity checks.

## Future work

- `--write` flag + interactive confirm for mutating SQL (currently read-only enforcement is by convention only)
- Named reports (`pnpm admin db org-jobs`)
- Schema-aware queries via `@repo/database`'s Prisma client
