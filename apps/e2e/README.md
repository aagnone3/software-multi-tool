# E2E Testing Package

End-to-end tests for the web application using Playwright.

## Structure

```text
apps/e2e/
├── fixtures/           # Test fixtures and utilities
│   └── index.ts        # Auth helpers, navigation utilities
├── page-objects/       # Page Object Models
│   ├── index.ts        # Exports all page objects
│   └── *.page.ts       # Individual page objects
├── specs/              # Test specifications
│   ├── auth/           # Authentication tests
│   ├── settings/       # Settings page tests
│   ├── smoke/          # Smoke tests for critical paths
│   └── tools/          # Tool-specific tests
├── playwright.config.ts
└── package.json
```

## Quick Start

```bash
# From monorepo root
cd apps/e2e

# Install dependencies
pnpm install

# Install Playwright browsers
npx playwright install chromium

# Run tests (starts dev server automatically)
pnpm test

# Run with UI mode
pnpm test:ui
```

## Running Tests

### Against Local Development

```bash
# Ensure dev server is running
pnpm --filter web dev

# Run all tests
pnpm test

# Run specific test suites
pnpm test:smoke      # Critical path tests
pnpm test:auth       # Authentication tests
pnpm test:tools      # Tool tests (news-analyzer, etc.)
pnpm test:settings   # Settings page tests
```

### Against Preview Deployments

```bash
# Run against a Vercel preview URL
BASE_URL=https://your-preview.vercel.app pnpm test
```

### Against Production

```bash
BASE_URL=https://your-domain.com pnpm test:smoke
```

## Test Fixtures

Import from `../../fixtures` to access test utilities:

```typescript
import { expect, test, TEST_USER } from "../../fixtures";

test("example with authentication", async ({ authenticatedPage }) => {
  // authenticatedPage is already logged in
  await authenticatedPage.goto("/app/dashboard");
});

test("example with manual login", async ({ page, login }) => {
  // Perform some setup first
  await page.goto("/");

  // Then login when ready
  await login();
});

test("example with navigation helper", async ({ page, gotoAndWait }) => {
  // Wait for network idle after navigation
  await gotoAndWait("/app/tools");
});
```

### Available Fixtures

| Fixture             | Description                            |
| ------------------- | -------------------------------------- |
| `authenticatedPage` | A page that's already logged in        |
| `login`             | Function to login manually when needed |
| `gotoAndWait`       | Navigate and wait for network idle     |
| `TEST_USER`         | Test user credentials object           |

## Page Objects

Page objects encapsulate selectors and common interactions:

```typescript
import { NewsAnalyzerPage } from "../../page-objects";

test("news analyzer flow", async ({ page, login }) => {
  await login();

  const newsAnalyzer = new NewsAnalyzerPage(page);
  await newsAnalyzer.goto();
  await newsAnalyzer.analyzeUrl("https://example.com/article");
  await newsAnalyzer.waitForLoading();
});
```

## Test Tags

Tests can be tagged for selective execution:

- `@smoke` - Critical path tests that should pass on every deployment
- Run tagged tests: `pnpm test -- --grep @smoke`

## Prerequisites

### Local Development

1. **Dev server running**: `pnpm --filter web dev`
2. **Database seeded**: `supabase db reset`
3. **Inngest running** (for background jobs): `npx inngest-cli@latest dev -u http://localhost:3500/api/inngest`

### Preview/Production

1. **Test user exists**: Seeded via `supabase/seed.sql`
2. **Valid BASE_URL**: Set environment variable

## Debugging

```bash
# Run with headed browser
pnpm test:headed

# Run in debug mode (step through)
pnpm test:debug

# Generate tests via codegen
pnpm codegen

# View last test report
pnpm report
```

## CI Integration

Tests run automatically in CI. The configuration:

- Retries failed tests once
- Captures screenshots on failure
- Records videos on failure
- Generates HTML, JSON, and JUnit reports

## Adding New Tests

1. Create spec file in appropriate `specs/` subdirectory
2. Import fixtures: `import { expect, test } from "../../fixtures";`
3. Use page objects for complex pages
4. Tag smoke tests with `@smoke`

### Example Test

```typescript
import { expect, test } from "../../fixtures";

test.describe("My Feature", () => {
  test.beforeEach(async ({ page, login }) => {
    await login();
  });

  test("does something @smoke", async ({ page }) => {
    await page.goto("/app/my-feature");
    await expect(page.getByRole("heading")).toContainText("My Feature");
  });
});
```
