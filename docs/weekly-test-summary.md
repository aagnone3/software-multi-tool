# Weekly Test-Readiness Summary

This document describes the automated weekly test-readiness summary system that provides comprehensive insights into test coverage trends, flaky tests, blockers, and recent test-related changes.

## Overview

The weekly test summary is an automated report generated every Monday that helps the team:

- Track coverage trends week-over-week
- Identify flaky tests
- Highlight coverage threshold blockers
- Review recent test-related PRs
- Take action on test readiness issues

## Components

### 1. Summary Script (`tooling/scripts/src/weekly-test-summary.ts`)

The TypeScript script that generates the weekly summary by:

- Reading current metrics from `metrics/latest.json`
- Comparing with historical data from `metrics/testing-history.json`
- Fetching recent test-related PRs via GitHub CLI
- Identifying coverage threshold blockers
- Formatting output as Markdown or JSON

### 2. GitHub Action Workflow (`.github/workflows/weekly-test-summary.yml`)

Automated workflow that:

- Runs every Monday at 9 AM UTC
- Collects fresh metrics
- Generates the weekly summary
- Creates a GitHub issue with the summary
- Comments on open PRs if there are blockers
- Archives summaries as workflow artifacts (90-day retention)

### 3. Metrics Infrastructure

The summary relies on existing metrics collection:

- **Coverage data**: Per-workspace coverage metrics (statements, branches, lines, functions)
- **Test results**: Total tests, test duration, flaky test count
- **History tracking**: Rolling 50-entry history for trend analysis
- **Thresholds**: Workspace-specific coverage thresholds from `tooling/test/coverage-thresholds.ts`

## Usage

### Manual Generation

Generate a summary locally:

```bash
# Generate for the past 7 days (default)
pnpm metrics:weekly

# Generate for the past 14 days
pnpm metrics:weekly --days 14

# Output as JSON
pnpm metrics:weekly --format json

# Skip PR fetching
pnpm metrics:weekly --no-details
```

### Prerequisites

Before running the summary:

1. Ensure metrics are collected: `pnpm metrics:collect`
2. Ensure GitHub CLI is authenticated (for PR data): `gh auth login`

### Automated Workflow

The GitHub Action runs automatically:

- **Schedule**: Every Monday at 9 AM UTC
- **Manual trigger**: Via GitHub Actions UI with custom `days_back` parameter

## Output Format

### Markdown Summary

The default output includes:

1. **Overview Section**
   - Total tests count
   - Overall coverage percentages with week-over-week deltas
   - Flaky tests count with delta

2. **Coverage Threshold Blockers** (if any)
   - Table of workspaces below their thresholds
   - Current coverage vs. threshold
   - Gap that needs to be closed

3. **Coverage Trends by Workspace**
   - Per-workspace statement and branch coverage
   - Week-over-week deltas
   - Status indicators (✅ passing, ⚠️ warning, ❌ failing)
   - Threshold requirements

4. **Recent Test-Related PRs**
   - PRs merged in the past week with test-related changes
   - Filtered by labels (test, coverage, ci, flaky, playwright, vitest)
   - Or by title keywords

5. **Recommended Actions**
   - Suggested coverage improvements for failing workspaces

### JSON Output

For programmatic access, use `--format json` to get structured data:

```json
{
  "generatedAt": "2025-10-22T10:00:00.000Z",
  "period": {
    "start": "2025-10-15",
    "end": "2025-10-22"
  },
  "overview": {
    "totalTests": 150,
    "totalCoverage": {
      "statements": 85.5,
      "branches": 78.3
    },
    "coverageTrend": { /* ... */ },
    "flakyTests": { /* ... */ }
  },
  "workspaces": [ /* ... */ ],
  "blockers": [ /* ... */ ],
  "recentPRs": [ /* ... */ ]
}
```

## Coverage Status Indicators

Each workspace is assigned a status:

- **✅ Passing**: Coverage meets or exceeds thresholds with 5%+ buffer
- **⚠️ Warning**: Coverage meets thresholds but within 5% buffer (at risk)
- **❌ Failing**: Coverage is below thresholds (blocks CI)

## Workflow Permissions

The GitHub Action requires:

- `contents: write` - To read repository code
- `issues: write` - To create weekly summary issues
- `pull-requests: read` - To list and comment on PRs

## Issue Labeling

Created GitHub issues are automatically labeled:

- `testing` - Indicates this is a testing-related issue
- `weekly-summary` - Marks it as an automated weekly report
- `automated` - Indicates automated generation

## PR Comments

If coverage blockers are detected, the workflow will:

1. Comment on open PRs with a summary of blockers
2. Skip PRs that already have a recent (< 7 days) summary comment
3. Link to the full summary in the workflow run

## Metrics Collection

The weekly summary depends on metrics collection running first. The workflow automatically runs:

```bash
pnpm metrics:collect
```

This:

1. Runs the full test suite with coverage enabled
2. Collects coverage data from all workspaces
3. Updates `metrics/latest.json` and `metrics/testing-history.json`

## Customization

### Changing the Schedule

Edit `.github/workflows/weekly-test-summary.yml`:

```yaml
on:
  schedule:
    # Run every Wednesday at 2 PM UTC
    - cron: "0 14 * * 3"
```

### Adjusting Warning Threshold

Edit `tooling/scripts/src/weekly-test-summary.ts`:

```typescript
// Change the 5% warning buffer
if (
  currentStatements < threshold.statements + 10 || // 10% buffer instead of 5%
  currentBranches < threshold.branches + 10
) {
  status = "warning";
}
```

### Adding Custom Filters

Modify the PR filtering logic in `fetchRecentPRs()`:

```typescript
const testKeywords = [
  "test",
  "coverage",
  "ci",
  "flaky",
  "playwright",
  "vitest",
  "e2e", // Add custom keyword
];
```

## Troubleshooting

### No metrics found

**Error**: "No current metrics found. Run 'pnpm metrics:collect' first."

**Solution**: Run `pnpm metrics:collect` to generate fresh metrics data.

### GitHub CLI not available

**Warning**: "Failed to fetch recent PRs (gh CLI may not be available)"

**Solution**:

- Install GitHub CLI: https://cli.github.com/
- Authenticate: `gh auth login`

### Missing historical data

If there's no `testing-history.json`, the summary will:

- Use current metrics as the baseline
- Show zero deltas for all trends
- Continue collecting history going forward

### Coverage threshold changes

If coverage thresholds are updated in `tooling/test/coverage-thresholds.ts`:

- The next summary will reflect new thresholds
- Workspaces may move between passing/warning/failing status
- Historical comparisons remain based on coverage percentages

## Integration with Development Workflow

The weekly summary integrates with the existing development workflow:

1. **Pre-commit**: Individual PRs are tested with `pre-commit` hooks
2. **CI**: PRs run full test suite with `pnpm test:ci`
3. **Metrics collection**: Periodically run `pnpm metrics:collect`
4. **Weekly summary**: Automated report every Monday
5. **Issue tracking**: Summary issues provide visibility to the team
6. **PR awareness**: Developers on open PRs are notified of blockers

## Best Practices

1. **Review weekly**: Assign someone to review the weekly issue and track action items
2. **Address blockers**: Prioritize fixing coverage blockers before they accumulate
3. **Investigate spikes**: If flaky tests increase significantly, investigate root causes
4. **Celebrate wins**: Acknowledge teams that improve coverage
5. **Update thresholds**: Gradually increase thresholds as coverage improves

## Related Documentation

- [CI Testing Documentation](./ci-testing.md) - Coverage enforcement in CI
- [Testing Metrics Guide](./testing-metrics.md) - Metrics collection system
- [Postgres Integration Testing](./postgres-integration-testing.md) - Database test setup
- [CLAUDE.md](../CLAUDE.md) - Complete testing commands reference

## Example Output

```markdown
# Weekly Test-Readiness Summary

**Generated:** 10/22/2025, 10:00:00 AM
**Period:** 2025-10-15 to 2025-10-22

## Overview

- **Total Tests:** 150
- **Statement Coverage:** 85.5% (↑2.3%)
- **Branch Coverage:** 78.3% (↓1.1%)
- **Flaky Tests:** 3 (→)

## ⚠️ Coverage Threshold Blockers

The following workspaces are below their coverage thresholds and will block CI:

| Workspace | Metric | Current | Threshold | Gap |
|-----------|--------|---------|-----------|-----|
| packages/storage | branches | 52.5% | 55% | 2.5% |

## Coverage Trends by Workspace

| Workspace | Statements | Branches | Status | Threshold (S/B) |
|-----------|------------|----------|--------|-----------------|
| packages/storage | 78.0% (→) | 52.5% (↓2.5%) | ❌ | 80% / 55% |
| packages/utils | 92.0% (↑1.5%) | 87.0% (↑0.8%) | ✅ | 90% / 85% |
| apps/web | 91.5% (↑3.2%) | 90.5% (↑2.1%) | ✅ | 90% / 90% |

## Recommended Actions

- **packages/storage**: Increase coverage by 2.5%
```
