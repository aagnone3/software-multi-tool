# Postgres Integration Testing

## Decision Summary

- We will use [Testcontainers](https://testcontainers.com/) to provision Postgres for integration tests instead of docker-compose.
- The harness lives in `packages/database/tests/postgres-test-harness.ts` and exposes an async `createPostgresTestHarness()` helper that:
  - boots a disposable Postgres 17 instance,
  - runs `prisma db push` against the container,
  - returns a connected `PrismaClient`,
  - provides a `resetDatabase()` helper that truncates all Prisma-managed tables between tests, and
  - tears everything down via `cleanup()`.
- This keeps the lifecycle inside the Vitest process and gives every suite a clean database without manual scripts or long-lived Docker compose stacks.

## Why Testcontainers?

| Option | Pros | Cons |
| --- | --- | --- |
| Testcontainers | Declarative API that lives in the test file, automatic cleanup, supports parallel CI via ephemeral containers, no extra scripts | Requires Docker daemon available locally/CI, slightly slower first run while image pulls |
| docker-compose | Familiar workflow, easy to inspect container state while debugging | Needs separate orchestration scripts, harder to reset state between tests, risk of state leaking across suites, more manual teardown |

Testcontainers lets us codify the environment in TypeScript, version it alongside the tests, and keep suite orchestration self-contained. We can keep using docker-compose manually for exploratory debugging, but integration automation should default to Testcontainers.

## Usage Guidelines

- Import the harness in integration suites: `import { createPostgresTestHarness } from "../../tests/postgres-test-harness";`
- Call `createPostgresTestHarness()` in a `beforeAll` hook, then:
  - store the returned `prisma` client for fixtures,
  - call `resetDatabase()` in `beforeEach` for a clean state,
  - call `cleanup()` in `afterAll` to terminate the container.
- The helper sets and restores `process.env.DATABASE_URL`, so existing Prisma clients continue to work without code changes.
- Integration suites should be marked sequential (`describe.sequential`) because a single Postgres instance backs the file.

## Running the Tests

- Ensure Docker Desktop or another Docker runtime is running.
- Execute only the integration specs for the database workspace:

  ```bash
  pnpm --filter @repo/database run test:integration
  ```

- The script currently targets `prisma/queries/organizations.integration.test.ts`; add additional paths (or split into dedicated scripts) as more database integration suites land.
- Full workspace test runs (`pnpm test`) also exercise the integration suite, so make sure Docker is available when running the full pipeline locally or in CI.

## Next Steps

- Extend fixtures to cover other data access layers (Drizzle) once higher-level tests are added.
- Consider adding lightweight factories or seed builders if more suites adopt the harness.
