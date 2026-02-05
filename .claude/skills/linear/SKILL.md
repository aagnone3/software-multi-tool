---
name: managing-linear
description: Manages Linear project tasks including listing projects, creating milestones, managing dependencies, starting issues, and closing completed work. Use when mentioning Linear issue keys (PRA-XX), managing projects/milestones, or working on tickets.
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
| **Inbox** | New ticket (drop zone) | Use `/dev:groom-work` to groom |
| **Backlog** | Groomed, not immediately ready | Wait for dependencies/priority, then move to Ready |
| **Ready** | Groomed and ready for work | Developers can pick these up |
| **In Progress** | Currently being worked on | Set automatically via `issues start` |
| **Done** | Completed | Set via `issues close` after PR is merged |

**Grooming Flow:** `Inbox → (groom) → Backlog OR Ready`

> **Important:** Only start work on issues in **Ready** state.
>
> - Issues in **Inbox** need grooming first - use `/dev:groom-work`.
> - Issues in **Backlog** are groomed but waiting - move them to Ready when they're workable.

## Core Command Pattern

All Linear operations use this base command:

```bash
pnpm --filter @repo/scripts linear <resource> <action> [options]
```

## When to Use This Skill

Use this skill when:

- User mentions a Linear issue key (e.g., PRA-21, PRA-30)
- Working with Linear projects, milestones, or issues
- Starting work on an issue
- Closing completed work (after PR merge)
- Managing project dependencies and milestones

**Activation keywords**: Linear, PRA-, issue, project, milestone, dependency, close issue

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

## Complete Development Workflow

**When working on a Linear issue, use the linear-workflow skill for the complete step-by-step process.**

### Quick Workflow Overview

1. **Start issue**: `pnpm --filter @repo/scripts linear issues start --issue <key>`
2. **Create worktree** (see **git-worktrees** skill) - MANDATORY for all feature work
3. **Implement changes** - Code, tests, documentation
4. **Run tests** - Verify all tests pass
5. **Create commit and PR** (see **linear-workflow** skill for detailed guidance)
6. **After PR merge**: Close issue with `pnpm --filter @repo/scripts linear issues close --issue <key>`

**For complete workflow details including todo list patterns, commit messages, PR creation, and worktree setup, invoke the linear-workflow skill.**

**CRITICAL REMINDERS:**
- NEVER commit directly to main - always use worktrees
- DO NOT close the Linear issue until PR is merged
- Work is NOT complete until there is a PR URL
