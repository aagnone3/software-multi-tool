---
description: Work on a Linear issue following the complete development workflow with proper task tracking, commits, PRs, and issue closure
---

# Work on Linear Issue

Execute work on a Linear issue using the complete development workflow.

## MANDATORY WORKFLOW STEPS

When working on ANY Linear issue, complete ALL of these steps in order:

### 1. Start the Linear Issue

Move the ticket to "In Progress":

```bash
pnpm --filter @repo/scripts linear issues start --issue <key>
```

### 2. Create Worktree for Feature Branch

> **CRITICAL: NEVER commit directly to main branch**
> **MANDATORY: ALWAYS use git worktrees for feature work**

**Use the git-worktrees skill** to create an isolated worktree:

```text
Use Skill tool with skill: "git-worktrees"
```

The git-worktrees skill handles:

- Creating worktree directory (`.worktrees/feat-pra-XX-...`)
- Setting up isolated environment with unique PORT
- Configuring `.env.local` for parallel development
- Running baseline verification tests

**Branch naming conventions:**

- Bug fixes: `fix/pra-<issue>-<short-description>`
- Features: `feat/pra-<issue>-<short-description>`
- Chores: `chore/pra-<issue>-<short-description>`

### 3. Create Complete Todo List

Use TaskCreate to create a comprehensive task list that MUST include:

- [ ] Create feature branch (NOT main)
- [ ] All implementation tasks (code, documentation)
- [ ] Write tests for new functionality (unit/integration/e2e as required)
- [ ] Verify new tests pass and provide adequate coverage
- [ ] Run full test suite and verify all tests pass
- [ ] Create git commit with changes
- [ ] Push changes to remote branch
- [ ] Create pull request
- [ ] Monitor CI and fix any failures

**Note: Do NOT include "Close Linear issue" - issues close after PR merge.**

### 4. Implement Changes

- Write code following repository patterns
- Update documentation if needed
- Use research agents if you need context:
  - `dev-lifecycle:research:framework-docs` for library docs
  - `dev-lifecycle:research:best-practices` for patterns

### 5. Write Tests for New Functionality

> **MANDATORY: All new functionality must have test coverage**

1. **Identify what needs testing** (from ticket's Test Requirements):
   - What new functions/components were added?
   - What behavior changed?
   - What edge cases exist?

2. **Write appropriate test types**:
   - **Unit tests**: Individual functions/components
   - **Integration tests**: Module interactions
   - **E2E tests**: User flows (if applicable)

3. **Cover key scenarios**:
   - Happy path (normal usage)
   - Edge cases (empty inputs, boundaries)
   - Error handling (invalid data, network failures)

### 6. Verify All Tests Pass

```bash
# Run your new test file
pnpm test path/to/your.test.ts

# Run all tests
pnpm test

# Run workspace-specific tests
pnpm --filter @repo/api test
pnpm --filter web test
```

**CRITICAL:** Do not proceed to commit until all tests pass.

### 7. Run Pre-Commit Review

Before committing, run a quick code review:

```text
Use Task tool with subagent_type: "dev-lifecycle:review:typescript"
Prompt: "Review the uncommitted changes for TypeScript best practices"
```

### 8. Create Git Commit

> **Verify you're NOT on main branch before committing**

```bash
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ]; then
  echo "ERROR: Cannot commit to main! Create a feature branch first."
  exit 1
fi

git add .
git commit -m "$(cat <<'EOF'
Brief description of changes

Detailed explanation of what was changed and why.

Closes PRA-<key>

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 9. Push to Remote

```bash
git push -u origin HEAD
```

### 10. Create Pull Request

```bash
FEATURE_BRANCH=$(git branch --show-current)
gh pr create \
  --base main \
  --head "$FEATURE_BRANCH" \
  --title "Brief PR title" \
  --body "$(cat <<'EOF'
## Summary
- Bullet points summarizing the changes

## Related Issue
Closes PRA-<key>

## Test Plan
- Describe how to test the changes
EOF
)"
```

Capture the PR number from the URL.

### 11. Monitor CI and Fix Failures

> **MANDATORY: Always monitor CI after PR creation**

```bash
# Wait for CI to start
sleep 30

# Monitor CI status
gh pr checks <PR_NUMBER> --json bucket,state,name,workflow
```

**If failures detected:**

1. Fetch logs: `gh run view <run-id> --log-failed`
2. Analyze and fix the issue
3. Commit fix, push, resume monitoring

**Common fixes:**

- Type errors: `pnpm --filter web run type-check`
- Lint errors: `pnpm check`
- Test failures: `pnpm test`

### 12. Development Work Complete

**Work is complete when:**

1. All tests pass locally
2. Changes are committed and pushed
3. Pull request is created
4. CI checks all pass (or unfixable failures reported)

Report PR URL to user. Linear issue remains "In Progress" until PR merge.

---

## After PR is Merged (Separate Workflow)

Use `/dev:merge` after PR approval to:

1. Merge the pull request
2. Close the Linear issue
3. Clean up worktree
4. Return to main branch

---
Context: $ARGUMENTS
