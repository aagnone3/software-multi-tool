# Linear Workflow Examples

## Example 1: Automatic PR Creation After Implementation

### Scenario

You implement a feature, tests pass, and Claude automatically creates a PR without you having to ask.

### Workflow

```text
User: Work on PRA-20

Claude: I'll help you work on PRA-20. Let me get the details...

[Fetches Linear issue details]
[Moves issue to "In Progress"]

Claude: ✅ Moved PRA-20 to "In Progress"

PRA-20 is about "Write Better Auth integration tests"
The issue requires:
- Integration tests for invitation acceptance
- Integration tests for seat updates
- Integration tests for subscription cancellation

I'll create a feature branch and implement these tests.

[Creates todo list including PR creation steps]
[Creates branch PRA-20/better-auth-integration-tests]
[Implements tests]
[Runs tests - all pass]

Claude: All tests are passing! Now creating a pull request...

[Automatically commits changes]
[Pushes branch]
[Creates PR]

Claude: ✅ Implementation complete!

PR created: https://github.com/aagnone3/software-multi-tool/pull/41

All 21 tests passing in the auth package. The PR is ready for review.
```

### Key Points

✅ **Automatic status update** - Issue moved to "In Progress" at start
✅ **Automatic progression** - Claude doesn't ask "should I create a PR?" when tests pass
✅ **Ready list includes PR steps** - Ensures the workflow is followed
✅ **Tests must pass first** - Won't create PR if tests fail
✅ **Returns PR URL** - User knows where to find the PR

## Example 2: What NOT to Do (Old Behavior)

### Anti-Pattern

```text
User: Work on PRA-20

Claude: [implements feature]
Claude: [runs tests]
Claude: All tests pass! ✅

[STOPS HERE - WRONG!]

User: [Has to manually ask] Can you create a PR?

Claude: Sure! [creates PR]
```

### Why This Is Wrong

❌ User has to remember to ask for PR creation
❌ Breaks the workflow momentum
❌ Easy to forget and consider work "done" without a PR
❌ Code sits on local branch without being ready for review

## Example 3: Handling Test Failures

### Test Failure Scenario

Tests fail during implementation - Claude should NOT create a PR.

### Test Failure Workflow

```text
User: Work on PRA-25

Claude: [fetches issue details]
Claude: [moves issue to "In Progress"]
Claude: ✅ Moved PRA-25 to "In Progress"

Claude: [implements feature]
Claude: [runs tests]

❌ Tests failed!
- 3 tests failing in packages/auth/auth.integration.test.ts

Let me fix these issues...

[Fixes issues]
[Runs tests again]

✅ All tests now passing!

[Automatically proceeds to PR creation]

Claude: PR created: https://github.com/aagnone3/software-multi-tool/pull/42
```

### Test Failure Key Points

✅ **Status updated early** - Issue marked "In Progress" before implementation
✅ **No PR until tests pass** - Guards against broken code
✅ **Automatic retry** - Fixes issues and re-tests
✅ **Still auto-creates PR** - Once tests pass, immediately creates PR

## Example 4: Working on Main Branch (Requires Branch Creation)

### Main Branch Scenario

User forgot to create a feature branch and implemented on main.

### Main Branch Workflow

```text
User: Work on PRA-30

Claude: [user is on main, implements feature]
Claude: [tests pass]

Claude: I notice we're on main. Creating a feature branch...

[Creates PRA-30/feature-name branch]
[Resets main to clean state]
[Re-commits changes to feature branch]
[Pushes and creates PR]

Claude: ✅ PR created: https://github.com/aagnone3/software-multi-tool/pull/43

Note: I created a feature branch since we were working on main.
```

### Main Branch Key Points

✅ **Detects main branch** - Checks current branch before PR
✅ **Creates branch if needed** - Doesn't fail, adapts
✅ **Still creates PR** - Workflow continues automatically

## Example 5: Complete Ready List Structure

### Recommended Ready List Format

When working on any Linear issue, the todo list should look like this:

```text
[pending] Verify issue is in "Ready" state (groomed and ready)
[pending] Move issue to "In Progress" status
[pending] Understand issue requirements and acceptance criteria
[pending] Implement feature X
[pending] Implement feature Y
[pending] Write tests for feature X
[pending] Write tests for feature Y
[pending] Run tests to verify they pass
[pending] Commit changes to feature branch
[pending] Push branch and create PR
```

The first item verifies the issue is groomed, the second updates status, and the last items ensure you don't forget the PR creation workflow.

### During Implementation

```text
[completed] Verify issue is in "Ready" state (groomed and ready)
[completed] Move issue to "In Progress" status
[completed] Understand issue requirements and acceptance criteria
[completed] Implement feature X
[in_progress] Implement feature Y
[pending] Write tests for feature X
[pending] Write tests for feature Y
[pending] Run tests to verify they pass
[pending] Commit changes to feature branch
[pending] Push branch and create PR
```

### After Tests Pass (Auto-Transition)

```text
[completed] Move issue to "In Progress" status
[completed] Understand issue requirements and acceptance criteria
[completed] Implement feature X
[completed] Implement feature Y
[completed] Write tests for feature X
[completed] Write tests for feature Y
[completed] Run tests to verify they pass
[in_progress] Commit changes to feature branch  <- AUTO-STARTS
[pending] Push branch and create PR
```

### After PR Created

```text
[completed] Move issue to "In Progress" status
[completed] Understand issue requirements and acceptance criteria
[completed] Implement feature X
[completed] Implement feature Y
[completed] Write tests for feature X
[completed] Write tests for feature Y
[completed] Run tests to verify they pass
[completed] Commit changes to feature branch
[completed] Push branch and create PR
```

## Summary

### ✅ DO

- Auto-create PR when (implementation complete + tests pass)
- Include PR creation in todo list
- Check for feature branch before PR
- Return PR URL to user

### ❌ DON'T

- Ask user if they want a PR when tests pass
- Consider work complete without a PR
- Wait for user to request PR creation
- Skip PR creation step
