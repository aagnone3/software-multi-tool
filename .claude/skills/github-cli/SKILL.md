---
name: managing-github-cli
description: GitHub CLI workflows for PRs, issues, and repository operations with account switching (aagnone3), authentication troubleshooting, and API access. Requires aagnone3 account for all operations (gh auth switch -u aagnone3). Use when creating pull requests, managing issues, or switching GitHub accounts.
allowed-tools:
  - Bash
  - Read
  - Grep
---

# GitHub CLI

**Critical requirement**: Always use the `aagnone3` GitHub account for all operations — aagnone3 organization repositories are only accessible through this account.

## Core Requirements

### Account Management

**CRITICAL:** Before ANY GitHub CLI or API operation, ensure the aagnone3 account is active.

#### Checking Active Account

Always check which account is currently active before performing GitHub operations:

```bash
gh auth status
```

Look for the line that says `- Active account: true` to identify which account is currently active.

#### Switching to aagnone3 Account

If the active account is not aagnone3, switch to it:

```bash
gh auth switch -u aagnone3
```

Verify the switch succeeded by running `gh auth status` again.

#### Available Accounts

This system may have multiple GitHub accounts configured. Use:

- `aagnone3` - **USE THIS ACCOUNT** (has access to aagnone3 repositories)

### Repository Information

- **Organization:** `aagnone3`
- **Repository:** `software-multi-tool`
- **Remote URL:** `git@github.com:aagnone3/software-multi-tool.git`

## Quick Reference

| Task | Command |
| ---- | ------- |
| Check active account | `gh auth status` |
| Switch to aagnone3 | `gh auth switch -u aagnone3` |
| Verify repo access | `gh repo view aagnone3/software-multi-tool` |
| Standard pre-flight | `gh auth status && gh <command>` |

## When to Use This Skill

Invoke this skill when:

- Creating or managing pull requests
- Working with GitHub issues
- Using the GitHub API
- Switching between GitHub accounts
- Troubleshooting GitHub CLI authentication

**Activation keywords**: GitHub, pull request, PR, issue, gh cli, github api

## Common Workflows

### Creating Pull Requests

**Always check account first**, then create the PR:

```bash
# 1. Verify correct account
gh auth status

# 2. Switch if needed
gh auth switch -u aagnone3

# 3. Create PR
gh pr create --title "Your PR Title" --body "$(cat <<'EOF'
## Summary
- Brief description of changes

## Related Issue
Closes ISSUE-123

## Test Plan
- How changes were tested

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Alternative:** Create PR with explicit repo flag:

```bash
gh pr create --repo aagnone3/software-multi-tool --title "Title" --body "Body"
```

### Viewing Pull Requests

```bash
# List open PRs
gh pr list

# View specific PR
gh pr view <PR-NUMBER>

# View PR in browser
gh pr view <PR-NUMBER> --web
```

### Merging Pull Requests

```bash
# Merge with squash (preferred)
gh pr merge <PR-NUMBER> --squash

# Merge with merge commit
gh pr merge <PR-NUMBER> --merge

# Merge with rebase
gh pr merge <PR-NUMBER> --rebase
```

### Managing Issues

```bash
# List issues
gh issue list

# View specific issue
gh issue view <ISSUE-NUMBER>

# Create issue
gh issue create --title "Title" --body "Description"

# Close issue
gh issue close <ISSUE-NUMBER>
```

### Using GitHub API

The GitHub CLI can make raw API calls:

```bash
# Get current user
gh api user

# List repositories for user
gh api users/aagnone3/repos

# Get repository details
gh api repos/aagnone3/software-multi-tool

# List pull requests
gh api repos/aagnone3/software-multi-tool/pulls

# Get PR comments
gh api repos/aagnone3/software-multi-tool/pulls/<PR-NUMBER>/comments
```

## Troubleshooting

### "Could not resolve to a Repository" Error

**Symptom:**

```text
GraphQL: Could not resolve to a Repository with the name 'aagnone3/software-multi-tool'. (repository)
```

**Cause:** Wrong GitHub account is active

**Solution:**

```bash
gh auth switch -u aagnone3
```

Then retry the operation.

### Authentication Issues

If switching accounts doesn't work:

```bash
# Check all configured accounts
gh auth status

# Re-authenticate if needed
gh auth login
```

### Repository Not Found

If the repository truly doesn't exist or has been renamed:

1. Check the actual repository name on GitHub
2. Update git remote if needed:

   ```bash
   git remote set-url origin git@github.com:aagnone3/<NEW-REPO-NAME>.git
   ```

## Best Practices

### Before Every GitHub Operation

Create a pre-flight checklist:

1. **Verify account:** `gh auth status` - confirm aagnone3 is active
2. **Switch if needed:** `gh auth switch -u aagnone3`
3. **Execute operation:** Run the intended `gh` command
4. **Verify success:** Check command output for errors

### Error Handling

If a GitHub CLI command fails:

1. Check the error message carefully
2. Verify aagnone3 account is active
3. Confirm repository name and organization
4. Check network connectivity
5. Verify GitHub API status if needed

### Manual Fallback

If the GitHub CLI persistently fails, provide the user with the manual URL:

- **Create PR:** `https://github.com/aagnone3/software-multi-tool/pull/new/<BRANCH-NAME>`
- **View repo:** `https://github.com/aagnone3/software-multi-tool`
- **View PRs:** `https://github.com/aagnone3/software-multi-tool/pulls`
- **View issues:** `https://github.com/aagnone3/software-multi-tool/issues`

## Related Skills

- **linear-workflow**: Creating PRs as part of Linear workflow
- **git-worktrees**: Creating PRs from worktree branches
- **cicd**: GitHub Actions and PR validation workflows
- **linear**: Closing Linear issues after PR merge
- **debugging**: Troubleshooting GitHub operations
