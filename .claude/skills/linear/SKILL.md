---
name: linear
description: Use this skill when the user needs to interact with Linear for project management tasks including listing/managing projects, creating/listing milestones, managing issue dependencies, closing issues, or assigning issues to milestones. This skill wraps the Linear CLI helpers and provides comprehensive Linear workflow support.
allowed-tools:
  - Bash
---

# Linear Project Management Skill

This skill provides comprehensive Linear integration for managing projects, milestones, and issues using the existing Linear CLI helpers in this repository.

## Prerequisites

- `LINEAR_API_KEY` must be set in `apps/web/.env.local`
- The Linear CLI helpers are located at `tooling/scripts/src/linear/index.mjs`

## Linear State Convention

This repository uses the following state meanings:

| State | Meaning | Action |
| ----- | ------- | ------ |
| **Backlog** | Needs grooming - not ready for development | Use `/dev:groom-work` to groom |
| **Ready** | Groomed and ready for work | Developers can pick these up |
| **In Progress** | Currently being worked on | Set automatically via `issues start` |
| **Done** | Completed | Set via `issues close` after PR is merged |

> **Important:** Only start work on issues in **Ready** state.
> Issues in **Backlog** need grooming first before they can be worked on.

## Core Command Pattern

All Linear operations use this base command:

```bash
pnpm --filter @repo/scripts linear <resource> <action> [options]
```

## Available Operations

### Projects

#### List Projects

```bash
pnpm --filter @repo/scripts linear projects list [--query <text>]
```

- Lists all active projects
- Optional `--query` flag filters by name, slug, or ID
- Output: ID, SLUG, NAME columns

#### Create Project

```bash
pnpm --filter @repo/scripts linear projects create --name <text> [options]
```

- Creates a new project in Linear
- Required: `--name`
- Optional flags:
  - `--description <markdown>` - Project description
  - `--target <YYYY-MM-DD>` - Target completion date
  - `--color <hex>` - Project color (hex format)
- Returns: Project ID, slug, and URL

#### Create Project Dependency

```bash
pnpm --filter @repo/scripts linear projects dependency --blocked <ref> --blocking <ref>
```

- Links projects with a blocking dependency
- `<ref>` can be project ID, slug, or name
- Optional flags: `--anchor` (default: "end"), `--related-anchor` (default: "start"), `--type` (default: "dependency")

#### Remove Project Dependency

```bash
pnpm --filter @repo/scripts linear projects dependency --remove --id <relationId>
```

- Removes an existing project dependency by relation ID

### Milestones

#### List Milestones

```bash
pnpm --filter @repo/scripts linear milestones list --project <ref>
```

- Lists all milestones for a specific project
- `<ref>` can be project ID, slug, or name
- Output: milestone name, ID, and target date

#### Create Milestone

```bash
pnpm --filter @repo/scripts linear milestones create --project <ref> --name <text> [options]
```

- Creates a new milestone for a project
- Required: `--project` and `--name`
- Optional flags:
  - `--description <markdown>` - Milestone description
  - `--target <YYYY-MM-DD>` - Target completion date
  - `--sort <number>` - Sort order

### Issues

#### View Issue

```bash
pnpm --filter @repo/scripts linear issues view --issue <key>
```

- Displays full issue details including title, description, state, priority, team, project, assignee, and labels
- `<key>` is the issue identifier (e.g., PRA-35)
- Use this to understand what work needs to be done

#### Start Issue

```bash
pnpm --filter @repo/scripts linear issues start --issue <key>
```

- Moves an issue to "In Progress" status
- `<key>` is the issue identifier (e.g., PRA-10)
- Automatically called when beginning work on a ticket

#### Close Issue

```bash
pnpm --filter @repo/scripts linear issues close --issue <key>
```

- Marks an issue as Done
- `<key>` is the issue identifier (e.g., PRA-10)
- **ONLY use this AFTER the PR is merged**

#### Set Issue Milestone

```bash
pnpm --filter @repo/scripts linear issues set-milestone --issue <key> --project <ref> --milestone <ref>
```

- Assigns an issue to a project milestone
- `<key>` is the issue identifier
- `<ref>` for project and milestone can be ID or name

#### Create Issue Dependency

```bash
pnpm --filter @repo/scripts linear issues dependency --blocked <key> --blocking <key>
```

- Creates a blocking relationship between two issues
- `<key>` is the issue identifier (e.g., PRA-8, PRA-6)

### Views

#### List Issues from View

```bash
pnpm --filter @repo/scripts linear views list-issues --view <id|slug>
```

- Lists issues from a specific custom view
- `<id|slug>` can be the view's UUID or its slug (e.g., `ready-for-work-6ec4d06793a6`)
- Output: KEY, STATUS, PRIORITY, TITLE columns
- Useful for querying curated lists of work-ready issues

## Complete Development Workflow (MANDATORY)

**When working on a Linear issue, you MUST complete ALL steps. Work is NOT complete until the PR is merged.**

### Step 1: Start the Issue

```bash
pnpm --filter @repo/scripts linear issues start --issue <key>
```

- Moves the ticket to "In Progress"
- **Verify the command succeeds**

### Step 1.5: Create Worktree for Feature Branch

> **🚨 CRITICAL: NEVER commit directly to main branch 🚨**
>
> **🚨 MANDATORY: ALWAYS use git worktrees for feature work 🚨**

**Why worktrees are mandatory in this system:**

- Multiple Claude Code instances work on tickets in parallel
- Main branch stays pure and clean as a reference point
- Complete isolation between concurrent development efforts
- You (the user) can freely experiment on main without affecting agent work
- Zero interference between parallel tasks

**You MUST use the git-worktrees skill** to create an isolated worktree for your feature branch:

```text
Use Skill tool with skill: "git-worktrees"
```

The git-worktrees skill will handle:

- Creating worktree directory (`.worktrees/feat-pra-XX-...`)
- Setting up isolated environment with unique PORT
- Configuring `.env.local` for parallel development
- Running baseline verification tests
- Ensuring gitignore is configured correctly

**Branch naming conventions** (skill handles this):

- Bug fixes: `fix/pra-<issue>-<short-description>`
  - Example: `fix/pra-35-vercel-deployment`
- Features: `feat/pra-<issue>-<short-description>`
  - Example: `feat/pra-40-user-auth`
- Chores: `chore/pra-<issue>-<short-description>`
  - Example: `chore/pra-42-update-deps`

**DO NOT use `git checkout -b`** - this violates the parallel development architecture and prevents multiple agents from working simultaneously.

### Step 2: Create Complete Ready List

ALWAYS include these tasks:

- [ ] **Create feature branch (NOT main)**
- [ ] Implementation tasks (code, tests, documentation)
- [ ] Run test suite and verify all tests pass
- [ ] **Create git commit with changes**
- [ ] **Push changes to remote branch**
- [ ] **Create pull request**

**CRITICAL: Do NOT include "Close Linear issue" in the todo list. Issues are closed AFTER PR merge, not when PR is created.**

### Step 3: Implement Changes

- Write code following repository patterns
- Write comprehensive tests
- Update documentation if needed

### Step 4: Verify Tests Pass

```bash
pnpm test
```

- **DO NOT proceed until all tests pass**

### Step 5: Create Git Commit

> **CRITICAL: Verify you're in a worktree (NOT main branch) before committing**

```bash
# Verify branch first
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ]; then
  echo "❌ ERROR: Cannot commit to main! You must use a worktree."
  echo "Use the git-worktrees skill to create an isolated environment."
  exit 1
fi

# Now safe to commit
git add .
git commit -m "$(cat <<'EOF'
Brief description

Detailed explanation of changes.

Closes PRA-<key>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Step 6: Push to Remote

> **CRITICAL: Verify you're in a worktree (NOT main) before pushing**

```bash
# Verify you're on a feature branch (NOT main)
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ]; then
  echo "❌ ERROR: Cannot push main directly! You must use a worktree."
  exit 1
fi

# Push feature branch to remote
git push -u origin HEAD
```

### Step 7: Create Pull Request

```bash
# Create PR with explicit base and head branches
FEATURE_BRANCH=$(git branch --show-current)
gh pr create \
  --base main \
  --head "$FEATURE_BRANCH" \
  --title "Brief PR title" \
  --body "$(cat <<'EOF'
## Summary
- Bullet points summarizing changes

## Related Issue
Closes PRA-<key>

## Test Plan
- How to test the changes

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- **Capture and share the PR URL**

### ✅ Development Work Complete

**At this point, development is complete. The PR is ready for review.**

**CRITICAL: DO NOT close the Linear issue. It should remain "In Progress" until the PR is merged.**

---

## After PR is Merged (Separate Step)

Once the PR has been reviewed, approved, and merged to main:

### Step 8: Merge Pull Request

```bash
gh pr merge <pr-number> --squash
```

- Only after CI passes and PR is approved

### Step 9: Close Linear Issue

```bash
pnpm --filter @repo/scripts linear issues close --issue <key>
```

- **ONLY after PR is merged**
- Marks work as complete

## When to Use This Skill

Invoke this skill when:

- User mentions a Linear issue key (e.g., PRA-21, PRA-30)
- Working with Linear projects, milestones, or issues
- Starting work on a ticket
- Closing completed work (after PR merge)

## Automatic Workflow Integration

When working on a Linear issue, Claude Code MUST:

1. ✅ Move issue to "In Progress" with `issues start`
2. ✅ Create todo list (without "close issue" step)
3. ✅ Implement changes
4. ✅ Run and verify tests pass
5. ✅ Create git commit
6. ✅ Push to remote
7. ✅ Create pull request
8. ✅ Share PR URL

**Development is NOT complete until there is a PR URL.**

**NEVER close the Linear issue until the PR is merged.**
