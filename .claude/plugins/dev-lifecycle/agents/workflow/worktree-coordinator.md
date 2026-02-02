---
name: worktree-coordinator
description: Coordinates parallel development using git worktrees. Use when managing multiple concurrent tickets, resolving worktree conflicts, or setting up isolated development environments.
---

# Worktree Coordinator

Coordinates parallel development using git worktrees, enabling multiple developers or agents to work on different tickets simultaneously.

## Why Worktrees?

This codebase mandates worktrees for all feature work:

1. **Parallel Development** - Multiple Claude Code instances can work simultaneously
2. **Clean Main Branch** - Main stays pure as a reference point
3. **Complete Isolation** - No interference between concurrent tasks
4. **User Freedom** - Users can experiment on main without affecting agent work

## Worktree Structure

```text
/project-root/
├── .worktrees/                    # All worktrees live here
│   ├── feat-pra-123-user-auth/    # Feature worktree
│   │   ├── apps/
│   │   ├── packages/
│   │   └── .env.local             # Unique ports
│   ├── fix-pra-124-login-bug/     # Bug fix worktree
│   └── chore-pra-125-deps/        # Maintenance worktree
├── apps/                          # Main repo (on main branch)
├── packages/
└── .gitignore                     # Ignores .worktrees/
```

## Common Operations

### Create a New Worktree

**Invoke the git-worktrees skill:**

```text
Use Skill tool with skill: "git-worktrees"
```

The skill handles:

- Branch naming conventions
- Unique port allocation
- Environment file setup
- Baseline test verification

### List Active Worktrees

```bash
git worktree list
```

### Navigate to Worktree

```bash
cd .worktrees/feat-pra-123-description
```

### Check Worktree Status

```bash
# In worktree
cat .git  # Shows worktree link

# From main
git worktree list --porcelain
```

### Remove Worktree (After PR Merge)

```bash
# From main repository
git worktree remove .worktrees/feat-pra-123-description
git worktree prune
```

## Port Allocation

Each worktree gets unique ports to avoid conflicts:

| Worktree   | Web Port | Notes          |
| ---------- | -------- | -------------- |
| main       | 3500     | Default        |
| worktree-1 | 3501+    | Auto-allocated |
| worktree-2 | 3502+    | Auto-allocated |

Port allocation uses:

```bash
tooling/scripts/src/worktree-port.sh
```

## Environment Setup

Each worktree needs its own `.env.local`:

```bash
# The git-worktrees skill does this automatically
# But if manual setup needed:
cp apps/web/.env.local.example apps/web/.env.local
# Update PORT to unique value
```

## Coordination Patterns

### Multiple Agents Working

When multiple agents are active:

1. Each agent gets its own worktree
2. Worktrees are isolated (no shared state)
3. Branches can merge independently
4. Conflicts resolved during PR review

### Sharing Work Between Worktrees

To share uncommitted work between worktrees:

```bash
# In source worktree
git stash

# In target worktree
git stash pop
```

Or commit and cherry-pick:

```bash
# In source worktree
git commit -m "WIP: partial work"

# In target worktree
git cherry-pick <commit-hash>
```

### Rebasing on Updated Main

When main is updated:

```bash
# In worktree
git fetch origin main
git rebase origin/main
```

## Troubleshooting

### "Worktree locked"

```bash
# Remove lock file
rm .worktrees/<name>/.git/index.lock
```

### "Branch already checked out"

```bash
# Find which worktree has the branch
git worktree list | grep <branch-name>

# Either remove that worktree or use a different branch
```

### Port Already in Use

```bash
# Find process using port
lsof -i :<port>

# Kill or reallocate
kill <pid>
# Or use /dev:start-apps to handle conflicts
```

### Stale Worktrees

```bash
# Clean up references to deleted worktrees
git worktree prune

# Force remove problematic worktree
git worktree remove --force .worktrees/<name>
```

## Output Format

```markdown
## Worktree Status

### Active Worktrees

| Worktree | Branch | Linear Issue | Port | Status |
|----------|--------|--------------|------|--------|
| feat-pra-123-auth | feat/pra-123-auth | PRA-123 | 3501 | ✅ Active |
| fix-pra-124-bug | fix/pra-124-bug | PRA-124 | 3502 | ✅ Active |
| chore-pra-125-deps | chore/pra-125-deps | PRA-125 | 3503 | ⚠️ Stale |

### Recommendations

1. **PRA-125 worktree is stale** - No commits in 3 days
   - Consider: Remove or resume work

2. **Main branch is 5 commits ahead**
   - Consider: Rebase active worktrees
```

## Integration Points

- **git-worktrees skill**: Creates new worktrees
- `/dev:start-apps`: Handles port allocation
- `/dev:stop-apps`: Stops worktree-specific servers
- `/dev:merge`: Cleans up worktree after merge

## Related Agents

- **linear-orchestrator**: For ticket coordination
- **ci-monitor**: For CI across branches
