---
description: Work on a Linear issue following the complete development workflow with proper task tracking, commits, PRs, and issue closure
---

# Work on Linear Issue

You are about to work on a Linear issue. You MUST follow the complete development workflow documented in `.claude/skills/linear/SKILL.md`.

## MANDATORY WORKFLOW STEPS

When working on ANY Linear issue, you MUST complete ALL of these steps in order:

### 1. Start the Linear Issue

- Move the ticket to "In Progress" using: `pnpm --filter @repo/scripts linear issues start --issue <key>`
- Verify the command succeeds - retry if it fails

### 1.5. Create Feature Branch

> **🚨 CRITICAL: NEVER commit directly to main branch 🚨**

Before making any changes, you MUST create a feature branch:

```bash
# Verify current branch
CURRENT_BRANCH=$(git branch --show-current)

# If on main, create and switch to feature branch
if [ "$CURRENT_BRANCH" = "main" ]; then
  git checkout -b <branch-name>
fi
```

**Branch naming conventions:**

- Bug fixes: `fix/pra-<issue>-<short-description>`
  - Example: `fix/pra-35-vercel-deployment`
- Features: `feat/pra-<issue>-<short-description>`
  - Example: `feat/pra-40-user-auth`
- Chores: `chore/pra-<issue>-<short-description>`
  - Example: `chore/pra-42-update-deps`

**MANDATORY VERIFICATION:**

```bash
# This MUST NOT output "main"
git branch --show-current
```

**Note:** A git pre-commit hook will automatically prevent commits to main, but you should create the branch proactively.

### 2. Create Complete Todo List

Use TodoWrite to create a comprehensive task list that MUST include:

- [ ] **Create feature branch (NOT main)**
- [ ] All implementation tasks (code, tests, documentation)
- [ ] Run test suite and verify all tests pass
- [ ] **Create git commit with changes**
- [ ] **Push changes to remote branch**
- [ ] **Create pull request**

**CRITICAL: DO NOT create a todo list without the git/PR steps. Work is NOT complete without a PR.**

**Note: Do NOT include "Close Linear issue" in the todo list. Issues should only be closed AFTER the PR is merged, not when it's created.**

### 3. Implement Changes

- Write code following repository patterns
- Write comprehensive tests
- Update documentation if needed

### 4. Verify All Tests Pass

- Run `pnpm test` for the full test suite
- Run specific tests as needed (e.g., `pnpm --filter web test`)
- Fix any failing tests
- **DO NOT proceed to commit until all tests pass**

### 5. Create Git Commit

> **CRITICAL: Verify you're NOT on main branch before committing**

Use the repository's commit message format from CLAUDE.md:

```bash
# Verify branch first
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ]; then
  echo "❌ ERROR: Cannot commit to main! Create a feature branch first."
  echo "Run: git checkout -b fix/pra-<issue>-<description>"
  exit 1
fi

# Now safe to commit
git add .
git commit -m "$(cat <<'EOF'
Brief description of changes

Detailed explanation of what was changed and why.

Closes PRA-<key>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 6. Push to Remote

> **CRITICAL: Verify you're on a feature branch before pushing**

```bash
# Verify you're on a feature branch (NOT main)
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ]; then
  echo "❌ ERROR: Cannot push main directly! You must use a feature branch."
  exit 1
fi

# Push feature branch to remote
git push -u origin HEAD
```

- Verify the push succeeds before proceeding

### 7. Create Pull Request

```bash
# Create PR with explicit base and head branches
FEATURE_BRANCH=$(git branch --show-current)
gh pr create \
  --base main \
  --head "$FEATURE_BRANCH" \
  --title "Brief PR title" \
  --body "$(cat <<'EOF'
## Summary
- Bullet points summarizing the changes
- Reference all relevant implementation details

## Related Issue
Closes PRA-<key>

## Test Plan
- Describe how to test the changes
- List any specific test commands run

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- **Capture and display the PR URL**
- **Share the PR URL with the user**

## ✅ DEVELOPMENT WORK COMPLETE

**Development work is complete when:**

1. All tests pass locally
2. Changes are committed
3. Changes are pushed to remote
4. Pull request is created and URL is available

**The PR URL marks the completion of development work.**

---

## After PR is Merged (Separate Workflow)

**IMPORTANT: Do NOT close the Linear issue yet!**

The Linear issue should remain "In Progress" until the PR has been:

- Reviewed
- Approved
- CI passes
- Merged to main

Once the PR is merged, THEN close the Linear issue:

### 8. Merge Pull Request (After Approval)

```bash
gh pr merge <pr-number> --squash
```

### 9. Close Linear Issue (After Merge)

```bash
pnpm --filter @repo/scripts linear issues close --issue <key>
```

- **ONLY do this AFTER the PR is merged**
- Verify the command succeeds

## Example Complete Workflow

```bash
# 1. Start the issue
pnpm --filter @repo/scripts linear issues start --issue PRA-25

# 1.5. Create feature branch (if not already done)
git checkout -b fix/pra-25-playwright-fixtures

# 2. [Create TodoWrite list with all steps]

# 3. [Implement changes]

# 4. Verify tests pass
pnpm test

# 5. Commit changes
git add .
git commit -m "Add Playwright shared fixtures and CI artifacts

Created reusable test fixtures and enhanced CI artifact collection
for better debugging and test maintenance.

Closes PRA-25

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 6. Push to remote (feature branch, NOT main)
git push -u origin HEAD

# 7. Create PR
gh pr create --base main --head fix/pra-25-playwright-fixtures --title "Add Playwright shared fixtures and CI artifacts" --body "..."
# Capture PR URL: https://github.com/org/repo/pull/123

# ========================================
# ✅ DEVELOPMENT WORK COMPLETE
# ========================================
# Share PR URL with user
# Linear issue remains "In Progress" until PR is merged

# ========================================
# AFTER PR IS MERGED (separate step)
# ========================================

# 8. Merge PR (after approval)
gh pr merge 123 --squash

# 9. Close Linear issue (only after merge)
pnpm --filter @repo/scripts linear issues close --issue PRA-25
```

Now proceed with the Linear issue following ALL steps above.
