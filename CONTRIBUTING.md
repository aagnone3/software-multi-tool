# Contributing

Thanks for helping improve Software Multitool! This guide highlights the testing-related expectations before opening a pull request.

## Test Workflow

- `pnpm test` – runs the Vitest workspace pipeline via Turbo and only executes the suites touched by your changes.
- `pnpm test -- --runInBand` – executes the same pipeline serially for noisy environments (e.g., local pre-commit runs).
- `pnpm --filter <workspace> test` – focuses on a single workspace (for example, `pnpm --filter @repo/api test`).
- `pnpm test:ci` – mirrors the CI job with coverage thresholds enforced; use this before requesting review when you expect coverage changes.

Coverage artifacts are written to each workspace's `coverage/` directory.
Coverage thresholds are configured per workspace in `tooling/test/coverage-thresholds.ts`; update the relevant entry when you intentionally shift coverage.

## End-to-End Tests

- `pnpm --filter web run e2e` – launches Playwright headed with the UI runner.
- `pnpm --filter web run e2e:ci` – runs the Playwright suite headlessly (CI parity).
- Append `-- --grep "test name"` to either command to target specific scenarios.

## Type Checking

- `pnpm --filter web run type-check` – validates the Next.js app's TypeScript project references.

## Pre-commit Hooks

Install hooks with `pre-commit install`. Every commit runs:

- `pnpm exec biome check --write`
- `pnpm lint`
- `pnpm --filter web run type-check`

Use `pre-commit run --all-files` whenever you want to re-run the hooks locally across the whole tree.
