# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Commands

### Development

- `pnpm dev` - Start the hot-reloading development server (concurrency limited to 15)
- `pnpm build` - Compile all apps and packages for production
- `pnpm start` - Serve the production build locally

### Storybook

- `pnpm --filter web storybook` - Start Storybook development server on port 6006
- `pnpm --filter web storybook:build` - Build static Storybook to `storybook-static/`
- Stories are located in `apps/web/modules/ui/components/` and `apps/web/modules/shared/components/`
- Configuration is in `apps/web/.storybook/`
- Supports dark/light mode via toolbar toggle

### Testing

- `pnpm test` - Run Vitest workspace pipeline (Turbo-scoped to affected packages)
- `pnpm test -- --runInBand` - Run tests serially (for noisy environments/pre-commit)
- `pnpm test:ci` - Run tests with coverage thresholds enforced (CI parity)
- `pnpm --filter <workspace> test` - Test a single workspace (e.g., `pnpm --filter @repo/api test`)
- `pnpm --filter web run e2e` - Run Playwright E2E tests with UI
- `pnpm --filter web run e2e:ci` - Run E2E tests headlessly (installs browsers first)
- `pnpm --filter web run type-check` - Run TypeScript project reference checks for web app
- Add `-- --grep "test name"` to target individual Playwright tests
- Database integration tests use Testcontainers (requires Docker running)
- Coverage reports written to each workspace's `coverage/` directory
- Coverage thresholds configured in `tooling/test/coverage-thresholds.ts`

#### Metrics & Reporting

- `pnpm metrics:collect` - Run full test suite with coverage and collect metrics to `metrics/` directory
- `pnpm metrics:weekly` - Generate weekly test-readiness summary with trends and blockers
- `pnpm metrics:weekly --days 14` - Generate summary comparing to 14 days ago
- `pnpm metrics:weekly --format json` - Output summary as JSON
- Weekly summaries are automated via GitHub Actions every Monday at 9 AM UTC

### Code Quality

- `pnpm lint` - Run Biome linting across workspace (linting rules only)
- `pnpm lint:ci` - Run Biome CI check (linting + formatting, strict mode, no auto-fix)
- `pnpm check` - Run Biome validation (linting + formatting with auto-fix)
- `pnpm format` - Format with Biome (writes changes)
- `pre-commit run --all-files` - Run git hooks manually across entire tree

#### Biome Command Reference

| Command | Checks | Auto-fix | Use Case |
| ------- | ------ | -------- | -------- |
| `pnpm lint` | Linting only | No | Quick lint check |
| `pnpm check` | Linting + Formatting | Yes (`--write`) | Development workflow |
| `pnpm lint:ci` | Linting + Formatting | No (strict) | CI parity check |

The pre-commit hook runs `biome ci --staged` to catch issues before they reach CI, ensuring local and CI checks are consistent.

### Database

- `pnpm --filter @repo/database generate` - Generate Prisma client and Zod schemas
- `pnpm --filter @repo/database migrate` - Create and apply migrations
- `pnpm --filter @repo/database studio` - Open Prisma Studio GUI
- `pnpm --filter @repo/database run test:integration` - Run Postgres integration tests (requires Docker)
- Prisma schema is in `packages/database/prisma/schema.prisma`
- Generated types are in `packages/database/prisma/generated/`

#### Prisma to Supabase Migration Sync

Supabase preview branches require migrations in Supabase format. A sync script automatically copies Prisma migrations to Supabase format:

- **Script**: `tooling/scripts/src/supabase/sync-prisma-to-supabase.sh`
- **CI Integration**: Runs automatically on PRs with Prisma migration changes
- **Manual sync**: `./tooling/scripts/src/supabase/sync-prisma-to-supabase.sh`

| System   | Format                                    |
| -------- | ----------------------------------------- |
| Prisma   | `migrations/TIMESTAMP_name/migration.sql` |
| Supabase | `migrations/TIMESTAMP_name.sql`           |

The sync script:

1. Copies new Prisma migrations to Supabase format
2. Skips migrations already synced
3. CI automatically commits synced migrations to the PR branch

#### Local Development Database

**Use Supabase local** for development to match preview/production environments exactly.

**Start Supabase local:**

```bash
supabase start
```

This starts a local Supabase instance with:

- PostgreSQL on port 54322
- Studio UI at http://127.0.0.1:54323
- Storage, Auth, and all Supabase services

**Connection string:**

```text
postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

**Reset database (applies migrations + seed.sql):**

```bash
supabase db reset
```

This is the **same process** used in preview environments, ensuring consistency between local dev and deployed previews.

**Test user credentials (Quick Login button):**

| Field    | Value                 |
| -------- | --------------------- |
| Email    | test@preview.local    |
| Password | TestPassword123       |

The test user is automatically created by `supabase/seed.sql` which runs during `supabase db reset` and on preview branch creation.

**Why Supabase local instead of standalone Postgres?**

- Same seed.sql runs automatically (no manual seeding)
- Storage buckets are created (seed.sql creates `avatars` and `files` buckets)
- Identical environment to preview deployments
- Supabase Studio provides visual database management

### Stripe Webhooks

- `pnpm --filter @repo/scripts stripe:validate` - Validate Stripe webhook configuration and test integration
- Webhook endpoint: `POST /api/webhooks/payments`
- Supported events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `apps/web/.env.local`
- For local testing:
  1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
  2. Login: `stripe login`
  3. Forward webhooks: `stripe listen --forward-to http://localhost:3500/api/webhooks/payments`
  4. Copy webhook signing secret (starts with `whsec_`) to `.env.local`
  5. Trigger test events: `stripe trigger checkout.session.completed`, etc.

## Git Workflow

> **🚨 CRITICAL: NEVER push directly to the main branch unless explicitly directed by the user. 🚨**
>
> **🚨 MANDATORY: ALWAYS use git worktrees for feature work 🚨**

All changes MUST go through pull requests, and all feature work MUST use git worktrees.

### Why Worktrees Are Mandatory

This repository supports **parallel development** with multiple Claude Code instances working on different tickets simultaneously. Worktrees provide:

- **Pure main branch**: Main stays clean as a reference point, never blocked by WIP
- **Complete isolation**: Multiple agents can work without interfering with each other
- **User freedom**: You can experiment on main without disrupting agent work
- **Scalability**: Add more parallel work without coordination overhead

### Standard Workflow

1. **Create worktree FIRST** before any commits:

   **Use the git-worktrees skill** (see `.claude/skills/git-worktrees/SKILL.md`):

   ```bash
   # Invoke via Claude Code skill system
   Use Skill tool with skill: "git-worktrees"
   ```

   The skill will:
   - Create `.worktrees/<type>-pra-XX-<description>/` directory
   - Set up isolated environment with unique PORT
   - Configure `.env.local` for parallel dev servers
   - Run baseline verification tests

   Branch naming conventions:
   - Bug fixes: `fix/pra-XX-short-description`
   - Features: `feat/pra-XX-short-description`
   - Chores: `chore/pra-XX-short-description`
   - Documentation: `docs/pra-XX-short-description`

2. **Navigate to worktree** and make changes:

   ```bash
   cd .worktrees/<type>-pra-XX-<description>
   ```

3. **Commit changes**:

   ```bash
   git add .
   git commit -m "type: description

   Detailed explanation.

   Closes PRA-XX

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   ```

4. **Push to feature branch**:

   ```bash
   git push -u origin HEAD
   ```

5. **Create pull request** targeting main:

   ```bash
   gh pr create --base main --head <feature-branch> --title "..." --body "..."
   ```

6. **Clean up worktree** after PR is merged:

   ```bash
   cd ../..  # Return to main repo
   git worktree remove .worktrees/<type>-pra-XX-<description>
   git worktree prune
   ```

### Automated Protection

A git pre-commit hook (`.git/hooks/pre-commit`) automatically blocks commits to the main branch. This provides an additional safety layer beyond the `.claude/hooks/prevent-main-commit.sh` template.

To bypass (ONLY with explicit user approval):

```bash
git commit --no-verify -m "..."
```

### DO NOT Use Standard Branches

**DO NOT use `git checkout -b`** - this violates the parallel development architecture. All feature work must use worktrees to support:

- Multiple Claude Code instances working in parallel
- User experimentation on main without disrupting agents
- Complete isolation between concurrent tasks

### Exception Handling

**ONLY push to main if:**

- The user explicitly directs you to do so
- You have confirmed with the user first
- The repository has no branch protection requirements

In all other cases, create a worktree and submit a PR.

## Architecture

**Claude Skill Available**: Use the `architecture` skill (`.claude/skills/architecture/`) for comprehensive codebase documentation.

This is a **pnpm + Turbo monorepo**:

- `apps/web` - Next.js 15 App Router application
- `packages/` - Backend logic (`@repo/api`, `@repo/auth`, `@repo/database`, `@repo/payments`, `@repo/mail`, `@repo/storage`, `@repo/ai`, `@repo/logs`, `@repo/utils`)
- `config/` - Application configuration (feature flags, branding, payments)
- `tooling/` - Build infrastructure (TypeScript, Tailwind, scripts)

See `.claude/skills/architecture/` for detailed documentation including:

- API layer (Hono + oRPC) and request flow
- Frontend architecture (React 19, TanStack Query, nuqs)
- Data layer (Prisma, Zod schemas)
- All integrations (payments, email, storage, AI)
- Deployment infrastructure (Vercel, GitHub Actions CI/CD)
- How-to guides for adding modules and packages

### Analytics

- **Skill available**: Use the `analytics` skill (`.claude/skills/analytics/`) for PostHog and analytics provider guidance
- Pluggable provider system at `apps/web/modules/analytics/`
- Default provider: PostHog (`provider/posthog/`)
- Import via `@analytics` alias: `import { useAnalytics } from "@analytics"`
- Set `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` in `apps/web/.env.local`

### Pre-commit Hooks

The repository enforces quality gates via `pre-commit`. Install with `pre-commit install`. Each commit runs:

1. `pnpm exec biome check --write` - Format + lint staged files
2. `pnpm lint` - Workspace-wide Biome lint
3. `pnpm --filter web run type-check` - TypeScript checks for web app
4. Prisma client sync check (when schema/migrations are staged)
5. Targeted tests on affected workspaces

#### Prisma Client Sync Check

When committing changes to `packages/database/prisma/schema.prisma` or migrations, the pre-commit hook automatically:

1. Runs `prisma generate` to regenerate the client and Zod schemas
2. Verifies the generated Zod files in `packages/database/prisma/zod/` are staged

If the generated files differ from what's staged, the commit fails with instructions to stage the updated files:

```bash
git add packages/database/prisma/zod/
```

This prevents stale Prisma clients from being committed, catching sync issues before they reach CI or production.

## Code Style & Patterns

### TypeScript

- Use TypeScript for all code
- Prefer **interfaces** over types
- Avoid **enums**; use maps or const objects instead
- Use functional components with TypeScript interfaces

### React/Next.js

- Prefer **React Server Components** (default in Next.js 15 App Router)
- Use client components (`"use client"`) only when required (interactivity, hooks, browser APIs)
- Functional and declarative programming patterns; avoid classes
- Structure files: exported component, subcomponents, helpers, static content, types
- Use descriptive variable names with auxiliary verbs (e.g., `isLoading`, `hasError`)
- Follow Next.js docs for Data Fetching, Rendering, and Routing

### UI/Styling

- Use **Shadcn UI**, **Radix**, and **Tailwind** for components
- Mobile-first responsive design with Tailwind CSS
- Use `cn()` utility for class name composition (Tailwind class merging)
- Global theme variables defined in `tooling/tailwind/theme.css`

### Workspace References

- Reference internal packages via `@repo/*` workspace alias (e.g., `@repo/api`, `@repo/auth`)
- Follow `apps/web/.env.local.example` pattern when adding environment variables

## Linear Integration

- **Claude Skill Available**: Use the `linear` skill (`.claude/skills/linear/`) for comprehensive Linear project management
  - Automatically invoked when working with Linear projects, milestones, or issues
  - Provides guided workflows and examples
  - See `SKILL.md` and `examples.md` in the skill directory for detailed usage
- MCP linear tool handles standard CRUD; for gaps use helper CLI in `tooling/scripts/src/linear/index.mjs`
- Set `LINEAR_API_KEY` in `apps/web/.env.local`
- Run commands via `pnpm --filter @repo/scripts linear <resource> <action>`
  - `projects list [--query]`
  - `projects create --name <text> [--description] [--target] [--color]`
  - `projects dependency --blocking <ref> --blocked <ref> [--anchor] [--related-anchor] [--type]`
  - `projects dependency --remove --id <relationId>`
  - `milestones list --project <ref>`
  - `milestones create --project <ref> --name <text> [--description] [--target] [--sort]`
  - `issues set-milestone --issue <key> --project <ref> --milestone <ref>`
  - `issues dependency --blocked <key> --blocking <key>`
  - `issues close --issue <key>`
  - `views list-issues --view <id|slug>` - List issues from a custom view

## Environment & Setup

### Node.js Version

This project requires **Node.js v22 LTS**. The `.nvmrc` file specifies the version for automatic detection.

```bash
# Using nvm (recommended)
nvm use              # Automatically uses version from .nvmrc
nvm install          # Install if not present

# Verify version
node --version       # Should show v22.x.x
```

**Why Node.js v22 LTS?**

- Node.js v24+ has compatibility issues with Zod v4's CJS/ESM module interop
- v22 is the current LTS (Long Term Support) release with best stability
- The `engines` field in `package.json` enforces `>=22.0.0 <23.0.0`

**Automatic version switching** (optional): Add to your `~/.zshrc` or `~/.bashrc`:

```bash
# Auto-switch Node version when entering directory with .nvmrc
autoload -U add-zsh-hook
load-nvmrc() {
  if [[ -f .nvmrc && -r .nvmrc ]]; then
    nvm use
  fi
}
add-zsh-hook chpwd load-nvmrc
load-nvmrc
```

### Environment Variables

- Copy `apps/web/.env.local.example` to `apps/web/.env.local` for local development
- `pnpm web:env:list` / `pnpm web:env:set` / `pnpm web:env:unset` - Inspect and manage Vercel environment variables (use `--target` to scope per environment)
- `pnpm web:env:pull` - Pull environment variables from Vercel into `apps/web/.env.local` (requires Vercel CLI auth or `VERCEL_TOKEN`/`VERCEL_PROJECT`/`VERCEL_SCOPE`)
- All commands use `dotenv -c` to auto-load `apps/web/.env.local` variables
- Turbo tracks `.env.*local` files as global dependencies

## Additional Resources

- **Architecture skill**: `.claude/skills/architecture/` (codebase structure, integrations, how-to guides)
- **Analytics skill**: `.claude/skills/analytics/` (PostHog, event tracking, provider system)
- **Auth skill**: `.claude/skills/better-auth/` (authentication implementation)
- **Feature flags skill**: `.claude/skills/feature-flags/` (PostHog feature flags, A/B testing, progressive rollouts)
- **Prisma skill**: `.claude/skills/prisma-migrate/` (database migrations)
- In-app docs: `apps/web/content/docs`
- Agent guidance: `AGENTS.md`
- Contributor workflow: `CONTRIBUTING.md`
- Testing documentation: `docs/postgres-integration-testing.md`
- Cursor rules: `.cursor/rules/` (key principles, project structure, TypeScript usage, UI/styling)
