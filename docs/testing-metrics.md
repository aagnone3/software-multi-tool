# Testing Metrics

Use the shared Vitest workspace and metrics script to capture coverage and runtime data across every workspace. The flow persists both an append-only history and the latest snapshot so we can trend readiness over time.

## Collecting Metrics

```bash
pnpm metrics:collect
```

This command:

1. Forces a fresh `turbo run test` with coverage enabled (`VITEST_COVERAGE=1`) so every workspace writes `coverage/coverage-summary.json` and `coverage/vitest-results.json`.
2. Aggregates the coverage percentages, total durations, and flaky test counts into `metrics/latest.json`, while also appending the run to `metrics/testing-history.json` (the history keeps the most recent 50 entries by default).

The script tolerates workspaces without tests (they report zero values) and skips any missing coverage artifacts.

## Output Structure

Each entry includes:

- `coverage.statements|branches|lines|functions`: totals, covered counts, and aggregate percentages.
- `testDurationMs`: summed duration (ms) across all Vitest suites.
- `flakyTests`: count of assertions or suites that retried.
- `workspaces`: per-workspace breakdown with the same coverage and execution metrics.

Use the history file to plot trends or to inform future coverage thresholds.

Workspace-specific coverage guardrails live in `tooling/test/coverage-thresholds.ts`. Keep the thresholds in sync with the trends captured here so that CI reflects the evolving expectations.
