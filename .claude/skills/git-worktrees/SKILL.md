---
name: using-git-worktrees
description: MANDATORY for all feature work. Creates isolated git worktrees for parallel development with unique web-app ports backed by a shared local Postgres container (Docker Compose, port 54322), automated setup, environment configuration, and cleanup. Use when starting features, reviewing PRs locally, creating hotfixes, or running parallel development sessions.
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Grep
  - Glob
---

# Git Worktrees Skill

Enables parallel development with isolated git worktrees for concurrent features, testing, and code review. This repository requires worktrees for all feature work to support multiple Claude Code instances working simultaneously.

**Database Requirement**: Worktrees share the local Postgres container managed by Docker Compose (port 54322). Don't point worktrees at a separately installed Postgres (e.g. Homebrew on port 5432) — the seed and migration tooling assumes the Compose-managed container. The automated setup script enforces this.

## Quick Reference

| Operation | Command |
| --------- | ------- |
| **Create worktree** | `pnpm worktree:create <issue-key> <type> <description>` |
| **Remove worktree** | `pnpm worktree:remove <worktree-name>` |
| **List worktrees** | `pnpm worktree:list` |
| Prune stale refs | `git worktree prune` |
| **⚠ New migrations** | `pnpm db:reset` (all worktrees share one DB) |

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
3. ✅ **Points DATABASE_URL at the shared local Postgres container** (port 54322)
4. ✅ Allocates a unique port for the web app
5. ✅ Installs dependencies and generates the Prisma client
6. ✅ Verifies database seeding with the correct test user
7. ✅ Runs baseline type-check verification

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

**IMPORTANT**: All worktrees share the same local Postgres container. If your feature branch introduces new database migrations, you must apply them:

```bash
# After switching to a worktree with new migrations
pnpm db:reset
```

This destroys the database volume, re-applies all Prisma migrations from `packages/database/prisma/migrations/`, and re-seeds test data. Without this step, you'll get "table not found" errors when testing new features.

## Prerequisites

- **Git 2.5+**: Worktree support (check: `git --version`)
- **Docker**: Required for the local Postgres container and for Testcontainers-based integration tests
- **pnpm**: Monorepo package manager (worktrees share parent `node_modules`)

## Cleanup Workflow

### Step 1: Verify Work is Complete

```bash
cd .worktrees/feat-pra-35-auth
git status  # Should show: "Your branch is up to date with 'origin/...'"
gh pr status  # Check PR status
```

### Step 2: Remove Worktree

```bash
# From parent repository (uses pnpm script for clean removal)
pnpm worktree:remove feat-pra-35-auth

# Or manually if script is unavailable
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
4. **Always use the Compose-managed Postgres on port 54322**: Don't point worktrees at a separately installed Postgres (e.g. Homebrew on 5432)
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

## When to Use This Skill

Use git worktrees when you need to:

- **Parallel development**: Work on multiple features simultaneously (PRA-123 and PRA-456)
- **PR review**: Check out and test pull requests locally while preserving your current work
- **Hotfix workflow**: Create urgent fixes from main while continuing feature development
- **Isolated testing**: Run integration tests in parallel across different branches

**Activation keywords**: worktree, worktrees, git worktree, parallel development, multiple branches, review PR locally, hotfix, isolated environment, concurrent work

## Related Skills

- **application-environments**: Local Docker-Compose Postgres setup and environment configuration
- **linear**: Issue lookup, status updates, and closure workflow
- **linear-workflow**: Complete Linear-based development workflow
- **github-cli**: Create pull requests from worktree branches
- **prisma-migrate**: Database migrations in isolated worktrees
- **better-auth**: Authentication development in dedicated worktrees
- **cicd**: Preview environment creation for worktree branches
- **debugging**: Troubleshooting worktree environment issues
