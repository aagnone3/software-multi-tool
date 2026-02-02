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

**If on main branch with uncommitted changes**, automatically create a worktree:

1. Analyze the uncommitted changes to determine an appropriate branch name
2. **Use the git-worktrees skill** to create an isolated worktree:

   ```bash
   Use Skill tool with skill: "git-worktrees"
   ```

**Branch naming examples based on changes:**

- Renamed command files → `chore/rename-commands`
- Added new API endpoint → `feat/add-user-api`
- Fixed validation bug → `fix/form-validation`
- Updated dependencies → `chore/update-deps`

**If on main with no changes**, inform the user there's nothing to do.

**IMPORTANT:** This system mandates worktrees for all feature work. Do NOT use `git checkout -b`.

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

### Step 1.5: Verify Tests Exist for New Functionality

> **MANDATORY: New functionality requires test coverage**

Before creating commits, verify that tests were written:

```bash
git status | grep "test\."
git diff --name-only | grep "test\."
```

**If no test files exist and you added new functionality:**

1. **STOP** - Do not proceed with commits
2. Write tests for the new functionality
3. Run tests to verify they pass: `pnpm test`
4. Then return to Step 2

### Step 2: Organize and Create Commits

Use AI judgment to group related changes into logical commits:

**Grouping criteria (in order of priority):**

1. **By nature of change**: Separate refactors from features from fixes
2. **By area of codebase**: Group related files together
3. **By file type**: Tests separate from implementation

**Commit message format:**

```text
<type>: <brief description>

<detailed explanation if needed>

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Valid types:** `feat`, `fix`, `chore`, `test`, `docs`, `refactor`, `style`

### Step 2.5: Verify All Tests Pass

Before pushing, verify the full test suite passes:

```bash
pnpm test
```

**CRITICAL:** Only proceed if all tests pass.

### Step 3: Push to Remote

```bash
git push -u origin HEAD
```

If the push fails due to upstream changes:

```bash
git pull --rebase origin <branch-name>
```

### Step 4: Create or Update Pull Request

Check if a PR already exists:

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

```text
📍 Currently on main branch with uncommitted changes
📝 Analyzing changes to determine branch name...

Creating worktree for branch: chore/rename-commands...
  ✅ Using git-worktrees skill
  ✅ Created worktree: .worktrees/chore-rename-commands/

Moving to worktree and creating commits...
  ✅ chore: rename commands and update references (4 files)

Pushing to remote...
  ✅ Pushed 1 commit to origin/chore/rename-commands

Creating pull request...
  ✅ PR created: https://github.com/org/repo/pull/125
```

### Scenario B: On feature branch with uncommitted changes, no PR

```text
📝 Found uncommitted changes:
  - 3 modified files
  - 1 new file

Creating commits...
  ✅ feat: add user profile page (2 files)
  ✅ test: add profile page tests (1 file)

Pushing to remote...
  ✅ Pushed 2 commits to origin/feat/pra-45-profile

Creating pull request...
  ✅ PR created: https://github.com/org/repo/pull/124
```

## Notes

- This command is **Linear-agnostic** - it doesn't require or interact with Linear issues
- Use `/workflows:work` for the full workflow including Linear integration
- The command is **idempotent** - safe to run multiple times
- Uses **standard git operations** - no force pushes or destructive actions

---
Context: $ARGUMENTS
