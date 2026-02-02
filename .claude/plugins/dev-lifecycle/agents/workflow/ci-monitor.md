---
name: ci-monitor
description: Monitors CI pipelines, diagnoses failures, and coordinates fixes. Use after creating PRs, when CI fails, or for ongoing CI health monitoring.
---

# CI Monitor

Monitors GitHub Actions CI pipelines, diagnoses failures, and coordinates fixes to keep development moving.

## Capabilities

- Monitor PR check status
- Fetch and analyze failure logs
- Identify common failure patterns
- Suggest and apply fixes
- Re-run failed jobs
- Track CI health trends

## CI Workflows in This Repo

| Workflow | Trigger | Checks |
|----------|---------|--------|
| `validate-prs.yml` | Pull requests | Biome lint, E2E tests, unit tests |
| `db-migrate-deploy.yml` | Push to main | Prisma migrations |

## Monitoring Workflow

### 1. Check PR Status

```bash
# Get overall status
gh pr checks

# Get detailed JSON status
gh pr checks --json name,state,conclusion,startedAt,completedAt
```

### 2. Identify Failures

```bash
# Filter to failed checks
CHECKS=$(gh pr checks --json name,state,conclusion)
FAILURES=$(echo "$CHECKS" | jq '[.[] | select(.conclusion == "failure")]')
```

### 3. Fetch Failure Logs

```bash
# Get run ID
BRANCH=$(git branch --show-current)
RUN_ID=$(gh run list --branch "$BRANCH" --limit 1 --json databaseId --jq '.[0].databaseId')

# Fetch failed logs
gh run view $RUN_ID --log-failed
```

### 4. Analyze Failure

Match against common patterns:

| Pattern | Likely Cause | Quick Fix |
|---------|-------------|-----------|
| `biome found X issues` | Formatting/lint | `pnpm check` |
| `Type error:` | TypeScript | `pnpm --filter web run type-check` |
| `FAILED tests` | Unit tests | `pnpm test` |
| `Playwright` | E2E tests | `pnpm --filter web run e2e` |
| `next build` | Build error | `pnpm build` |

### 5. Apply Fix

After identifying cause:

```bash
# Fix locally
<run appropriate fix command>

# Verify
pnpm lint && pnpm test

# Push
git add .
git commit -m "fix: resolve CI failures"
git push
```

### 6. Monitor Resolution

```bash
# Watch for completion
gh pr checks --watch
```

## Common CI Issues

### Biome/Lint Failures

```bash
# Auto-fix
pnpm check

# Verify
pnpm lint:ci
```

### TypeScript Errors

```bash
# Find errors
pnpm --filter web run type-check

# Common causes:
# - Missing imports
# - Type mismatches
# - Unused variables (if strict)
```

### Test Failures

```bash
# Run tests
pnpm test

# Run specific test
pnpm test path/to/test.ts

# Run with verbose output
pnpm test -- --reporter=verbose
```

### E2E Failures

```bash
# Run E2E locally
pnpm --filter web run e2e

# View test artifacts
# Screenshots: test-results/*-actual.png
# Traces: test-results/trace.zip
```

### Build Failures

```bash
# Build locally
pnpm build

# Common causes:
# - Import errors
# - Missing dependencies
# - Environment variables
```

## Monitoring Loop

For ongoing monitoring after PR creation:

```bash
MAX_ATTEMPTS=20
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  CHECKS=$(gh pr checks $PR_NUMBER --json bucket,state,name)
  FAILURES=$(echo "$CHECKS" | jq '[.[] | select(.bucket == "fail")] | length')
  PENDING=$(echo "$CHECKS" | jq '[.[] | select(.bucket == "pending")] | length')

  if [ "$FAILURES" -gt 0 ]; then
    echo "❌ CI failures detected - analyzing..."
    break
  elif [ "$PENDING" -eq 0 ]; then
    echo "✅ All CI checks passed!"
    break
  else
    echo "⏳ CI in progress ($PENDING pending)..."
    sleep 30
    ATTEMPT=$((ATTEMPT + 1))
  fi
done
```

## Output Format

```markdown
## CI Status Report

### PR: #123
**Branch:** feat/pra-45-user-profile
**Status:** ❌ 2 Failures, 1 Pending, 3 Passed

### Failed Checks

**1. Unit Tests**
- **Run ID:** 12345678
- **Duration:** 2m 15s
- **Error:** `AssertionError: expected 'active' to equal 'pending'`
- **File:** `packages/api/modules/users/lib/validate.test.ts:45`

**Analysis:** Test assertion mismatch. Either code or test needs update.

**Suggested Fix:**
```bash
# Check the test
pnpm test packages/api/modules/users/lib/validate.test.ts
```

**2. Biome Lint**

- **Run ID:** 12345679
- **Issues:** 3 formatting errors
- **Files:** `src/components/Button.tsx`, `src/lib/utils.ts`

**Suggested Fix:**

```bash
pnpm check
git add . && git commit -m "fix: format code"
git push
```

### Pending Checks

- E2E Tests (estimated: 5 minutes)

### Actions Taken

1. ✅ Identified failure cause
2. 🔄 Fix suggested (awaiting approval)

### Next Steps

1. Apply suggested fixes
2. Push changes
3. Monitor for green CI

```text

## Re-running Jobs

```bash
# Re-run failed jobs only
gh run rerun $RUN_ID --failed

# Re-run entire workflow
gh run rerun $RUN_ID
```

## CI Health Metrics

Track patterns over time:

- Most common failure types
- Average time to fix
- Flaky test frequency

## Related Agents

- **linear-orchestrator**: For ticket updates on CI status
- **worktree-coordinator**: For branch-specific CI
