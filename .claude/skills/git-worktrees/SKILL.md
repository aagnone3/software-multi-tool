---
name: git-worktrees
description: MANDATORY for all feature work. Creates isolated git worktrees for parallel development with unique ports, Supabase Local (port 54322), automated setup, environment configuration, and cleanup. Use when starting feature work, creating branches, or setting up parallel development environments.
allowed-tools:
  - Bash
  - Read
  - Edit
  - Grep
  - Glob
---

# Git Worktrees Skill

Enables parallel development with isolated git worktrees for concurrent features, testing, and code review. This repository requires worktrees for all feature work to support multiple Claude Code instances working simultaneously.

**Database Requirement**: Worktrees must use Supabase Local (port 54322) or Supabase Preview. Homebrew PostgreSQL (port 5432) lacks required storage and seeding functionality. The automated setup script enforces correct database configuration.

## Quick Reference

| Operation | Command |
| --------- | ------- |
| **Create worktree** | `pnpm worktree:create <issue-key> <type> <description>` |
| **Remove worktree** | `pnpm worktree:remove <worktree-name>` |
| **List worktrees** | `pnpm worktree:list` |
| Prune stale refs | `git worktree prune` |

## When to Use This Skill

Use git worktrees when you need to:

- **Parallel development**: Work on multiple features simultaneously (PRA-123 and PRA-456)
- **PR review**: Check out and test pull requests locally while preserving your current work
- **Hotfix workflow**: Create urgent fixes from main while continuing feature development
- **Isolated testing**: Run integration tests in parallel across different branches

**Activation keywords**: parallel development, multiple branches, review PR locally, hotfix, isolated environment, concurrent work

## Why Worktrees Are Mandatory

This repository is designed for **parallel development** with multiple Claude Code instances working simultaneously.

**Core principles:**

- **Pure main branch**: Main stays clean as a reference point, never blocked by WIP
- **Complete isolation**: Multiple agents can work without interfering with each other
- **User freedom**: You can experiment on main without disrupting agent work
- **Zero coordination overhead**: Add more parallel work without conflicts

Standard branching with `git checkout -b` violates this architecture. All feature work must use isolated worktrees.

## Automated Worktree Setup

> **Always use the automated setup script for worktree operations.**

### Create a Worktree

```bash
pnpm worktree:create PRA-163 feat improve-auth-flow
```

This single command:

1. ✅ Creates the git worktree with proper branch naming
2. ✅ Copies environment files from parent repository
3. ✅ **Enforces Supabase Local database** (port 54322)
4. ✅ Allocates unique port for web app
5. ✅ Installs dependencies and generates Prisma client
6. ✅ Verifies database seeding with correct test user
7. ✅ **Configures Supabase Local storage** (SUPABASE_URL + service role key)
8. ✅ Runs baseline type-check verification

### Branch Types

| Type | Use Case |
| ---- | -------- |
| `feat` | New features |
| `fix` | Bug fixes |
| `chore` | Maintenance tasks |
| `docs` | Documentation |
| `refactor` | Code refactoring |
| `test` | Test improvements |

### Example Workflow

```bash
# 1. Create worktree for Linear ticket
pnpm worktree:create PRA-163 feat improve-auth-flow

# 2. Navigate to worktree (script shows this path)
cd .worktrees/feat-pra-163-improve-auth-flow

# 3. Start development
pnpm dev

# 4. After PR is merged, clean up
cd ../..
pnpm worktree:remove feat-pra-163-improve-auth-flow
```

### Working on Branches with New Migrations

**IMPORTANT**: All worktrees share the same local Supabase database. If your feature branch introduces new database migrations, you must apply them:

```bash
# After switching to worktree with new migrations
pnpm supabase:reset
```

This re-applies all migrations from `supabase/migrations/` and re-seeds test data. Without this step, you'll get "table not found" errors when testing new features.

## Prerequisites

- **Git 2.5+**: Worktree support (check: `git --version`)
- **Docker**: Required for Testcontainers-based integration tests
- **pnpm**: Monorepo package manager (worktrees share parent `node_modules`)
- **Supabase CLI**: For local database (`supabase start`)

## Cleanup Workflow

### Step 1: Verify Work is Complete

```bash
cd .worktrees/feat-pra-35-auth
git status  # Should show: "Your branch is up to date with 'origin/...'"
gh pr status  # Check PR status
```

### Step 2: Remove Worktree

```bash
# From parent repository
git worktree remove .worktrees/feat-pra-35-auth

# Force removal (if uncommitted changes exist)
git worktree remove .worktrees/feat-pra-35-auth --force
```

### Step 3: Delete Branch (Optional)

```bash
git branch -d feat/pra-35-auth
git push origin --delete feat/pra-35-auth
```

### Step 4: Prune Stale References

```bash
git worktree prune
git worktree list
```

## Best Practices

1. **Use descriptive branch names**: Follow `<type>/pra-<issue>-<description>` convention
2. **Clean up regularly**: Remove worktrees after PR merge
3. **Prune stale references**: Run `git worktree prune` periodically
4. **Always use Supabase Local**: Never use Homebrew Postgres (port 5432)
5. **Leverage Testcontainers**: Don't manually configure DATABASE_URL for tests
6. **Monitor disk usage**: Each worktree uses ~500MB+
7. **Follow Linear workflow**: Include PRA-XX in branch names, close issues after merge

## Detailed Documentation

For comprehensive details, see these supporting files:

| File | Contents |
| ---- | -------- |
| **[environment-setup.md](./environment-setup.md)** | Port allocation, environment variables, database configuration |
| **[troubleshooting.md](./troubleshooting.md)** | Common issues and solutions |
| **[examples.md](./examples.md)** | Complete workflow examples |
| **[diagrams.md](./diagrams.md)** | Visual architecture diagrams |

## Related Skills

- **`application-environments`**: Local Supabase setup and environment configuration
- **`linear`**: Issue lookup, status updates, and closure workflow
- **`linear-workflow`**: Complete Linear-based development workflow
- **`github-cli`**: Create pull requests from worktree branches
- **`prisma-migrate`**: Database migrations in isolated worktrees
- **`better-auth`**: Authentication development in dedicated worktrees
- **`cicd`**: Preview environment creation for worktree branches
- **`debugging`**: Troubleshooting worktree environment issues
