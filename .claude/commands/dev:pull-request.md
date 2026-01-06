---
description: Create or update a pull request from local changes with organized commits
---

# Create/Update Pull Request

Create or update a pull request from the current working branch. Any uncommitted changes will be organized into logical commits before pushing.

## Prerequisites Check

Before proceeding, check the current branch:

```bash
CURRENT_BRANCH=$(git branch --show-current)
```

**If on main branch with uncommitted changes**, automatically create a feature branch:

1. Analyze the uncommitted changes to determine an appropriate branch name
2. Use the naming convention from CLAUDE.md:
   - `fix/` for bug fixes
   - `feat/` for new features
   - `chore/` for maintenance tasks
   - `docs/` for documentation
   - `refactor/` for refactoring
3. Create and switch to the new branch:
   ```bash
   git checkout -b <type>/<short-description>
   ```

**Branch naming examples based on changes:**
- Renamed command files → `chore/rename-commands`
- Added new API endpoint → `feat/add-user-api`
- Fixed validation bug → `fix/form-validation`
- Updated dependencies → `chore/update-deps`

**If on main with no changes**, inform the user there's nothing to do.

## Workflow

### Step 1: Analyze Working Directory

Check the current state of the repository:

```bash
git status --porcelain
```

Categorize changes into:
- **Staged**: Ready to commit
- **Unstaged**: Modified but not staged
- **Untracked**: New files not yet tracked

If no uncommitted changes exist, skip to Step 3.

### Step 2: Organize and Create Commits

Use AI judgment to group related changes into logical commits:

**Grouping criteria (in order of priority):**
1. **By nature of change**: Separate refactors from features from fixes
2. **By area of codebase**: Group related files together
3. **By file type**: Tests separate from implementation, config separate from code

**Commit message format:**
```
<type>: <brief description>

<detailed explanation if needed>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Valid types:** `feat`, `fix`, `chore`, `test`, `docs`, `refactor`, `style`

**Example commit sequence:**
```bash
# Commit 1: Implementation changes
git add src/components/Button.tsx src/components/Button.test.tsx
git commit -m "feat: add loading state to Button component

Added isLoading prop with spinner animation.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Commit 2: Config changes
git add package.json pnpm-lock.yaml
git commit -m "chore: add spinner animation dependency

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Step 3: Push to Remote

```bash
git push -u origin HEAD
```

If the push fails due to upstream changes, inform the user and suggest:
```bash
git pull --rebase origin <branch-name>
```

### Step 4: Create or Update Pull Request

Check if a PR already exists for this branch:

```bash
gh pr view --json number,url,state 2>/dev/null
```

**If no PR exists**, create one:

```bash
FEATURE_BRANCH=$(git branch --show-current)
gh pr create \
  --base main \
  --head "$FEATURE_BRANCH" \
  --title "Brief PR title" \
  --body "$(cat <<'EOF'
## Summary
- Bullet points summarizing the changes

## Test Plan
- How to test the changes

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**If PR already exists**, the push automatically updated it. Display the existing PR URL.

### Step 5: Report Results

Display to user:
- PR URL (new or existing)
- Number of commits created (if any)
- Summary of changes pushed

## Example Scenarios

### Scenario A: On main with uncommitted changes

```
📍 Currently on main branch with uncommitted changes
📝 Analyzing changes to determine branch name...
  - Renamed command files
  - Updated script reference

Creating feature branch...
  ✅ Created branch: chore/rename-commands

Creating commits...
  ✅ chore: rename commands and update references (4 files)

Pushing to remote...
  ✅ Pushed 1 commit to origin/chore/rename-commands

Creating pull request...
  ✅ PR created: https://github.com/org/repo/pull/125
```

### Scenario B: Clean working directory, PR exists

```
✅ Working directory is clean
✅ PR already exists: https://github.com/org/repo/pull/123
No changes to push.
```

### Scenario C: On feature branch with uncommitted changes, no PR

```
📝 Found uncommitted changes:
  - 3 modified files
  - 1 new file

Creating commits...
  ✅ feat: add user profile page (2 files)
  ✅ test: add profile page tests (1 file)
  ✅ chore: update navigation config (1 file)

Pushing to remote...
  ✅ Pushed 3 commits to origin/feat/pra-45-profile

Creating pull request...
  ✅ PR created: https://github.com/org/repo/pull/124
```

### Scenario D: On feature branch with uncommitted changes, PR exists

```
📝 Found uncommitted changes:
  - 2 modified files

Creating commits...
  ✅ fix: resolve edge case in form validation (2 files)

Pushing to remote...
  ✅ Pushed 1 commit to origin/fix/pra-42-validation

✅ PR updated: https://github.com/org/repo/pull/120
```

## Error Handling

### On main branch with no changes
```
ℹ️ On main branch with no uncommitted changes.
Nothing to create a PR for.
```

### Push rejected (upstream changes)
```
❌ Push failed - remote has changes not in local branch.
Please pull and rebase:
  git pull --rebase origin <branch-name>
Then run /dev:pull-request again.
```

### No GitHub CLI
```
❌ GitHub CLI (gh) not found or not authenticated.
Please install and authenticate:
  brew install gh
  gh auth login
```

## Notes

- This command is **Linear-agnostic** - it doesn't require or interact with Linear issues
- Use `/dev:work-on-ticket` for the full workflow including Linear integration
- The command is **idempotent** - safe to run multiple times
- Uses **standard git operations** - no force pushes or destructive actions

Context: $ARGUMENTS
