# Linear Workflow Skill

Guided workflow for implementing Linear issues using feature branches and pull requests.

## Quick Start

When you want to work on a Linear issue, simply say:

```text
work on {ISSUE-KEY}
```

Example:

```text
work on PRA-19
```

## What This Skill Does

1. **Fetches issue details** from Linear
2. **Moves issue to "In Progress"** automatically when work starts
3. **Creates a feature branch** following naming conventions
4. **Guides implementation** with todo tracking
5. **Ensures tests pass** before creating PRs
6. **Creates pull requests** with proper formatting
7. **Links work to Linear** automatically

## Branch Naming Convention

`{ISSUE-KEY}/{short-description}`

Examples:

- `PRA-19/seed-utilities`
- `PRA-24/playwright-scenarios`
- `PRA-21/hono-e2e-tests`

## Commit Message Format

```text
{ISSUE-KEY}: {Brief summary}

{Detailed description}

Key changes:
- Change 1
- Change 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Pull Request Format

```markdown
{ISSUE-KEY}: {Title}

## Summary
{Brief overview}

## Changes
- {Change 1}
- {Change 2}

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Related
Closes {ISSUE-KEY}

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Workflow Steps

### 1. Issue Selection

- Get issue details from Linear
- Verify issue is not blocked
- **Move issue to "In Progress"** automatically
- Understand requirements

### 2. Branch Creation

- Check git status
- Ensure clean working directory
- Create feature branch from main

### 3. Implementation

- Create todo list (including status update)
- Implement incrementally
- Commit frequently
- Run tests after changes

### 4. Pre-PR Checks

- All tests pass
- Code is linted
- Types check
- Working directory is clean

### 5. Pull Request

- Push branch to remote
- Create PR with gh cli
- Link to Linear issue
- Return PR URL

### 6. Merging (when ready)

- User confirms PR is ready to merge
- Merge with squash (`--squash`)
- Delete feature branch automatically
- Close Linear issue (verify auto-close or manually close)
- Update local main branch

**Note:** Issue status flow is: **Backlog → Ready → In Progress → Done**

## Linear State Meanings

| State | Meaning | Action |
| ----- | ------- | ------ |
| Backlog | Needs grooming - not ready for work | Use `/dev:groom-work` to groom |
| Ready | Groomed and ready for development | Developers can pick these up |
| In Progress | Currently being worked on | Set automatically when work starts |
| Done | Completed (after PR merged) | Set after PR is merged |

> **Important:** Only work on issues in **Ready** state. Issues in **Backlog** need grooming first.

## Important Rules

### Always

- ✅ Work on a feature branch from main
- ✅ Create PR against main (`--base main`)
- ✅ Include issue key in commits
- ✅ Run tests before creating PR
- ✅ Write descriptive commit messages
- ✅ Open PR for code review

### Never

- ❌ Commit directly to main
- ❌ Skip running tests
- ❌ Force push to shared branches
- ❌ Create PR with failing tests
- ❌ Consider code "ready" without an open PR

**Remember:** Code is NOT ready for review until there is an open pull request against `main`.

## Tools Used

- **Linear CLI** - Issue management
- **Git** - Version control
- **GitHub CLI** (`gh`) - PR creation
- **pnpm** - Testing and building

## Files

- `SKILL.md` - Detailed workflow documentation
- `examples.md` - Example sessions and use cases
- `README.md` - This file (quick reference)
