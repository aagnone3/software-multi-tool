# CI Monitoring Workflow

> **⚠️ DEPRECATED**: This documentation has been integrated into the workflow.
>
> **See**: `.claude/commands/dev:work-on-ticket.md` - Step 7.5 (Monitor CI and Fix Failures)

## Problem Statement

After creating a PR, Claude should automatically monitor CI status, detect failures, fix them, and push corrections without requiring user intervention.

## Solution

CI monitoring is now a **mandatory step** in the `/dev:work-on-ticket` workflow. It cannot be skipped or forgotten.

**How it works:**

1. After PR creation (step 7), monitoring automatically begins (step 7.5)
2. CI status is polled every 30 seconds
3. Failures are detected, logs are fetched, and fixes are applied
4. Work is not marked complete until CI passes or user is informed

**This ensures:**

- No PRs are left with failing CI
- Common issues are fixed automatically
- User only intervenes when necessary

---

## Original Documentation (For Reference)

## Systematic Approach

### 1. Post-PR Creation Monitoring Loop

After `gh pr create`, immediately enter a monitoring loop:

```bash
# Monitor PR checks until they complete
gh pr checks <pr-number> --watch --interval 30
```

Or poll with JSON:

```bash
while true; do
  STATUS=$(gh pr checks <pr-number> --json bucket,state,name,workflow)
  # Parse and check status
  # Break if all pass or take action if any fail
  sleep 30
done
```

### 2. Detect Failures

Use JSON output to detect failures:

```bash
gh pr checks <pr-number> --json bucket,state,name,workflow
```

Parse for any check where `bucket == "fail"`.

### 3. Fetch Failure Details

When a failure is detected:

```bash
# Get the workflow run ID
gh run list --branch <branch-name> --workflow="<workflow-name>" --json databaseId,status --limit 1

# View the run logs
gh run view <run-id> --log
```

Analyze logs to identify:

- Which step failed
- What the error message is
- What needs to be fixed

### 4. Fix and Push

Based on the error:

1. Make necessary code changes
2. Commit with descriptive message explaining the CI fix
3. Push to the same branch
4. Resume monitoring from step 1

### 5. Success Criteria

Continue monitoring until:

- All checks have `bucket == "pass"`
- No checks are pending
- CI is fully green

### 6. Timeout Handling

Set reasonable timeouts:

- **Maximum wait time**: 15 minutes
- **If timeout**: Report current status and ask user if they want to continue monitoring

## Implementation Pattern

```bash
# 1. Create PR
PR_NUMBER=$(gh pr create ... | grep -oE '[0-9]+$')

# 2. Wait for checks to start (GitHub needs time to trigger)
echo "Waiting for CI checks to start..."
sleep 30

# 3. Monitor loop
MAX_ATTEMPTS=30  # 15 minutes with 30s intervals
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  # Get check status
  CHECKS=$(gh pr checks $PR_NUMBER --json bucket,state,name,workflow)

  # Count failures
  FAILURES=$(echo "$CHECKS" | jq '[.[] | select(.bucket == "fail")] | length')

  # Count pending
  PENDING=$(echo "$CHECKS" | jq '[.[] | select(.bucket == "pending")] | length')

  if [ "$FAILURES" -gt 0 ]; then
    echo "CI failures detected. Analyzing..."
    # Get failed check details
    FAILED_CHECKS=$(echo "$CHECKS" | jq -r '.[] | select(.bucket == "fail") | "\(.name) in \(.workflow)"')
    echo "Failed checks: $FAILED_CHECKS"

    # Fetch logs and fix
    # (Implementation specific to error type)
    break
  elif [ "$PENDING" -eq 0 ]; then
    echo "All CI checks passed!"
    break
  else
    echo "CI checks in progress ($PENDING pending)... waiting 30s"
    sleep 30
    ATTEMPT=$((ATTEMPT + 1))
  fi
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo "CI monitoring timeout reached (15 minutes)"
fi
```

## Common CI Failures and Fixes

### 1. Integration Test Failures (Missing API Key)

**Error**: `ANTHROPIC_API_KEY is not set in CI environment`

**Fix**:

- Inform user to add `ANTHROPIC_API_KEY` to GitHub Actions secrets
- Or skip integration tests in CI if intentional

### 2. Type Errors

**Error**: TypeScript compilation errors

**Fix**:

- Run `pnpm type-check` locally
- Fix type errors
- Commit and push

### 3. Linting Failures

**Error**: Biome/ESLint violations

**Fix**:

- Run `pnpm lint --write` locally
- Commit formatted code
- Push changes

### 4. Test Failures

**Error**: Unit/integration test failures

**Fix**:

- Run `pnpm test` locally
- Fix failing tests
- Ensure all tests pass
- Commit and push

### 5. Build Failures

**Error**: Build process fails

**Fix**:

- Run `pnpm build` locally
- Fix build errors
- Ensure build succeeds
- Commit and push

## Best Practices

1. **Always monitor after PR creation** - Don't assume CI will pass
2. **Fetch full logs** - Don't guess, read the actual error
3. **Fix systematically** - Address root cause, not symptoms
4. **Verify locally first** - Run the same checks locally before pushing
5. **Report status** - Keep user informed of CI status and any actions taken
6. **Document failures** - If a new failure pattern emerges, add it to this guide

## Tools Available

- `gh pr checks <pr>` - Check PR status
- `gh pr checks <pr> --watch` - Watch until complete
- `gh pr checks <pr> --json <fields>` - Get JSON output
- `gh run list --branch <branch>` - List workflow runs
- `gh run view <run-id>` - View run details
- `gh run view <run-id> --log` - View run logs
- `gh run view <run-id> --log-failed` - View only failed steps

## Integration with Skills

Consider creating a `/dev:monitor-ci` skill that:

1. Takes a PR number as input
2. Implements the monitoring loop
3. Automatically fixes common issues
4. Reports back when all checks pass or when manual intervention is needed
