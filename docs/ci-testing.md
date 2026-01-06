# CI Testing Documentation

This document describes the test suite integration in the CI workflow for the Software Multitool monorepo.

## Overview

The CI pipeline runs comprehensive tests on all pull requests to ensure code quality and prevent regressions. This is implemented in `.github/workflows/validate-prs.yml`.

## Test Jobs

### 1. Unit Tests (`tests` job)

**Location**: `.github/workflows/validate-prs.yml:67-82`

**Command**: `pnpm test:ci`

**Configuration**:

- Runs on `ubuntu-latest`
- 30-minute timeout
- Node LTS version
- Environment variables:
  - `TURBO_TELEMETRY_DISABLED=1`
  - `VITEST_COVERAGE=1` (enables coverage collection)
  - `VITEST_ENFORCE_THRESHOLDS=1` (fails build on coverage breaches)

**What it does**:

- Runs all workspace test suites via Turbo
- Collects code coverage using Vitest's v8 provider
- Enforces coverage thresholds defined in `tooling/test/coverage-thresholds.ts`
- Generates coverage reports in each workspace's `coverage/` directory

### 2. E2E Tests (`e2e` job)

**Location**: `.github/workflows/validate-prs.yml:22-66`

**Command**: `pnpm --filter web e2e:ci`

**Configuration**:

- Runs on `ubuntu-latest`
- 60-minute timeout
- Node LTS version
- Installs Playwright browsers automatically

**What it does**:

- Runs Playwright E2E tests headlessly
- Collects comprehensive artifacts on failure:
  - HTML reports (always collected, 30-day retention)
  - Screenshots (on failure, 7-day retention)
  - Videos (on failure, 7-day retention)
  - Trace files (on failure, 7-day retention)

### 3. Linting (`lint` job)

**Location**: `.github/workflows/validate-prs.yml:11-21`

**Command**: `biome ci .`

**What it does**:

- Validates code formatting and style
- Runs Biome static analysis

## Coverage Thresholds

Coverage thresholds are defined per-workspace in `tooling/test/coverage-thresholds.ts`:

| Workspace         | Statements | Branches |
| ----------------- | ---------- | -------- |
| apps/web          | 90%        | 90%      |
| packages/api      | 70%        | 85%      |
| packages/auth     | 90%        | 85%      |
| packages/database | 65%        | 85%      |
| packages/ai       | 90%        | 75%      |
| packages/utils    | 90%        | 85%      |
| packages/logs     | 90%        | 85%      |
| packages/mail     | 85%        | 70%      |
| packages/payments | 90%        | 85%      |
| packages/storage  | 80%        | 55%      |
| packages/i18n     | 65%        | 60%      |
| config            | 90%        | 90%      |
| tooling/scripts   | 75%        | 55%      |

## How Coverage Enforcement Works

1. **Environment Variables**: The `test:ci` script sets `VITEST_ENFORCE_THRESHOLDS=1`
2. **Vitest Configuration**: `tooling/test/vitest.workspace.ts:41-42` checks this variable
3. **Threshold Application**: Line 87 applies thresholds to the coverage configuration when enforcement is enabled
4. **Build Failure**: If any workspace fails to meet its thresholds, the build fails

## Running Tests Locally

### Run all tests with coverage

```bash
pnpm test:ci
```

### Run tests without coverage enforcement

```bash
pnpm test
```

### Run E2E tests with UI

```bash
pnpm --filter web run e2e
```

### Run E2E tests headlessly (CI mode)

```bash
pnpm --filter web run e2e:ci
```

### Run tests for a specific workspace

```bash
pnpm --filter @repo/api test
```

## Coverage Reports

Coverage reports are generated in each workspace's `coverage/` directory:

- `vitest-results.json` - JSON report for CI integration
- `coverage-summary.json` - Coverage metrics summary
- `lcov.info` - LCOV format for coverage tools
- Terminal output shows coverage table

## Related Files

- `.github/workflows/validate-prs.yml` - CI workflow definition
- `package.json:19` - `test:ci` script with enforcement enabled
- `tooling/test/vitest.workspace.ts` - Shared Vitest configuration
- `tooling/test/coverage-thresholds.ts` - Coverage threshold definitions
- Individual workspace `vitest.config.ts` files - Per-workspace test configuration
