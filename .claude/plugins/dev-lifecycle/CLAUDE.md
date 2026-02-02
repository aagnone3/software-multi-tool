# Dev Lifecycle Plugin - Claude Instructions

This file provides Claude-specific guidance for using the dev-lifecycle plugin.

## Plugin Overview

The dev-lifecycle plugin provides complete development lifecycle orchestration for Linear-based workflows with git-worktrees, Prisma, and Supabase.

## Key Behaviors

### Always Use Worktrees

When working on any feature, bug, or chore:

- **NEVER** commit directly to main
- **ALWAYS** use the git-worktrees skill
- Each ticket gets its own isolated worktree

### Follow the Complete Workflow

The standard workflow is:

1. `/workflows:plan` - Research and groom the ticket
2. `/workflows:work` - Implement with proper branching
3. `/workflows:review` - Run multi-agent review
4. `/dev:pull-request` - Create/update PR
5. `/ci:resolve` - Fix any CI failures
6. `/dev:merge` - Merge after approval
7. `/workflows:compound` - Document learnings

### Use Research Agents First

Before implementing, use research agents:

- `dev-lifecycle:research:framework-docs` - Library documentation
- `dev-lifecycle:research:best-practices` - External patterns
- `dev-lifecycle:research:learnings` - Internal knowledge
- `dev-lifecycle:research:git-history` - Code evolution

### Run Reviews Before PRs

Before creating a PR, run `/workflows:review` to catch issues early with:

- TypeScript review
- Security scanning
- Performance analysis
- Architecture alignment
- Migration safety (if applicable)

## Command Quick Reference

| Command | Purpose |
|---------|---------|
| `/workflows:plan` | Groom tickets |
| `/workflows:work` | Implement tickets |
| `/workflows:auto-work` | Pick and work on highest priority |
| `/workflows:review` | Multi-agent code review |
| `/workflows:brainstorm` | Explore ideas |
| `/workflows:compound` | Document learnings |
| `/dev:pull-request` | Create/update PR |
| `/dev:merge` | Merge and close |
| `/dev:migrate-database` | Run migrations |
| `/dev:start-apps` | Start dev servers |
| `/dev:stop-apps` | Stop dev servers |
| `/dev:document` | Generate documentation |
| `/dev:report-bug` | Create bug ticket |
| `/ci:resolve` | Fix CI failures |
| `/skills:review` | Review skills |

## Agent Reference

### Research Agents

| Agent | When to Use |
|-------|-------------|
| `dev-lifecycle:research:framework-docs` | Need library/framework docs |
| `dev-lifecycle:research:best-practices` | Design decisions, patterns |
| `dev-lifecycle:research:git-history` | Understanding code evolution |
| `dev-lifecycle:research:learnings` | Finding past solutions |

### Review Agents

| Agent | When to Use |
|-------|-------------|
| `dev-lifecycle:review:typescript` | TypeScript code changes |
| `dev-lifecycle:review:security` | Auth, data handling, APIs |
| `dev-lifecycle:review:performance` | Data-heavy features, optimization |
| `dev-lifecycle:review:architecture` | Structural changes |
| `dev-lifecycle:review:migration` | Database migrations |

### Workflow Agents

| Agent | When to Use |
|-------|-------------|
| `dev-lifecycle:workflow:linear` | Linear ticket management |
| `dev-lifecycle:workflow:worktree` | Parallel development |
| `dev-lifecycle:workflow:ci` | CI monitoring and fixes |

## Integration with Existing Skills

This plugin references (does not duplicate):

- `git-worktrees` - Worktree creation
- `linear` - Linear API
- `linear-workflow` - Linear patterns
- `prisma-migrate` - Database migrations
- `github-cli` - GitHub operations
- `cicd` - CI/CD patterns
- `debugging` - Debug techniques

## Templates Location

Templates for common documents:

- `templates/linear-ticket.md` - Ticket formats
- `templates/pr-description.md` - PR formats
- `templates/review-report.md` - Review report format
- `templates/learnings-entry.md` - Learnings document format

## Best Practices

1. **Plan before implementing** - Use `/workflows:plan` to ensure clarity
2. **Research before coding** - Use research agents to gather context
3. **Review before committing** - Use review agents to catch issues early
4. **Document after completing** - Use `/workflows:compound` for learnings
5. **Keep worktrees clean** - Remove after merging
6. **Monitor CI actively** - Don't leave failing PRs
