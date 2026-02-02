---
description: Identify and resolve CI workflow failures
---

# Resolve CI Issues

Diagnose and resolve CI workflow failures. Use when CI checks fail on a pull request.

## Required Steps (IN THIS ORDER)

### 1. Identify the PR and Failed Checks

Get the current PR and its check status:

```bash
gh pr view --json number,url,headRefName,statusCheckRollup
```

If no PR exists for current branch, check if user provided a PR number.

### 2. Get Detailed Check Failure Information

List all checks and their status:

```bash
gh pr checks --json name,state,conclusion,startedAt,completedAt
```

Identify which checks failed (conclusion: "FAILURE" or state: "PENDING").

### 3. Fetch Failure Logs

For each failed check, get the logs:

```bash
# List workflow runs
gh run list --branch <branch-name> --limit 5

# View specific failed run
gh run view <run-id> --log-failed
```

### 4. Analyze Failure Type

| Failure Type          | Indicators                             | Resolution                                 |
| --------------------- | -------------------------------------- | ------------------------------------------ |
| **Lint errors**       | `biome`, `eslint`, formatting errors   | Run `pnpm lint` or `pnpm format` locally   |
| **Type errors**       | `tsc`, `type-check`, TypeScript errors | Run `pnpm --filter web run type-check`     |
| **Test failures**     | `vitest`, `jest`, assertion errors     | Run `pnpm test` locally                    |
| **E2E failures**      | `playwright`, browser test failures    | Run `pnpm --filter web run e2e` locally    |
| **Build failures**    | `next build`, compilation errors       | Run `pnpm build` locally                   |
| **Dependency issues** | `pnpm install`, lockfile conflicts     | Run `pnpm install` and commit lockfile     |

### 5. Reproduce Locally

Run the failing command locally:

```bash
# For lint failures
pnpm lint

# For type errors
pnpm --filter web run type-check

# For test failures
pnpm test

# For E2E failures
pnpm --filter web run e2e

# For build failures
pnpm build
```

### 6. Fix the Issues

Based on the failure type:

#### Lint/Format Errors

```bash
pnpm format
pnpm lint
```

#### Type Errors

- Read the error messages carefully
- Fix type issues in the indicated files
- Run type-check again to verify

#### Test Failures

- Read test output to understand what's failing
- Fix the code or update tests as appropriate
- Run specific test file: `pnpm test -- <path-to-test>`

#### Build Failures

- Check for missing imports/exports
- Verify environment variables are set
- Check for syntax errors

### 7. Verify Fixes Locally

```bash
# Run pre-commit checks
pre-commit run --all-files

# Or run individual checks
pnpm lint && pnpm --filter web run type-check && pnpm test
```

### 8. Commit and Push Fixes

```bash
git add .
git commit -m "fix: resolve CI failures

- [Describe what was fixed]

Co-Authored-By: Claude <noreply@anthropic.com>"

git push
```

### 9. Verify CI Passes

```bash
gh pr checks --watch
```

Or check status periodically:

```bash
gh pr checks
```

### 10. Report Status

**Success:**

- ✅ Fixed: [list of issues fixed]
- ✅ CI checks now passing
- 🔗 PR URL

**Persistent Issues:**

- ❌ Remaining issues: [describe]
- 📋 Next steps: [recommendations]

## Quick Diagnosis Commands

```bash
# Full CI status overview
gh pr checks

# Recent workflow runs
gh run list --limit 10

# View specific run details
gh run view <run-id>

# Download failed run logs
gh run view <run-id> --log-failed

# Re-run failed jobs
gh run rerun <run-id> --failed
```

## CI Workflow Reference

| Workflow                | Trigger       | Checks                            |
| ----------------------- | ------------- | --------------------------------- |
| `validate-prs.yml`      | Pull requests | Biome lint, E2E tests, unit tests |
| `db-migrate-deploy.yml` | Push to main  | Prisma migrations                 |

## Common Fixes

### "Biome found X issues"

```bash
pnpm format
git add . && git commit -m "fix: format code with biome"
```

### "Type error: ..."

```bash
pnpm --filter web run type-check
# Fix errors shown, then commit
```

### "Test failed: ..."

```bash
pnpm test
# Read output, fix code/tests, then commit
```

### "E2E test failed"

```bash
pnpm --filter web run e2e
# Check screenshots/traces in test-results/, fix, then commit
```

## Error Handling

- **If can't identify PR**: Ask user for PR number or URL
- **If logs unavailable**: Check GitHub Actions UI directly
- **If fix unclear**: Report findings and ask user for guidance
- **If flaky test**: Consider re-running CI: `gh run rerun <run-id> --failed`

---
Context: $ARGUMENTS
