# Testing Patterns for Sub-Apps

This document provides comprehensive testing patterns for sub-applications, covering unit tests, integration tests, and best practices.

## Testing Overview

Sub-app testing typically involves:

1. **Unit tests** for API procedures
2. **Integration tests** for job processors
3. **Database tests** using Testcontainers
4. **End-to-end tests** for frontend flows

## Unit Tests for Procedures

Test individual API procedures in isolation:

```typescript
// packages/api/modules/my-tool/router.test.ts
import { describe, it, expect } from "vitest";
import { myToolRouter } from "./router";

describe("myToolRouter", () => {
  it("creates a job", async () => {
    const result = await myToolRouter.jobs.create({
      input: { parameter1: "test" },
      context: { headers: new Headers() },
    });

    expect(result.job).toBeDefined();
    expect(result.job.toolSlug).toBe("my-tool");
  });

  it("validates input", async () => {
    await expect(
      myToolRouter.jobs.create({
        input: { parameter1: "" }, // Invalid input
        context: { headers: new Headers() },
      })
    ).rejects.toThrow();
  });

  it("returns job status", async () => {
    // Create a job
    const createResult = await myToolRouter.jobs.create({
      input: { parameter1: "test" },
      context: { headers: new Headers() },
    });

    // Get job status
    const getResult = await myToolRouter.jobs.get({
      input: { jobId: createResult.job.id },
      context: { headers: new Headers() },
    });

    expect(getResult.job.id).toBe(createResult.job.id);
    expect(getResult.job.status).toBe("PENDING");
  });
});
```

## Integration Tests for Processors

Test job processors with real database interactions:

```typescript
// packages/api/modules/my-tool/lib/processor.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { processMyToolJob } from "./processor";
import { createToolJob, getToolJobById } from "@repo/database";

describe("processMyToolJob", () => {
  beforeEach(async () => {
    // Clean up test data
    // Note: Use Testcontainers for isolated database instance
  });

  it("processes job successfully", async () => {
    // Create test job
    const job = await createToolJob({
      toolSlug: "my-tool",
      input: { parameter1: "test" },
    });

    // Process job
    await processMyToolJob(job.id);

    // Verify results
    const processed = await getToolJobById(job.id);
    expect(processed?.status).toBe("COMPLETED");
    expect(processed?.output).toBeDefined();
  });

  it("handles errors gracefully", async () => {
    // Create test job with invalid input
    const job = await createToolJob({
      toolSlug: "my-tool",
      input: { parameter1: "invalid-input-that-causes-error" },
    });

    // Process job (should fail)
    await processMyToolJob(job.id);

    // Verify error handling
    const processed = await getToolJobById(job.id);
    expect(processed?.status).toBe("FAILED");
    expect(processed?.error).toBeDefined();
  });

  it("respects max attempts", async () => {
    const job = await createToolJob({
      toolSlug: "my-tool",
      input: { parameter1: "fail" },
      maxAttempts: 3,
    });

    // Process multiple times
    for (let i = 0; i < 3; i++) {
      await processMyToolJob(job.id);
    }

    const processed = await getToolJobById(job.id);
    expect(processed?.attempts).toBe(3);
    expect(processed?.status).toBe("FAILED");
  });
});
```

## Database Integration Tests

Use Testcontainers for isolated database testing:

```typescript
// packages/api/modules/my-tool/database.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@repo/database";
import { PostgreSqlContainer } from "@testcontainers/postgresql";

describe("MyTool Database Operations", () => {
  let container: PostgreSqlContainer;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer()
      .withDatabase("testdb")
      .start();

    // Connect Prisma client
    prisma = new PrismaClient({
      datasources: {
        db: { url: container.getConnectionString() },
      },
    });

    // Run migrations
    await prisma.$executeRaw`CREATE TABLE ...`;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await container.stop();
  });

  it("creates and retrieves jobs", async () => {
    // Test database operations
  });
});
```

## Mocking Job Queue

For unit tests, mock pg-boss instead of running a real job queue:

```typescript
// packages/api/modules/my-tool/queue.test.ts
import { describe, it, expect, vi } from "vitest";

// Mock pg-boss
vi.mock("pg-boss", () => ({
  default: class {
    async start() {}
    async send() { return "mock-job-id"; }
    async fetch() { return null; }
  },
}));

describe("Job Queue", () => {
  it("enqueues jobs", async () => {
    // Test job enqueuing with mocked pg-boss
  });
});
```

## Frontend Testing

Test React components with React Testing Library:

```typescript
// apps/web/modules/saas/tools/my-tool/MyToolClient.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MyToolClient } from "./MyToolClient";

describe("MyToolClient", () => {
  it("renders input form", () => {
    render(<MyToolClient />);
    expect(screen.getByPlaceholderText("Enter input...")).toBeInTheDocument();
  });

  it("submits form", async () => {
    render(<MyToolClient />);
    const input = screen.getByPlaceholderText("Enter input...");
    const button = screen.getByText("Submit");

    fireEvent.change(input, { target: { value: "test" } });
    fireEvent.click(button);

    // Assert API call was made
  });
});
```

## E2E Testing with Playwright

Test complete user flows:

```typescript
// apps/web/e2e/my-tool.spec.ts
import { test, expect } from "@playwright/test";

test.describe("My Tool", () => {
  test("completes full workflow", async ({ page }) => {
    // Navigate to tool
    await page.goto("/app/tools/my-tool");

    // Fill in form
    await page.fill('input[placeholder="Enter input..."]', "test");

    // Submit
    await page.click('button:has-text("Submit")');

    // Wait for job completion
    await page.waitForSelector('text=Job completed');

    // Verify results
    await expect(page.locator(".results")).toBeVisible();
  });

  test("handles errors", async ({ page }) => {
    await page.goto("/app/tools/my-tool");
    await page.fill('input[placeholder="Enter input..."]', "invalid");
    await page.click('button:has-text("Submit")');

    // Verify error message
    await expect(page.locator(".error")).toContainText("Invalid input");
  });
});
```

## Best Practices

### Test Organization

- **Co-locate tests**: Place `.test.ts` files next to the code they test
- **Group by domain**: Use `describe` blocks to group related tests
- **Clear naming**: Use descriptive test names that explain what's being tested

### Test Coverage

- **Critical paths**: Prioritize testing error handling and edge cases
- **Happy path**: Always test the expected success scenario
- **Validation**: Test input validation thoroughly
- **State transitions**: Test job status transitions (PENDING → PROCESSING → COMPLETED/FAILED)

### Database Testing

- **Isolation**: Use Testcontainers for isolated database instances
- **Cleanup**: Always clean up test data in `beforeEach` or `afterEach`
- **Transactions**: Use transactions to rollback test changes when possible

### Mock Strategy

- **External APIs**: Always mock external API calls
- **Time-dependent**: Mock `Date.now()` for consistent test results
- **File system**: Mock file operations when testing upload/download logic

### CI Integration

- **Fast tests first**: Run unit tests before slower integration tests
- **Parallel execution**: Use `pnpm test -- --runInBand` for serial execution when needed
- **Coverage thresholds**: Maintain minimum coverage levels (configured in `tooling/test/coverage-thresholds.ts`)

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific workspace
pnpm --filter @repo/api test

# Run tests in serial (for noisy environments)
pnpm test -- --runInBand

# Run tests with coverage
pnpm test:ci

# Run E2E tests
pnpm --filter web run e2e

# Run E2E tests headlessly (CI mode)
pnpm --filter web run e2e:ci

# Target specific test
pnpm test -- --grep "my-tool"
```

## Related Documentation

- `CLAUDE.md` - Main testing documentation
- `docs/postgres-integration-testing.md` - Testcontainers setup
- `tooling/test/coverage-thresholds.ts` - Coverage configuration
