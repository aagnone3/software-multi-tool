---
name: dev-lifecycle
description: Complete development lifecycle orchestration for Linear-based workflows. Use when working on Linear tickets, creating PRs, reviewing code, or coordinating parallel development with git worktrees.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Task
  - Edit
  - Write
---

# Dev Lifecycle Skill

Complete development lifecycle orchestration for Linear-based workflows with git-worktrees, Prisma, and Supabase.

## Quick Reference

### Workflow Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `/workflows:plan` | Research and groom a Linear ticket | Before starting work on a ticket |
| `/workflows:work` | Execute work on a Linear ticket | When ready to implement a ticket |
| `/workflows:auto-work` | Auto-pick highest priority ticket | When looking for next task |
| `/workflows:review` | Multi-agent code review | Before creating or merging PR |
| `/workflows:brainstorm` | Explore requirements | Early planning/ideation phase |
| `/workflows:compound` | Document learnings | After completing challenging work |

### Dev Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `/dev:pull-request` | Create/update a pull request | After completing implementation |
| `/dev:merge` | Merge PR and close Linear issue | After PR approval |
| `/dev:migrate-database` | Run Prisma migrations | When changing database schema |
| `/dev:start-apps` | Start dev servers | Beginning a work session |
| `/dev:stop-apps` | Stop dev servers | Ending a work session |
| `/dev:document` | Generate documentation | After significant changes |
| `/dev:report-bug` | Create bug ticket in Linear | When discovering issues |

### CI Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `/ci:resolve` | Diagnose and fix CI failures | When CI checks fail |

### Skills Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `/skills:review` | Review skills against best practices | Periodic skill maintenance |

## Workflow Overview

The dev-lifecycle plugin supports a complete development workflow:

```text
┌─────────────────────────────────────────────────────────────────┐
│                        PLAN PHASE                                │
├─────────────────────────────────────────────────────────────────┤
│  /workflows:brainstorm  →  /workflows:plan  →  Ticket Ready     │
│  (explore ideas)           (groom ticket)       (in Linear)     │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                        WORK PHASE                                │
├─────────────────────────────────────────────────────────────────┤
│  /workflows:work  →  /dev:start-apps  →  Implement  →  Test    │
│  (create worktree)    (start servers)     (write code)          │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                       REVIEW PHASE                               │
├─────────────────────────────────────────────────────────────────┤
│  /workflows:review  →  /dev:pull-request  →  /ci:resolve       │
│  (multi-agent review)   (create PR)          (fix CI issues)    │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                      COMPLETE PHASE                              │
├─────────────────────────────────────────────────────────────────┤
│  /dev:merge  →  /workflows:compound  →  /dev:document           │
│  (merge + close)  (capture learnings)   (update docs)           │
└─────────────────────────────────────────────────────────────────┘
```

## Available Agents

### Research Agents

| Agent | Purpose |
|-------|---------|
| `dev-lifecycle:research:framework-docs` | Fetch library/framework documentation |
| `dev-lifecycle:research:best-practices` | Gather external best practices |
| `dev-lifecycle:research:git-history` | Analyze code evolution |
| `dev-lifecycle:research:learnings` | Search internal knowledge base |

### Review Agents

| Agent | Purpose |
|-------|---------|
| `dev-lifecycle:review:typescript` | TypeScript code review |
| `dev-lifecycle:review:security` | Security vulnerability scanning |
| `dev-lifecycle:review:performance` | Performance analysis |
| `dev-lifecycle:review:architecture` | Architecture alignment |
| `dev-lifecycle:review:migration` | Prisma migration safety |

### Workflow Agents

| Agent | Purpose |
|-------|---------|
| `dev-lifecycle:workflow:linear` | Linear state management |
| `dev-lifecycle:workflow:worktree` | Parallel development coordination |
| `dev-lifecycle:workflow:ci` | CI monitoring and fixing |

## Skill Dependencies

This plugin references (does not duplicate):

- **git-worktrees**: Worktree creation and management
- **linear**: Linear API interaction
- **linear-workflow**: Linear workflow patterns
- **prisma-migrate**: Database migration workflow
- **github-cli**: GitHub CLI operations
- **cicd**: CI/CD patterns and troubleshooting
- **debugging**: Debug and troubleshooting techniques

## Related Skills

- **architecture**: Codebase structure and patterns
- **analytics**: PostHog and event tracking
- **better-auth**: Authentication implementation
- **feature-flags**: Feature flag management

## When to Use

Use this skill when:

1. **Starting a development session** - Pick a ticket and set up environment
2. **Implementing Linear tickets** - Follow the complete workflow
3. **Creating pull requests** - Ensure proper review and CI monitoring
4. **Coordinating parallel work** - Managing multiple worktrees
5. **Documenting learnings** - Capturing institutional knowledge
