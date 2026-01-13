# Linear Workflow Skill

This skill provides a guided workflow for implementing Linear issues using feature branches and pull requests. It enforces best practices for branch-based development with code review.

## When to Use This Skill

Use this skill when:

- The user asks to work on a specific Linear issue (e.g., "work on PRA-19")
- The user wants to start implementing a feature from Linear
- The user asks to pick up groomed issues from Linear (issues in **Ready** state)

> **State Convention:**
>
> - **Backlog** = Needs grooming (use `/dev:groom-work` first)
> - **Ready** = Groomed and ready for development (pick these up)
> - **In Progress** = Currently being worked on
> - **Done** = Completed (only after PR is merged)

## Core Workflow

### 1. Issue Selection and Context Gathering

When the user wants to work on a Linear issue:

1. **Get issue details** from Linear (use existing Linear CLI or MCP tools)
2. **Verify issue is groomed** - Check that the issue is in **Ready** state (not Backlog)
   - If issue is in **Backlog**, inform user it needs grooming first: `/dev:groom-work`
   - Only proceed with issues in **Ready** state (groomed and ready)
3. **Verify issue is not blocked** - Check that it's not blocked by other issues
4. **Move issue to "In Progress"** - Automatically update Linear status:

   ```bash
   pnpm --filter @repo/scripts linear issues start --issue {ISSUE-KEY}
   ```

5. **Understand requirements** - Read issue description, acceptance criteria, and related context
6. **Ask clarifying questions** if requirements are unclear

### 2. Worktree Creation

> **🚨 MANDATORY: ALWAYS use git worktrees for feature work 🚨**

**Never work on main. Always use isolated worktrees.**

**Why worktrees are mandatory:**

- Multiple Claude Code instances work on tickets in parallel
- Main branch stays pure and clean as a reference point
- Complete isolation between concurrent development efforts
- You (the user) can freely experiment on main without affecting agent work
- Zero interference between parallel tasks

**You MUST use the git-worktrees skill** to create an isolated worktree:

```text
Use Skill tool with skill: "git-worktrees"
```

The git-worktrees skill will handle:

- Creating worktree directory (`.worktrees/{ISSUE-KEY}-...`)
- Setting up isolated environment with unique PORT
- Configuring `.env.local` for parallel development
- Running baseline verification tests
- Ensuring gitignore is configured correctly

Branch naming convention (skill handles this): `{ISSUE-KEY}/{short-description}`

Example: `PRA-19/seed-utilities`

**DO NOT use `git checkout -b`** - this violates the parallel development architecture.

### 3. Implementation

Follow this pattern:

1. **Create a todo list** for the implementation steps (MUST include PR creation steps)
2. **Break down the work** into logical, testable units
3. **Implement incrementally** with frequent commits
4. **Run tests** after each significant change
5. **Update todo list** as work progresses

**Required Ready List Structure:**

When working on a Linear issue, your todo list MUST include these final steps:

```text
1. [pending] Implement feature X
2. [pending] Implement feature Y
3. [pending] Run tests to verify they pass
4. [pending] Commit changes to feature branch
5. [pending] Push branch and create PR
```

This ensures you don't forget to create a PR after implementation is complete.

### 4. Committing Work

**Commit message format:**

```text
{ISSUE-KEY}: {Brief summary}

{Detailed description of changes}

Key changes:
- Bullet point 1
- Bullet point 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Commit guidelines:**

- Make atomic, focused commits
- Include issue key in commit message
- Describe WHY, not just WHAT
- Run pre-commit hooks (they run automatically)
- Fix any linting/formatting issues before proceeding

### 5. Testing

Before submitting a PR:

1. **Run relevant tests**:
   - `pnpm test` - Run all tests
   - `pnpm --filter {workspace} test` - Run specific workspace tests
   - `pnpm lint` - Check code quality
   - `pnpm type-check` - Verify TypeScript types

2. **Test manually** if applicable (e2e, UI changes, etc.)

3. **Verify pre-commit hooks pass**

## Implementation Completion Checklist

**CRITICAL:** When you have completed implementation work on a Linear issue, you MUST verify these conditions and automatically proceed to PR creation:

### Completion Conditions

1. ✅ All work documented in the ticket is implemented
2. ✅ All local tests passing

### Required Next Steps (DO NOT SKIP)

When BOTH conditions above are met, you MUST immediately proceed to:

1. [ ] Verify you're in a worktree (NOT main branch)
2. [ ] Commit all changes with proper format
3. [ ] Push branch to remote
4. [ ] Create pull request against main
5. [ ] Return PR URL to user

**IMPORTANT:** Implementation is NOT complete until a PR is open against main. Do not consider the work done or ask the user what to do next - automatically proceed with PR creation when tests pass.

### 6. Pull Request Creation

**IMPORTANT:** Code is NOT ready for review until there is an open pull request against `main`.

**Only create a PR when:**

- All tests pass
- Code is ready for review
- User explicitly asks to create a PR

**PR creation steps:**

1. **Push branch to remote**: `git push -u origin {branch-name}`

2. **Create PR against main with descriptive content**:

   ```bash
   gh pr create --base main --title "{ISSUE-KEY}: {Title}" --body "$(cat <<'EOF'
   ## Summary
   {Brief overview of changes}

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
   EOF
   )"
   ```

3. **Link PR to Linear issue** (gh cli does this automatically via issue key in title)

4. **Return PR URL** to user

### 7. Post-PR Actions

After PR is created:

1. Linear issue status is already "In Progress" (set at start)
2. **Inform user** of next steps (wait for review, address feedback, etc.)
3. Issue will auto-close when PR is merged (via "Closes {ISSUE-KEY}" in PR description)

### 8. Merging Pull Requests

**Only when user confirms PR is ready to merge:**

When the user says the PR is ready to merge (e.g., "ready to merge PR #39"), follow these steps in order:

1. **Merge the PR** using GitHub CLI:

   ```bash
   gh pr merge {PR_NUMBER} --repo {org}/{repo} --squash --delete-branch
   ```

   - Use `--squash` to squash all commits into one
   - Use `--delete-branch` to automatically delete the feature branch
   - Repository often requires squash merge (not regular merge)

2. **Close the Linear issue**:

   ```bash
   pnpm --filter @repo/scripts linear issues close --issue {ISSUE-KEY}
   ```

   - Note: GitHub may auto-close via "Closes {ISSUE-KEY}" in PR description
   - Always verify the issue is closed

3. **Clean up worktree** (optional):

   After PR is merged, you can optionally clean up the worktree:

   ```bash
   cd ../..  # Return to main repo
   git worktree remove .worktrees/{issue-worktree-name}
   git worktree prune
   ```

   - Main branch automatically stays up to date
   - Worktree cleanup is optional; you can keep it for follow-up work

4. **Confirm completion** to user with:
   - PR merge status
   - Linear issue status
   - Confirmation that main branch is updated

**Important notes:**

- Only merge when user explicitly confirms
- Check for required approvals before merging
- Verify CI/CD checks have passed
- The feature branch is automatically deleted after merge

## Important Constraints

### What NOT to Do

- ❌ **Never** commit directly to main
- ❌ **Never** use `git checkout -b` (always use worktrees)
- ❌ **Never** create a PR without running tests first
- ❌ **Never** skip the worktree workflow
- ❌ **Never** force push to shared branches
- ❌ **Never** commit without issue context
- ❌ **Never** consider code "ready for review" without an open PR against main

### What TO Do

- ✅ **Always** use git worktrees for feature work (never `git checkout -b`)
- ✅ **Always** run tests before creating PR
- ✅ **Always** create PR against main (use `--base main`)
- ✅ **Always** include issue key in commits and PR title
- ✅ **Always** write descriptive commit messages
- ✅ **Always** clean up todo list when done
- ✅ **Always** open a PR for code review

## Workflow States

### State 1: Starting Work

User says: "work on PRA-19"

Actions:

1. Get issue details from Linear
2. Check if issue is ready (not blocked)
3. **Move issue to "In Progress"** using `linear issues start`
4. Present issue summary to user
5. Ask if they want to proceed
6. **Create worktree** using git-worktrees skill
7. Create todo list for implementation

### State 2: Implementing

User is actively working on the issue

Actions:

1. Follow implementation plan
2. Make focused commits
3. Update todo list
4. Run tests frequently
5. Fix issues as they arise

### State 3: Implementation Complete (Auto-Transition to PR)

**Automatic state transition when:**

- All work documented in ticket is implemented
- All tests pass

**Required Actions (DO NOT ASK USER):**

1. Verify you're in a worktree (NOT main branch)
2. Commit all changes with proper format
3. Push branch to remote
4. Create PR against main
5. Return PR URL to user

**DO NOT:**

- Ask user if they want to create a PR
- Wait for user to tell you to create a PR
- Consider work complete without a PR

This is an automatic workflow step that happens when implementation + tests are complete.

### State 4: PR Created

PR is now open and ready for review

Actions:

1. Confirm PR URL to user
2. Suggest next steps (wait for review, address feedback if needed)

### State 5: Merging PR

User says: "ready to merge PR #X" or "merge the PR"

Actions:

1. Merge PR with squash and delete branch
2. Close Linear issue (verify auto-close worked)
3. Update local main branch
4. Confirm completion to user

## Integration with Existing Tools

This skill uses:

- **Linear CLI** (`pnpm --filter @repo/scripts linear`) for Linear operations
- **Git** for version control and branching
- **GitHub CLI** (`gh`) for PR creation
- **pnpm** for running tests and build commands

## Example Session

```text
User: Work on PRA-19

Claude: Let me get the details for PRA-19...

[Fetches issue from Linear]
[Moves issue to "In Progress"]

Claude: ✅ Moved PRA-19 to "In Progress"

PRA-19: Create seeded random utilities for testing

The issue requires:
- Implement seeded random number generators
- Create deterministic test fixtures
- Add documentation

I'll create a worktree and start implementation.

[Creates worktree using git-worktrees skill]
[Creates todo list]
[Begins implementation]
