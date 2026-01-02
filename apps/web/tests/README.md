# Playwright Testing Guide

This directory contains end-to-end (E2E) tests using Playwright.

## Test Organization

Tests are organized by feature area and tagged for targeted execution:

- **smoke.spec.ts** - Critical path tests for marketing pages (@smoke)
- **auth.spec.ts** - Authentication flow tests (login, signup, password reset)
- **billing.spec.ts** - Billing and payment flow tests (@billing)
- **onboarding.spec.ts** - User onboarding flow tests (@onboarding)
- **fixtures.ts** - Shared test fixtures and utilities

## Available Tags

- **@smoke** - Critical path tests that should run on every deployment
- **@billing** - Billing and payment related tests
- **@onboarding** - User onboarding flow tests

## Shared Fixtures

The `fixtures.ts` file provides reusable test utilities and fixtures that extend Playwright's base test functionality.

### Available Fixtures

#### `extendedPage`

A page instance with common utilities and helpers. Use this when you need the standard page object.

```typescript
test("example", async ({ extendedPage }) => {
  await extendedPage.goto("/");
  // ... test code
});
```

#### `gotoAndWait`

Navigate to a URL and wait for network to be idle before proceeding.

```typescript
test("example", async ({ gotoAndWait, page }) => {
  await gotoAndWait("/");
  // Page is loaded and network is idle
});
```

### Using Shared Fixtures

Import test and expect from `./fixtures` instead of `@playwright/test`:

```typescript
import { test, expect } from "./fixtures";

test("my test", async ({ gotoAndWait, page }) => {
  await gotoAndWait("/");
  await expect(page.getByRole("heading")).toBeVisible();
});
```

## Running Tests

### Local Development

```bash
# Run all tests with UI
pnpm --filter web run e2e

# Run tests headlessly
pnpm --filter web run e2e:ci
```

### Run Tagged Test Scenarios

Run smoke tests only:

```bash
pnpm --filter web run e2e --project=smoke
```

Run billing tests only:

```bash
pnpm --filter web run e2e --project=billing
```

Run onboarding tests only:

```bash
pnpm --filter web run e2e --project=onboarding
```

### Run Tests with Grep Pattern

Run all tests with @smoke tag:

```bash
pnpm --filter web run e2e -- --grep @smoke
```

Run specific test by name:

```bash
pnpm --filter web run e2e -- --grep "home page loads"
```

### Type Checking

```bash
pnpm --filter web run type-check
```

## CI/CD Integration

Tests run automatically on pull requests. The CI workflow:

1. Installs dependencies and Playwright browsers
2. Builds and starts the Next.js application
3. Runs all Playwright tests
4. Uploads artifacts on failure:
   - **HTML Report**: Test results and execution details (30 day retention)
   - **Screenshots**: Captured on test failures (7 day retention)
   - **Videos**: Recorded on test failures (7 day retention)
   - **Traces**: Detailed execution traces for debugging (7 day retention)

### CI Artifacts

When tests fail in CI, several artifacts are automatically uploaded:

- **playwright-report**: Full HTML report with test results
- **playwright-screenshots**: Screenshots from failed tests
- **playwright-videos**: Video recordings of failed tests
- **playwright-traces**: Trace files for detailed debugging

Access these artifacts from the GitHub Actions workflow run page.

### Viewing Traces

To view trace files locally:

```bash
pnpm exec playwright show-trace path/to/trace.zip
```

## Configuration

Playwright configuration is in `playwright.config.ts`. Key settings:

- **CI Mode**: Enables JSON/JUnit reporters, captures screenshots/videos/traces on failure
- **Local Mode**: Minimal reporters, no automatic artifact capture
- **Retries**: 1 retry in CI, 0 retries locally
- **Workers**: 1 worker in CI (serial execution), parallel locally
- **Video Resolution**: 1280x720 in CI

## Best Practices

1. **Use shared fixtures** for common test patterns
2. **Wait for network idle** when navigating to pages
3. **Use descriptive test names** that explain what is being tested
4. **Group related tests** using `test.describe()`
5. **Add setup files** for authentication or global state (name them `*.setup.ts`)

## Adding New Fixtures

To add new fixtures, edit `fixtures.ts`:

```typescript
interface TestFixtures {
  // Add your fixture type
  myFixture: MyType;
}

export const test = base.extend<TestFixtures>({
  myFixture: async ({ page }, use) => {
    // Setup code
    const fixture = createFixture();
    await use(fixture);
    // Teardown code
  },
});
```

## Troubleshooting

### Tests timeout

- Increase timeout in `playwright.config.ts`
- Check if the dev server is running
- Ensure baseURL is correct

### Screenshots not captured

- Screenshots are only captured in CI or when tests fail
- Check `use.screenshot` setting in config

### Traces not available

- Traces are captured on first retry in CI
- Use `trace: "on"` to always capture traces locally
