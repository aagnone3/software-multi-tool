---
name: git-worktrees
description: Use this skill when working on multiple features in parallel, need isolated development environments, want to review PRs locally without switching branches, or need to hotfix main while preserving in-progress work. Provides git worktree creation, isolation patterns, and cleanup workflows optimized for pnpm monorepos with Turbo.
allowed-tools:
  - Bash
  - Read
  - Edit
  - Grep
  - Glob
---

# Git Worktrees Skill

Enable parallel development with isolated git worktrees for concurrent features, testing, and code review.

## Quick Reference

| Operation | Command |
| --------- | ------- |
| Create worktree with new branch | `git worktree add <path> -b <branch-name>` |
| List all worktrees | `git worktree list` |
| Remove worktree | `git worktree remove <path>` |
| Prune stale references | `git worktree prune` |
| Check if directory is ignored | `git check-ignore -q <directory>` |

## When to Use This Skill

Use git worktrees when you need to:

- **Parallel development**: Work on multiple features simultaneously (PRA-123 and PRA-456) without context switching
- **PR review**: Check out and test pull requests locally while preserving your current work
- **Hotfix workflow**: Create urgent fixes from main while continuing feature development
- **Isolated testing**: Run integration tests in parallel across different branches
- **Code comparison**: Compare implementations side-by-side in different worktrees

**Activation keywords**: parallel development, multiple branches, review PR locally, hotfix, isolated environment, concurrent work, switch between features

## Prerequisites

- **Git 2.5+**: Worktree support (check: `git --version`)
- **Docker**: Required for Testcontainers-based integration tests
- **pnpm**: Monorepo package manager (worktrees share parent `node_modules`)
- **Disk space**: Each worktree is a full working directory (~500MB+)

## Core Principle

> **Systematic directory selection + safety verification = reliable isolation**

This skill follows a three-tier priority system for directory selection and enforces safety checks before worktree creation to prevent common pitfalls.

### Visual Overview

```mermaid
graph TD
    A[Repository Root<br/>software-multi-tool/] --> B[.git/<br/>Shared Git Database]
    A --> C[Main Working Directory<br/>branch: main]
    A --> D[.worktrees/]

    D --> E[feat-pra-45-user-profile/<br/>branch: feat/pra-45-user-profile<br/>PORT: 3742]
    D --> F[fix-pra-52-nav-bug/<br/>branch: fix/pra-52-nav-bug<br/>PORT: 3621]

    B -.->|shared| E
    B -.->|shared| F

    E --> E1[apps/web/.env.local<br/>PORT=3742]
    F --> F1[apps/web/.env.local<br/>PORT=3621]

    style B fill:#e1f5ff
    style E fill:#d4edda
    style F fill:#fff3cd
    style E1 fill:#d4edda
    style F1 fill:#fff3cd
```

**Key**: All worktrees share `.git/` but have independent working directories and ports.

## Directory Selection Process

Follow this priority order when deciding where to create worktrees:

### 1. Check for Existing Directories

Look for existing worktree directories in the repository:

```bash
# Check for hidden directory (preferred)
[ -d ".worktrees" ] && echo "Using .worktrees/"

# Check for visible directory
[ -d "worktrees" ] && echo "Using worktrees/"
```

**Rule**: If `.worktrees/` exists, use it (takes precedence over `worktrees/`). If only `worktrees/` exists, use that.

### 2. Check CLAUDE.md

Search `CLAUDE.md` for worktree directory preferences:

```bash
grep -i "worktree" CLAUDE.md
```

If the project documents a preference, use it without asking.

### 3. Ask User

If no existing directory or documented preference, offer two options:

#### Option A: Project-local (Recommended)

- Path: `.worktrees/` (hidden directory in repository root)
- Pros: Co-located with project, easy access
- Cons: Requires `.gitignore` entry, uses project disk space
- Best for: Teams, active development

#### Option B: Global

- Path: `~/.config/software-multi-tool/worktrees/`
- Pros: Outside repository, no `.gitignore` needed
- Cons: Harder to find, manual cleanup required
- Best for: Personal workflows, disk space constraints

## Safety Verification Requirements

### For Project-Local Directories

**CRITICAL**: Always verify the worktree directory is git-ignored before creation.

```bash
# Check if directory is ignored
git check-ignore -q .worktrees

if [ $? -ne 0 ]; then
  echo "ERROR: .worktrees/ is not in .gitignore"

  # Add to .gitignore
  echo ".worktrees/" >> .gitignore

  # Commit the change
  git add .gitignore
  git commit -m "chore: add .worktrees/ to .gitignore

  Configure git-ignore for worktree directory to prevent
  accidentally committing parallel development environments.

  🤖 Generated with [Claude Code](https://claude.com/claude-code)

  Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
fi
```

**Why this matters**: Without `.gitignore`, worktree directories appear as untracked files and can be accidentally committed.

### For Global Directories

No verification needed - directory is outside the repository entirely.

## Worktree Creation Workflow

### Step 1: Pre-flight Checks

Before creating a worktree, verify repository state:

```bash
# Prune stale worktree references
git worktree prune

# Check current branch (should NOT be main for safety)
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ]; then
  echo "WARNING: Currently on main branch"
  echo "Consider switching to a feature branch first"
fi

# Ensure main is clean and up-to-date
git fetch origin main
git checkout main
git status  # Should show "nothing to commit, working tree clean"
```

### Step 2: Create Worktree with New Branch

Follow branch naming conventions: `<type>/pra-<issue>-<description>`

```bash
# Example: Feature branch for Linear issue PRA-35
git worktree add .worktrees/feat-pra-35-user-auth -b feat/pra-35-user-auth

# Navigate to worktree
cd .worktrees/feat-pra-35-user-auth
```

**Branch types**: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`

### Step 3: Configure Environment Variables (For Parallel Development)

**CRITICAL for parallel dev servers**: Each worktree needs its own PORT to avoid conflicts and prevent Next.js auto-switching ports.

```bash
# Copy parent .env.local as template
cp ../../apps/web/.env.local apps/web/.env.local

# AUTOMATIC PORT ALLOCATION (recommended)
# Uses deterministic hash of worktree path to generate unique port
WORKTREE_PORT=$(../../tooling/scripts/src/worktree-port.sh .)
echo "" >> apps/web/.env.local
echo "# Worktree-specific port (auto-allocated)" >> apps/web/.env.local
echo "PORT=$WORKTREE_PORT" >> apps/web/.env.local

# Verify port assignment
echo "Allocated port: $WORKTREE_PORT"
```

**How automatic port allocation works**:

1. **Deterministic**: Hashes worktree path → consistent port number (3501-3999)
2. **Collision-safe**: Checks if port is actually in use with `lsof`
3. **Auto-recovery**: If port taken, finds next available port automatically
4. **No file locking**: Uses real-time port availability checks

**Why this matters**:

- ❌ Manual port assignment → human error, conflicts
- ❌ Next.js auto-switch → breaks apps expecting specific PORT
- ✅ Automatic allocation → collision-free, deterministic, reliable

**Database isolation**: Testcontainers automatically allocates unique ports for PostgreSQL containers - no manual `DATABASE_URL` configuration needed!

### Step 4: Install Dependencies (Usually Not Needed)

**Important**: Worktrees share `node_modules` and `.turbo` cache from the parent repository.

```bash
# Generally SKIP this step
# pnpm install

# Only run if encountering dependency issues:
# - Missing dependencies error
# - Version mismatch warnings
# - After updating pnpm-lock.yaml in worktree
```

### Step 5: Baseline Verification

Run tests to ensure clean starting state:

```bash
# Run unit tests
pnpm test

# Run TypeScript checks
pnpm --filter web run type-check

# Run integration tests (Testcontainers handles database isolation)
pnpm --filter @repo/database run test:integration
```

**Skip coverage enforcement** (too strict for worktree creation):

```bash
# DO NOT run
# pnpm test:ci  # Enforces coverage thresholds
```

**Report failures explicitly**. If tests fail, require user approval before proceeding.

### Step 6: Start Development

```bash
# Start dev server on custom port
pnpm dev  # Uses PORT=3501 from .env.local

# Open in browser
# http://localhost:3501
```

**Parallel development**: You can now run multiple dev servers simultaneously by following Steps 2-6 for each worktree with different PORT values.

## pnpm Monorepo Considerations

### Shared Resources

Worktrees share these resources from the parent repository:

- **node_modules/**: Package dependencies (saves ~500MB per worktree)
- **.turbo/**: Turbo cache for faster builds
- **.git/hooks/**: Git hooks (pre-commit applies to all worktrees)
- **.git/config**: Git configuration

### Independent Resources

Each worktree has its own:

- **Working directory**: Full file tree at specific branch state
- **.env.local**: Environment configuration (create per worktree)
- **Turbo task runs**: Independent build/test execution

### Turbo Cache Management

If experiencing build inconsistencies across worktrees:

```bash
# Clear Turbo cache
rm -rf node_modules/.cache/turbo

# Or use pnpm script
pnpm clean
```

## Port Conflict Management

### Automatic Dev Server Port Allocation

**Use the worktree port allocator** to avoid collisions automatically:

```mermaid
flowchart TD
    A[Create Worktree<br/>.worktrees/feat-pra-45] --> B[Run Port Allocator<br/>worktree-port.sh]

    B --> C{Hash Worktree Path}
    C --> D[SHA256 Hash<br/>→ 0x2A3F...]
    D --> E[Modulo 499<br/>→ 241]
    E --> F[Add 3501<br/>→ Port 3742]

    F --> G{Check Port<br/>Available?}

    G -->|Yes| H[✓ Use Port 3742]
    G -->|No| I[Try Next Port<br/>→ 3743]

    I --> J{Check Port<br/>Available?}
    J -->|Yes| K[✓ Use Port 3743]
    J -->|No| L[Continue...]

    H --> M[Write to .env.local<br/>PORT=3742]
    K --> N[Write to .env.local<br/>PORT=3743]

    style H fill:#d4edda
    style K fill:#d4edda
    style G fill:#fff3cd
    style J fill:#fff3cd
```

```bash
# In worktree directory
cd .worktrees/feat-pra-123-feature

# Allocate port automatically
WORKTREE_PORT=$(../../tooling/scripts/src/worktree-port.sh .)
echo "PORT=$WORKTREE_PORT" >> apps/web/.env.local

# Start dev server
pnpm dev  # → Uses allocated port
```

**Port allocator features**:

- **Deterministic**: Same worktree → same port (based on path hash)
- **Range**: 3501-3999 (499 ports available)
- **Collision detection**: Checks actual port usage with `lsof`
- **Auto-recovery**: Finds next available port if conflict occurs

**Check port availability**:

```bash
# Check if a specific port is free
tooling/scripts/src/worktree-port.sh .worktrees/feat-pra-35-auth --check-only

# List all ports in use
lsof -i :3500-3999 | grep LISTEN
```

**Manual override** (not recommended):

```bash
# If you really need a specific port
echo "PORT=3505" >> apps/web/.env.local
```

### Database Ports (Integration Tests)

**No manual configuration needed!**

Testcontainers automatically:

- Allocates random available ports for each PostgreSQL container
- Configures `DATABASE_URL` in the test environment
- Cleans up containers after test completion

This enables **parallel integration tests** across multiple worktrees without conflicts.

### Local PostgreSQL (Development)

The local PostgreSQL instance on port `5432` is typically only used by the parent repository. Worktrees use Testcontainers for integration tests.

**Connection string** (for reference):

```text
postgresql://postgres:postgres@localhost:5432/local_softwaremultitool
```

## Environment Variable Isolation

### Shared Variables (Default)

By default, all worktrees share the parent `apps/web/.env.local` file. This is fine for:

- API keys (PostHog, Stripe, etc.)
- Database credentials (not used by Testcontainers)
- Feature flags

### Per-Worktree Variables (Required for Parallel Development)

Create worktree-specific `.env.local` files for:

1. **PORT**: Dev server port (automatically allocated)
2. **Any variables that cause conflicts** when running parallel servers

**Setup pattern with automatic port allocation**:

```bash
cd .worktrees/feat-pra-35-auth

# Copy parent template
cp ../../apps/web/.env.local apps/web/.env.local

# Auto-allocate port (deterministic + collision-safe)
WORKTREE_PORT=$(../../tooling/scripts/src/worktree-port.sh .)
echo "" >> apps/web/.env.local
echo "# Auto-allocated port for this worktree" >> apps/web/.env.local
echo "PORT=$WORKTREE_PORT" >> apps/web/.env.local

# Verify
cat apps/web/.env.local | grep PORT
# Output: PORT=3518 (or whatever port was allocated)
```

**Why automatic allocation?**

- Prevents manual port assignment errors
- Stops Next.js from auto-switching ports (which breaks apps reading PORT from .env)
- Deterministic: Same worktree always gets same port attempt
- Collision-safe: Finds next available port if conflict occurs

### Git Configuration

**Important**: Per-worktree `.env.local` files are git-ignored by default (`.gitignore` includes `apps/web/.env.local`). This prevents accidentally committing worktree-specific configuration.

## Baseline Verification

### Test Strategy

Run these tests in each new worktree to verify clean state:

```bash
# 1. Unit tests (fast, no external dependencies)
pnpm test

# 2. Type checking (catches TypeScript errors)
pnpm --filter web run type-check

# 3. Integration tests (uses Testcontainers, slower)
pnpm --filter @repo/database run test:integration
```

### Parallel Testing

**Supported!** Multiple worktrees can run integration tests simultaneously:

```bash
# Terminal 1 - Worktree 1
cd .worktrees/feat-pra-123-feature
pnpm --filter @repo/database run test:integration

# Terminal 2 - Worktree 2 (runs in parallel!)
cd .worktrees/fix-pra-456-bugfix
pnpm --filter @repo/database run test:integration
```

Testcontainers ensures database isolation by:

- Creating separate PostgreSQL containers
- Using random ports for each container
- Cleaning up after tests complete

### Coverage Enforcement

**Skip** `pnpm test:ci` during worktree creation - coverage thresholds are too strict:

```bash
# DO NOT run during worktree setup
# pnpm test:ci

# Use standard test command instead
pnpm test
```

## Edge Cases & Troubleshooting

### Stale Worktree References

**Problem**: `.git/worktrees/<name>` exists but directory was deleted manually.

**Solution**:

```bash
# Prune stale references
git worktree prune

# Verify cleanup
git worktree list
```

### Worktree Already Exists for Branch

**Problem**: Trying to create worktree for a branch that already has one.

**Solution**:

```bash
# List existing worktrees
git worktree list

# Remove existing worktree first
git worktree remove .worktrees/feat-pra-35-auth

# Or move to that worktree instead
cd .worktrees/feat-pra-35-auth
```

### Directory Name Conflicts

**Problem**: Worktree directory already exists (from previous manual deletion).

**Solution**:

```bash
# Check if directory exists
ls -la .worktrees/feat-pra-35-auth

# Remove directory
rm -rf .worktrees/feat-pra-35-auth

# Prune stale git references
git worktree prune

# Create worktree
git worktree add .worktrees/feat-pra-35-auth -b feat/pra-35-auth
```

### Currently Checked Out Branch

**Problem**: Cannot create worktree for the branch you're currently on.

**Solution**:

```bash
# Check current branch
git branch --show-current

# Switch to different branch first
git checkout main

# Then create worktree
git worktree add .worktrees/feat-pra-35-auth -b feat/pra-35-auth
```

### pnpm Lock File Conflicts

**Problem**: `pnpm-lock.yaml` modified in worktree after creation.

**Solution**:

```bash
cd .worktrees/feat-pra-35-auth

# Check for modifications
git status | grep "pnpm-lock.yaml"

# If modified, restore from parent
git restore pnpm-lock.yaml

# If needed, run install in parent instead
cd ../..
pnpm install
```

### Orphaned Worktrees After System Crash

**Problem**: Worktree directory exists but git doesn't recognize it.

**Solution**:

```bash
# Repair worktree references
git worktree repair

# List to verify
git worktree list

# If still broken, remove and recreate
git worktree remove .worktrees/feat-pra-35-auth --force
git worktree add .worktrees/feat-pra-35-auth -b feat/pra-35-auth
```

### Turbo Cache Corruption

**Problem**: Builds succeed in parent but fail in worktree (or vice versa).

**Solution**:

```bash
# Clear Turbo cache
rm -rf node_modules/.cache/turbo

# Or use pnpm script
pnpm clean

# Rebuild
pnpm build
```

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3501`

**Solution**:

```bash
# Check what's using the port
lsof -i :3501

# Kill the process
kill -9 <PID>

# Or use a different port
echo "PORT=3502" >> apps/web/.env.local
pnpm dev
```

## Cleanup Workflow

### Step 1: Verify Work is Complete

Before removing a worktree, ensure:

1. **All commits are pushed** to remote:

   ```bash
   cd .worktrees/feat-pra-35-auth
   git status
   # Should show: "Your branch is up to date with 'origin/feat/pra-35-auth'"
   ```

2. **Pull request is merged** (if applicable):

   ```bash
   gh pr status
   # Check PR status for this branch
   ```

3. **Linear issue is closed** (if applicable):

   ```bash
   # Close Linear issue
   pnpm --filter @repo/scripts linear issues close --issue PRA-35
   ```

### Step 2: Remove Worktree

```bash
# From parent repository
git worktree remove .worktrees/feat-pra-35-auth

# Git automatically:
# - Verifies no uncommitted changes
# - Removes the directory
# - Cleans up .git/worktrees/<name> references
```

**Force removal** (if worktree has uncommitted changes):

```bash
# WARNING: This DELETES uncommitted work!
git worktree remove .worktrees/feat-pra-35-auth --force
```

### Step 3: Delete Branch (Optional)

After PR is merged:

```bash
# Delete local branch
git branch -d feat/pra-35-auth

# Delete remote branch (if not auto-deleted by PR merge)
git push origin --delete feat/pra-35-auth
```

### Step 4: Prune Stale References

```bash
# Clean up any stale worktree references
git worktree prune

# Verify cleanup
git worktree list
# Should only show parent repository (if no other worktrees)
```

## Related Skills

- **`linear` skill** (`.claude/skills/linear/`): Issue lookup, status updates, and closure workflow
- **`linear-workflow` skill**: Complete Linear-based development workflow
- **`github-cli` skill**: Create pull requests from worktree branches
- **`dev:work-on-ticket` skill**: Automated ticket workflow (worktrees enable parallel execution)
- **`dev:pull-request` skill**: Create organized PRs from worktree changes
- **`prisma-migrate` skill**: Database migrations in isolated worktrees
- **`better-auth` skill**: Authentication development in dedicated worktrees

## Git Hooks Integration

### Shared Hooks

Worktrees inherit `.git/hooks/` from the parent repository. All hooks apply to ALL worktrees:

- **Pre-commit hooks**: Biome linting, type-checking, tests
- **Commit-msg hooks**: Message format validation
- **Custom hooks**: `.claude/hooks/prevent-main-commit.sh` (blocks main commits)

### Per-Worktree Bypass

If you need to bypass hooks in a specific worktree (use with caution):

```bash
# Bypass hooks for single commit
git commit --no-verify -m "..."

# Not recommended - defeats purpose of hooks
```

## Best Practices

1. **Use descriptive branch names**: Follow `<type>/pra-<issue>-<description>` convention
2. **Clean up regularly**: Remove worktrees after PR merge
3. **Prune stale references**: Run `git worktree prune` periodically
4. **Configure PORT per worktree**: Avoid dev server conflicts
5. **Share .env.local thoughtfully**: Copy parent template, customize only what's needed
6. **Leverage Testcontainers**: Don't manually configure DATABASE_URL for tests
7. **Monitor disk usage**: Each worktree uses ~500MB+
8. **Document worktree purpose**: Add comment in .env.local or README
9. **Follow Linear workflow**: Include PRA-XX in branch names, close issues after merge
10. **Test before cleanup**: Verify PR is merged and deployed before removing worktree
