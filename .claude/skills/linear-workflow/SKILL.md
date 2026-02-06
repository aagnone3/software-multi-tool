---
name: implementing-linear-workflow
description: Implements Linear issue workflow using MANDATORY worktrees for all feature work. Enforces worktree-based development (no git checkout -b), moves issues to In Progress, implements with tests, and auto-creates PRs when tests pass. Use when starting work on Linear tickets (PRA-XX), implementing features, or creating PRs for completed work.
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
---

# Linear Workflow Skill

Guided workflow for implementing Linear issues with feature branches and pull requests.

## Quick Reference

| State           | Action                              |
| --------------- | ----------------------------------- |
| **Inbox**       | Needs grooming (`/dev:groom-work`)  |
| **Backlog**     | Groomed, waiting for priority       |
| **Ready**       | Pick these up for development       |
| **In Progress** | Currently being worked on           |
| **Done**        | After PR is merged                  |

## When to Use This Skill

Invoke this skill when:

- User asks to work on a Linear issue (e.g., "work on PRA-19", "start PRA-35")
- User wants to pick up groomed issues from Linear backlog
- User needs to create a pull request for completed work
- User wants to merge a PR and close the associated issue
- User mentions Linear issue keys or asks about workflow steps

**Activation keywords**: work on PRA-, start issue, Linear ticket, create PR, close issue

## Core Workflow

### 1. Issue Selection

```bash
# Get issue details
pnpm --filter @repo/scripts linear issues get --issue PRA-19

# Verify issue is in Ready state (not Inbox or Backlog)
# Move to In Progress
pnpm --filter @repo/scripts linear issues start --issue PRA-19
```

### 2. Create Worktree

This repository requires worktrees for all feature work. Standard branching with `git checkout -b` is not supported.

```bash
pnpm worktree:create PRA-19 feat short-description
cd .worktrees/feat-pra-19-short-description
```

See **git-worktrees** skill for complete setup.

### 3. Implement

1. Create todo list for implementation steps
2. Break work into logical, testable units
3. Commit frequently with proper format
4. Run tests after significant changes

### 4. Commit Format

```text
PRA-19: Brief summary

Detailed description of changes.

Key changes:
- Bullet point 1
- Bullet point 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 5. Create PR (Automatic)

**When tests pass, automatically create PR. Don't ask user.**

```bash
git push -u origin HEAD

gh pr create --base main --title "PRA-19: Title" --body "$(cat <<'EOF'
## Summary
Brief overview of changes.

## Changes
- Change 1
- Change 2

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass

Closes PRA-19

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 6. Merge PR

**Only when user explicitly confirms:**

```bash
gh pr merge <PR_NUMBER> --squash --delete-branch
pnpm --filter @repo/scripts linear issues close --issue PRA-19
```

## Implementation Checklist

When implementation is complete:

1. ✅ All ticket requirements implemented
2. ✅ All tests passing
3. [ ] Verify you're in a worktree (not main)
4. [ ] Commit all changes
5. [ ] Push branch
6. [ ] Create PR against main
7. [ ] Return PR URL to user

**Important**: Implementation is NOT complete until PR is open.

## Constraints

### Never Do

- ❌ Commit directly to main
- ❌ Use `git checkout -b` (always worktrees)
- ❌ Create PR without running tests
- ❌ Skip worktree workflow
- ❌ Force push to shared branches

### Always Do

- ✅ Use git worktrees for feature work
- ✅ Run tests before creating PR
- ✅ Create PR against main
- ✅ Include issue key in commits and PR
- ✅ Auto-create PR when tests pass

## Example Session

```text
User: Work on PRA-19

Claude: [Fetches issue, moves to In Progress]
        [Creates worktree using git-worktrees skill]
        [Creates todo list]
        [Implements]
        [Tests pass]
        [Creates PR automatically]

        ✅ PR created: https://github.com/org/repo/pull/123
```

## Related Skills

- **git-worktrees**: Worktree creation and management
- **linear**: Linear CLI commands and issue operations
- **github-cli**: PR creation and GitHub operations
- **prisma-migrate**: Database migrations during feature development
- **debugging**: Troubleshooting issues during implementation
- **cicd**: Preview environment testing for PRs
- **application-environments**: Local development environment setup
