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

### 1.5. Create Worktree for Feature Branch

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
- Features: `feat/pra-<issue>-<short-description>`
- Chores: `chore/pra-<issue>-<short-description>`

**DO NOT use `git checkout -b`** - this violates the parallel development architecture and prevents multiple agents from working simultaneously.

### 2. Create Complete Todo List

Use TodoWrite to create a comprehensive task list that MUST include:

- [ ] **Create feature branch (NOT main)**
- [ ] All implementation tasks (code, documentation)
- [ ] **Write tests for new functionality (unit/integration/e2e as required)**
- [ ] **Verify new tests pass and provide adequate coverage**
- [ ] **Run full test suite and verify all tests pass**
- [ ] **Create git commit with changes**
- [ ] **Push changes to remote branch**
- [ ] **Create pull request**

**CRITICAL: DO NOT create a todo list without test writing and the git/PR steps. Work is NOT complete without tests and a PR.**

**Note: Do NOT include "Close Linear issue" in the todo list. Issues should only be closed AFTER the PR is merged, not when it's created.**

### 3. Implement Changes

- Write code following repository patterns
- Update documentation if needed

### 3.5. Write Tests for New Functionality

> **🚨 MANDATORY: All new functionality must have test coverage 🚨**

**Before proceeding, you MUST write tests that validate the new functionality:**

1. **Identify what needs testing** (from ticket's Test Requirements section):
   - What new functions/components were added?
   - What behavior changed?
   - What edge cases exist?

2. **Write appropriate test types**:
   - **Unit tests**: Individual functions/components (e.g., `content-extractor.test.ts`)
   - **Integration tests**: Module interactions (e.g., `processor.test.ts` testing Claude API calls)
   - **E2E tests**: User flows (e.g., Playwright tests for UI workflows)

3. **Cover key scenarios**:
   - Happy path (normal usage)
   - Edge cases (empty inputs, boundaries)
   - Error handling (invalid data, network failures)
   - Integration points (API calls, database queries)

4. **Follow repository test patterns**:

   ```bash
   # Check existing tests for patterns
   find . -name "*.test.ts" -o -name "*.test.tsx" | head -5

   # Look at similar test files
   cat path/to/similar.test.ts
   ```

**Example test structure:**

```typescript
// packages/api/modules/news-analyzer/lib/content-extractor.test.ts
import { describe, it, expect } from 'vitest';
import { extractContentFromUrl, extractContentFromText } from './content-extractor';

describe('content-extractor', () => {
  describe('extractContentFromUrl', () => {
    it('should extract article content from valid URL', async () => {
      // Test implementation
    });

    it('should handle paywall errors gracefully', async () => {
      // Test error handling
    });

    it('should timeout after 15 seconds', async () => {
      // Test timeout behavior
    });
  });

  describe('extractContentFromText', () => {
    it('should extract content from plain text', async () => {
      // Test implementation
    });
  });
});
```

**CRITICAL:** Do not proceed to step 4 until you have written tests.

### 4. Verify All Tests Pass (Including New Tests)

> **🚨 MANDATORY: Verify NEW tests were written AND all tests pass 🚨**

#### Step 4a: Confirm new tests exist

```bash
# List test files you created
git status | grep "test\."

# If no test files appear, STOP and write tests first
```

#### Step 4b: Run new tests individually

```bash
# Run your new test file to verify it works
pnpm test path/to/your.test.ts

# Verify tests cover the new functionality
# - Do tests fail when you comment out your implementation?
# - Do tests pass with your implementation?
```

#### Step 4c: Run full test suite

```bash
# Run all tests
pnpm test

# Run workspace-specific tests
pnpm --filter @repo/api test
pnpm --filter web test

# Run integration tests (requires Docker)
pnpm --filter @repo/database run test:integration
```

#### Step 4d: Fix any failing tests

- If existing tests fail, your changes may have broken something
- If new tests fail, fix your implementation
- **DO NOT proceed to commit until all tests pass**

**CRITICAL:** Work is NOT complete without:

- ✅ New tests written for new functionality
- ✅ New tests passing
- ✅ All existing tests still passing

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

- **Capture the PR number from the URL** (e.g., `35` from `https://github.com/org/repo/pull/35`)
- **DO NOT stop here - CI monitoring is mandatory**

### 7.5. Monitor CI and Fix Failures

> **🚨 MANDATORY: Always monitor CI after PR creation 🚨**

**NEVER skip this step.** CI failures must be detected and fixed before work is complete.

```bash
# Extract PR number from URL
PR_NUMBER=<number>  # e.g., 35

# Wait for CI to start (GitHub needs time to trigger workflows)
echo "⏳ Waiting for CI checks to start..."
sleep 30

# Monitor CI status
echo "🔍 Monitoring CI checks..."
CHECKS=$(gh pr checks $PR_NUMBER --json bucket,state,name,workflow)

# Check for failures
FAILURES=$(echo "$CHECKS" | jq '[.[] | select(.bucket == "fail")] | length')
PENDING=$(echo "$CHECKS" | jq '[.[] | select(.bucket == "pending")] | length')

if [ "$FAILURES" -gt 0 ]; then
  echo "❌ CI failures detected!"
  echo "$CHECKS" | jq -r '.[] | select(.bucket == "fail") | "  - \(.name) in \(.workflow): \(.state)"'

  # Get the failed workflow run
  BRANCH=$(git branch --show-current)
  RUN_ID=$(gh run list --branch "$BRANCH" --limit 1 --json databaseId --jq '.[0].databaseId')

  # Fetch and analyze logs
  echo "📋 Fetching failure logs..."
  gh run view $RUN_ID --log-failed > /tmp/ci-failure.log

  # Analyze the failure and fix if possible
  # (Implementation continues below)
fi
```

**Common CI Failures and How to Fix:**

1. **Integration test failures (missing API key)**
   - Error: `ANTHROPIC_API_KEY is not set in CI environment`
   - Decision: If the tests can skip gracefully, update them to skip in CI with warnings
   - If tests must run: Inform user to add secret to GitHub Actions

2. **Type errors**
   - Error: TypeScript compilation failures
   - Fix: Run `pnpm type-check` locally, fix errors, commit and push
   - Resume monitoring

3. **Linting failures**
   - Error: Biome/ESLint violations
   - Fix: Run `pnpm lint --write`, commit formatted code, push
   - Resume monitoring

4. **Test failures**
   - Error: Unit/integration test failures
   - Fix: Run `pnpm test`, fix failing tests, commit and push
   - Resume monitoring

5. **Build failures**
   - Error: Build process fails
   - Fix: Run `pnpm build`, fix errors, commit and push
   - Resume monitoring

**Monitoring Loop Pattern:**

```bash
# Monitor until all checks pass or timeout
MAX_ATTEMPTS=20  # 10 minutes with 30s intervals
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  CHECKS=$(gh pr checks $PR_NUMBER --json bucket,state,name,workflow)
  FAILURES=$(echo "$CHECKS" | jq '[.[] | select(.bucket == "fail")] | length')
  PENDING=$(echo "$CHECKS" | jq '[.[] | select(.bucket == "pending")] | length')

  if [ "$FAILURES" -gt 0 ]; then
    echo "❌ CI failure detected - analyzing and fixing..."
    # Fetch logs, identify issue, fix, push, continue
    break
  elif [ "$PENDING" -eq 0 ]; then
    echo "✅ All CI checks passed!"
    break
  else
    echo "⏳ CI in progress ($PENDING pending)... check $((ATTEMPT + 1))/$MAX_ATTEMPTS"
    sleep 30
    ATTEMPT=$((ATTEMPT + 1))
  fi
done
```

**Actions to Take:**

1. **If all checks pass:** Report success to user and proceed to "DEVELOPMENT WORK COMPLETE"
2. **If failures can be fixed:** Analyze logs, fix issue, commit, push, resume monitoring
3. **If failures require manual intervention:** Report to user with logs and stop

**CRITICAL:** Do not mark work as complete until either:

- All CI checks pass ✅
- OR you've reported failures you cannot fix to the user and await guidance

## ✅ DEVELOPMENT WORK COMPLETE

**Development work is complete when:**

1. All tests pass locally
2. Changes are committed
3. Changes are pushed to remote
4. Pull request is created
5. **CI checks are monitored**
6. **CI checks all pass OR unfixable failures are reported to user**

**Work is NOT complete until CI is green or user is informed of issues.**

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

# 1.5. Create worktree using git-worktrees skill (MANDATORY)
# Use Skill tool with skill: "git-worktrees"
# This creates .worktrees/fix-pra-25-playwright-fixtures/ with isolated environment

# 2. [Create TodoWrite list with all steps]

# 3. [Navigate to worktree and implement changes]
cd .worktrees/fix-pra-25-playwright-fixtures

# 4. Verify tests pass
pnpm test

# 5. Commit changes
git add .
git commit -m "Add Playwright shared fixtures and CI artifacts

Created reusable test fixtures and enhanced CI artifact collection
for better debugging and test maintenance.

Closes PRA-25

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 6. Push to remote
git push -u origin HEAD

# 7. Create PR
PR_URL=$(gh pr create --base main --head fix/pra-25-playwright-fixtures --title "Add Playwright shared fixtures and CI artifacts" --body "...")
# Example: https://github.com/org/repo/pull/123
PR_NUMBER=$(echo "$PR_URL" | grep -oE '[0-9]+$')

# 7.5. Monitor CI (MANDATORY - DO NOT SKIP)
echo "⏳ Waiting for CI checks to start..."
sleep 30

# Monitor loop
MAX_ATTEMPTS=20
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  CHECKS=$(gh pr checks $PR_NUMBER --json bucket,state,name)
  FAILURES=$(echo "$CHECKS" | jq '[.[] | select(.bucket == "fail")] | length')
  PENDING=$(echo "$CHECKS" | jq '[.[] | select(.bucket == "pending")] | length')

  if [ "$FAILURES" -gt 0 ]; then
    echo "❌ CI failures detected - fetching logs..."
    BRANCH=$(git branch --show-current)
    RUN_ID=$(gh run list --branch "$BRANCH" --limit 1 --json databaseId --jq '.[0].databaseId')
    gh run view $RUN_ID --log-failed
    # Analyze, fix, push, resume monitoring
    break
  elif [ "$PENDING" -eq 0 ]; then
    echo "✅ All CI checks passed!"
    break
  else
    echo "⏳ CI in progress ($PENDING pending)... check $((ATTEMPT + 1))/$MAX_ATTEMPTS"
    sleep 30
    ATTEMPT=$((ATTEMPT + 1))
  fi
done

# ========================================
# ✅ DEVELOPMENT WORK COMPLETE
# ========================================
# Only reached after CI passes or failures are addressed
# Share PR URL with user
# Linear issue remains "In Progress" until PR is merged
# Worktree stays active for any follow-up changes

# ========================================
# AFTER PR IS MERGED (separate step)
# ========================================

# 8. Merge PR (after approval)
gh pr merge 123 --squash

# 9. Close Linear issue (only after merge)
pnpm --filter @repo/scripts linear issues close --issue PRA-25

# 10. Clean up worktree (after merge and closure)
cd ../..  # Return to main repo
git worktree remove .worktrees/fix-pra-25-playwright-fixtures
git worktree prune
```

Now proceed with the Linear issue following ALL steps above.
