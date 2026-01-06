# Git Worktrees - Quick Reference

Enable parallel development with isolated git worktrees for concurrent features, testing, and code review.

## What Are Worktrees?

Git worktrees let you check out multiple branches simultaneously in separate directories. This enables:

- Work on multiple features in parallel (PRA-123 and PRA-456)
- Review PRs locally without switching branches
- Create hotfixes while preserving in-progress work
- Run parallel integration tests with automatic database isolation

## Prerequisites

- **Git 2.5+**: Check with `git --version`
- **Docker**: Required for Testcontainers integration tests
- **pnpm**: Monorepo package manager
- **Disk space**: ~500MB+ per worktree

## Quick Commands

| Operation | Command |
| --------- | ------- |
| Create worktree | `git worktree add .worktrees/<name> -b <branch>` |
| List worktrees | `git worktree list` |
| Remove worktree | `git worktree remove .worktrees/<name>` |
| Prune stale references | `git worktree prune` |
| Check gitignore | `git check-ignore -q .worktrees` |

## Quick Start

### 1. Create Your First Worktree

```bash
# Add .worktrees/ to .gitignore (if not present)
echo ".worktrees/" >> .gitignore
git add .gitignore && git commit -m "chore: add .worktrees/ to .gitignore"

# Create worktree for Linear issue PRA-35
git worktree add .worktrees/feat-pra-35-user-auth -b feat/pra-35-user-auth

# Navigate to worktree
cd .worktrees/feat-pra-35-user-auth

# Start development
pnpm dev
```

### 2. Parallel Development (Multiple Worktrees)

```bash
# First worktree
git worktree add .worktrees/feat-pra-35-auth -b feat/pra-35-auth
cd .worktrees/feat-pra-35-auth
cp ../../apps/web/.env.local apps/web/.env.local
WORKTREE_PORT=$(../../tooling/scripts/src/worktree-port.sh .)
echo "PORT=$WORKTREE_PORT" >> apps/web/.env.local
pnpm dev  # → http://localhost:[allocated-port]

# Second worktree (different terminal)
cd /path/to/repo
git worktree add .worktrees/fix-pra-42-bug -b fix/pra-42-bug
cd .worktrees/fix-pra-42-bug
cp ../../apps/web/.env.local apps/web/.env.local
WORKTREE_PORT=$(../../tooling/scripts/src/worktree-port.sh .)
echo "PORT=$WORKTREE_PORT" >> apps/web/.env.local
pnpm dev  # → http://localhost:[allocated-port]
```

**Result**: Two dev servers on automatically allocated ports. No conflicts!

### 3. Cleanup After PR Merge

```bash
# Remove worktree
git worktree remove .worktrees/feat-pra-35-auth

# Delete branch
git branch -d feat/pra-35-auth

# Close Linear issue
pnpm --filter @repo/scripts linear issues close --issue PRA-35

# Prune stale references
git worktree prune
```

## Branch Naming Convention

Follow the repository standard:

```text
<type>/pra-<issue>-<description>
```

**Examples**:

- `feat/pra-35-user-authentication`
- `fix/pra-42-login-redirect-bug`
- `chore/pra-89-update-dependencies`

**Types**: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`

## Parallel Development Setup

### Automatic Port Allocation

**Use the worktree port allocator** to avoid port conflicts automatically:

```bash
cd .worktrees/feat-pra-35-auth

# Copy parent .env.local
cp ../../apps/web/.env.local apps/web/.env.local

# Auto-allocate unique port (deterministic + collision-safe)
WORKTREE_PORT=$(../../tooling/scripts/src/worktree-port.sh .)
echo "PORT=$WORKTREE_PORT" >> apps/web/.env.local

# Start dev server
pnpm dev  # Uses allocated port automatically
```

**How it works**:

- **Deterministic**: Hashes worktree path → consistent port (3501-3999 range)
- **Collision-safe**: Checks actual port availability with `lsof`
- **Auto-recovery**: Finds next available port if conflict occurs
- **No file locking**: Uses real-time availability checks

**Why automatic allocation?**

- ❌ Manual ports → human error, conflicts
- ❌ Next.js auto-switch → breaks apps reading PORT from .env
- ✅ Automatic → deterministic, collision-free, reliable

### Parallel Integration Tests

**Good news**: Testcontainers automatically handles database isolation!

```bash
# Terminal 1
cd .worktrees/feat-pra-35-auth
pnpm --filter @repo/database run test:integration
# → Uses PostgreSQL on random port (e.g., 54321)

# Terminal 2 (runs in parallel!)
cd .worktrees/fix-pra-42-bug
pnpm --filter @repo/database run test:integration
# → Uses PostgreSQL on different random port (e.g., 54322)
```

**No manual DATABASE_URL configuration needed!**

## Safety Notes

### Git-ignore Verification

Always verify `.worktrees/` is in `.gitignore` before creating worktrees:

```bash
git check-ignore -q .worktrees
if [ $? -ne 0 ]; then
  echo ".worktrees/" >> .gitignore
  git add .gitignore
  git commit -m "chore: add .worktrees/ to .gitignore"
fi
```

### Shared Resources

Worktrees share these from parent repository:

- **node_modules/**: Package dependencies
- **.turbo/**: Build cache
- **.git/hooks/**: Git hooks (pre-commit applies to all worktrees)

### Independent Resources

Each worktree has its own:

- **Working directory**: Full file tree at branch state
- **.env.local**: Environment config (create per worktree for parallel dev)

## Common Issues

### Stale Worktree References

```bash
git worktree prune
```

### Port Already in Use

The automatic port allocator handles this for you! But if you need to debug:

```bash
# Check which ports are in use
lsof -i :3500-3999 | grep LISTEN

# Check if specific port is available
tooling/scripts/src/worktree-port.sh .worktrees/feat-pra-35-auth --check-only

# Re-allocate port (finds next available)
WORKTREE_PORT=$(tooling/scripts/src/worktree-port.sh .worktrees/feat-pra-35-auth)
echo "PORT=$WORKTREE_PORT" >> apps/web/.env.local
```

### Worktree Already Exists

```bash
# List all worktrees
git worktree list

# Remove existing worktree
git worktree remove .worktrees/feat-pra-35-auth
```

### Currently Checked Out Branch

```bash
# Cannot create worktree for current branch
# Switch to different branch first
git checkout main
git worktree add .worktrees/feat-pra-35-auth -b feat/pra-35-auth
```

## Testing Strategy

### Unit Tests

```bash
pnpm test
```

### Type Checking

```bash
pnpm --filter web run type-check
```

### Integration Tests (Parallel-Safe)

```bash
pnpm --filter @repo/database run test:integration
```

### Coverage (Skip During Worktree Setup)

```bash
# DO NOT run - too strict for worktree creation
# pnpm test:ci
```

## Files in This Skill

- **SKILL.md**: Complete documentation with all workflows and edge cases
- **examples.md**: 8 real-world scenarios with step-by-step commands
- **README.md** (this file): Quick reference for common operations

## Related Skills

- **`linear`**: Issue management, status updates, closure
- **`github-cli`**: PR creation from worktree branches
- **`dev:work-on-ticket`**: Automated ticket workflow
- **`prisma-migrate`**: Database migrations in worktrees
- **`better-auth`**: Authentication development

## Learn More

See [SKILL.md](./SKILL.md) for comprehensive documentation including:

- Directory selection logic
- Safety verification requirements
- Environment variable isolation
- Edge cases and troubleshooting
- Cleanup workflows
- Best practices

See [examples.md](./examples.md) for practical scenarios:

- Basic worktree creation
- Parallel development
- Parallel integration tests
- Hotfix workflow
- Code review workflow
- Long-running feature branches
- Merge conflict resolution
- Cleanup after PR merge
