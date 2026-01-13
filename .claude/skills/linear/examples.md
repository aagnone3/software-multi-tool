# Linear CLI Examples

This file provides real-world examples of using the Linear CLI helpers for common project management workflows.

## Setup & Configuration

Before using any Linear commands, ensure `LINEAR_API_KEY` is configured:

```bash
# Check if LINEAR_API_KEY is set in apps/web/.env.local
grep LINEAR_API_KEY apps/web/.env.local
```

## Common Workflows

### 1. Starting a New Sprint

**Scenario**: You need to plan Sprint 5 for the "Mobile App Redesign" project.

```bash
# Step 1: Find the project ID
pnpm --filter @repo/scripts linear projects list --query "Mobile App"

# Step 2: Create the sprint milestone
pnpm --filter @repo/scripts linear milestones create \
  --project "Mobile App Redesign" \
  --name "Sprint 5" \
  --description "Focus on user authentication and profile screens" \
  --target "2025-11-15" \
  --sort 5

# Step 3: Assign issues to the sprint
pnpm --filter @repo/scripts linear issues set-milestone \
  --issue PRA-45 \
  --project "Mobile App Redesign" \
  --milestone "Sprint 5"

pnpm --filter @repo/scripts linear issues set-milestone \
  --issue PRA-46 \
  --project "Mobile App Redesign" \
  --milestone "Sprint 5"
```

### 2. Managing Issue Dependencies

**Scenario**: PRA-30 (frontend work) is blocked by PRA-28 (API endpoint creation).

```bash
# Create the blocking relationship
pnpm --filter @repo/scripts linear issues dependency \
  --blocked PRA-30 \
  --blocking PRA-28

# This indicates that PRA-30 cannot proceed until PRA-28 is complete
```

### 3. Setting Up Project Dependencies

**Scenario**: The "API Migration" project must complete before "Frontend Refactor" can start.

```bash
# Step 1: List projects to verify names
pnpm --filter @repo/scripts linear projects list

# Step 2: Create the project dependency
pnpm --filter @repo/scripts linear projects dependency \
  --blocked "Frontend Refactor" \
  --blocking "API Migration"

# Optional: Remove the dependency later if plans change
# pnpm --filter @repo/scripts linear projects dependency --remove --id <relationId>
```

### 4. Starting Work on Issues

**Scenario**: You're about to begin work on an issue and want to update its status to "In Progress".

> **Important:** Only start work on issues that are in **Ready** state (groomed and ready).
> Issues in **Backlog** need grooming first - use `/dev:groom-work` to groom them.

```bash
# Start work on an issue (moves to "In Progress")
# Note: Issue should already be in "Ready" state before starting
pnpm --filter @repo/scripts linear issues start --issue PRA-22

# Output: Moved PRA-22 (issue-id) to In Progress.
```

### 5. Complete Development Workflow (Start to PR)

**Scenario**: Full workflow from start to finish for an issue, including git operations and PR creation.

**This is the COMPLETE workflow you must follow for every Linear issue.**

```bash
# ========================================
# STEP 1: Start Issue
# ========================================

# Start working on PRA-30 (moves to "In Progress")
pnpm --filter @repo/scripts linear issues start --issue PRA-30

# ========================================
# STEP 2: Create Complete Todo List
# ========================================
# Use TodoWrite to create a list including:
# - [ ] Implement feature X
# - [ ] Write tests for feature X
# - [ ] Run test suite and verify all pass
# - [ ] Create git commit with changes
# - [ ] Push changes to remote branch
# - [ ] Create pull request
#
# CRITICAL: Do NOT include "Close Linear issue" in the todo list!
# Issues are closed AFTER the PR is merged.

# ========================================
# STEP 3: Do Development Work
# ========================================

# Write your code...
# Write your tests...

# ========================================
# STEP 4: Verify Tests Pass
# ========================================

pnpm test
# All tests must pass before proceeding!

# ========================================
# STEP 5: Create Git Commit
# ========================================

git add .
git commit -m "Add feature X for user authentication

Implemented JWT-based authentication with refresh tokens.
Added comprehensive test coverage.

Closes PRA-30

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# ========================================
# STEP 6: Push to Remote
# ========================================

git push origin HEAD

# ========================================
# STEP 7: Create Pull Request
# ========================================

gh pr create --title "PRA-30: Add JWT authentication" --body "$(cat <<'EOF'
## Summary
- Implemented JWT-based authentication
- Added refresh token support
- Added comprehensive test coverage (15 new tests)

## Related Issue
Closes PRA-30

## Test Plan
1. Run `pnpm test` to verify all tests pass
2. Test login flow with valid credentials
3. Test refresh token rotation
4. Verify authentication errors are handled correctly

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

# Capture the PR URL from the output (e.g., https://github.com/org/repo/pull/123)

# ========================================
# ✅ DEVELOPMENT WORK COMPLETE
# ========================================
# You now have a PR URL to share: https://github.com/org/repo/pull/123
# The Linear issue should remain "In Progress" until the PR is merged.

# ========================================
# AFTER PR IS MERGED (Separate Workflow)
# ========================================
# Once the PR has been reviewed, approved, and merged:

# Merge the PR (only after approval and CI passing)
gh pr merge 123 --squash

# THEN close the Linear issue
pnpm --filter @repo/scripts linear issues close --issue PRA-30

# ========================================
# ✅ FULL WORKFLOW COMPLETE
# ========================================
```

**Key Points:**

- **Do NOT stop after tests pass** - you must commit, push, and create a PR
- **Always reference the Linear issue** in both commit message and PR description
- **Verify each command succeeds** before moving to the next step
- **Development work is complete when you have a PR URL**, not before
- **CRITICAL: Do NOT close the Linear issue until AFTER the PR is merged**

### 6. Closing Completed Work

**Scenario**: You've finished working on several issues and PRs are merged. Now mark them as Done.

```bash
# Close individual issues (ONLY after PRs are merged)
pnpm --filter @repo/scripts linear issues close --issue PRA-22
pnpm --filter @repo/scripts linear issues close --issue PRA-23
pnpm --filter @repo/scripts linear issues close --issue PRA-24
```

### 7. Quarterly Release Planning

**Scenario**: Planning Q1 2025 release with multiple milestones.

```bash
# Create milestone for the entire quarter
pnpm --filter @repo/scripts linear milestones create \
  --project "Platform" \
  --name "Q1 2025 Release" \
  --description "## Goals\n- Performance improvements\n- New dashboard features\n- Mobile responsiveness" \
  --target "2025-03-31"

# Create sub-milestones for each month
pnpm --filter @repo/scripts linear milestones create \
  --project "Platform" \
  --name "January Deliverables" \
  --target "2025-01-31" \
  --sort 1

pnpm --filter @repo/scripts linear milestones create \
  --project "Platform" \
  --name "February Deliverables" \
  --target "2025-02-28" \
  --sort 2

pnpm --filter @repo/scripts linear milestones create \
  --project "Platform" \
  --name "March Deliverables" \
  --target "2025-03-31" \
  --sort 3
```

## Tips

1. **Use quotes** for multi-word names: `--project "My Project Name"`
2. **Reference flexibility**: Most commands accept ID, slug, or name
3. **Markdown support**: The `--description` flag supports markdown formatting
4. **Date format**: Always use `YYYY-MM-DD` for dates
5. **Sort order**: Lower numbers appear first when sorting milestones
6. **Environment loading**: All commands auto-load from `apps/web/.env.local`
7. **NEVER close Linear issues before PRs are merged**
