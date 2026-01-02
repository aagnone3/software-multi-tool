# Shared Prisma Seed Utilities

This directory provides reusable seed utilities for creating test data across integration tests. The utilities follow a builder pattern with sensible defaults and override capabilities.

## Quick Start

```typescript
import { buildUser, buildOrganization, buildMember } from '@repo/database/tests/seeds';
import { db } from '@repo/database';

// Create test data with defaults
const user = await db.user.create({ data: buildUser() });
const org = await db.organization.create({ data: buildOrganization() });

// Create with custom values
const admin = await db.user.create({
  data: buildUser({ role: 'admin', emailVerified: true })
});
```

## Available Builders

### `buildUser(overrides?)`

Creates a User object with defaults:

- Random email and ID
- `emailVerified: false`
- `role: 'user'`
- `onboardingComplete: false`

```typescript
const user = buildUser({
  name: 'John Doe',
  email: 'john@example.com',
  emailVerified: true
});
```

### `buildOrganization(overrides?)`

Creates an Organization object with defaults:

- Random name and ID
- `slug: null`
- Current timestamp for `createdAt`

```typescript
const org = buildOrganization({
  name: 'Acme Corp',
  slug: 'acme-corp'
});
```

### `buildMember(organizationId, userId, overrides?)`

Creates a Member relationship with defaults:

- `role: 'member'`
- Current timestamp for `createdAt`

```typescript
const member = buildMember(org.id, user.id, { role: 'owner' });
```

### `buildInvitation(organizationId, inviterId, overrides?)`

Creates an Invitation with defaults:

- Random email
- `status: 'pending'`
- `role: 'member'`
- Expires in 7 days

```typescript
const invitation = buildInvitation(org.id, user.id, {
  email: 'invite@example.com',
  status: 'pending'
});
```

### `buildPurchase(overrides?)`

Creates a Purchase with defaults:

- `type: 'SUBSCRIPTION'`
- Random customer ID and product ID
- `status: 'active'`
- Current timestamps

```typescript
const purchase = buildPurchase({
  organizationId: org.id,
  type: 'ONE_TIME'
});
```

## Utility Functions

### `generateId()`

Generates a random UUID v4 string.

### `generateEmail(prefix?)`

Generates a unique email address for testing.
Default prefix: `'test'`

### `generateName(prefix)`

Generates a unique name for testing with the given prefix.

### `now()`

Returns the current timestamp as a Date object.

### `daysFromNow(days)`

Returns a Date offset by the specified number of days (positive for future, negative for past).

## Fixture Helpers

For more complex scenarios, use the fixture helpers available in `fixtures.js`:

```typescript
import { createFixtures } from '@repo/database/tests/seeds/fixtures';

const fixtures = createFixtures();

// Create organization with owner
const { organization, owner, membership } =
  await fixtures.createOrganizationWithOwner();

// Create complete organization scenario
const scenario = await fixtures.createOrganizationScenario({
  memberCount: 3,
  invitationCount: 2
});
```

**Note:** `createFixtures` is not exported from the main index to avoid initializing the database client during module evaluation. Import it directly from `fixtures.js` when needed.

## Integration Test Example

```typescript
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { createPostgresTestHarness } from '../../tests/postgres-test-harness';
import { buildUser, buildOrganization, buildMember } from '../../tests/seeds';

describe.sequential('my integration tests', () => {
  let harness;

  beforeAll(async () => {
    harness = await createPostgresTestHarness();
  }, 120_000);

  beforeEach(async () => {
    await harness?.resetDatabase();
  });

  afterAll(async () => {
    await harness?.cleanup();
  }, 120_000);

  it('creates an organization with members', async () => {
    const prisma = harness.prisma;

    const owner = await prisma.user.create({ data: buildUser() });
    const org = await prisma.organization.create({
      data: buildOrganization({ name: 'Test Org' })
    });
    await prisma.member.create({
      data: buildMember(org.id, owner.id, { role: 'owner' })
    });

    // Your assertions here
  });
});
```

## Architecture Notes

1. **No Side Effects**: All builders return plain objects without database interaction
2. **Type Safe**: Uses Prisma-generated types for full type safety
3. **No Client Import**: Builders don't import the `db` client to avoid early initialization
4. **Enum as Strings**: Enums like `PurchaseType` are defined as string unions to avoid importing Prisma client
5. **Works with Test Harness**: Designed to work seamlessly with the Postgres test harness

## Adding New Builders

To add a builder for a new model:

1. Create a file in `builders/` (e.g., `builders/session.ts`)
2. Define defaults and types
3. Implement the builder function
4. Export from `index.ts`
5. Add documentation here

Example structure:

```typescript
import type { Prisma } from "../../../prisma/generated/client/index.js";
import { generateId, now } from "../utils.js";

const MODEL_DEFAULTS = {
  id: () => generateId(),
  createdAt: () => now(),
  // ... other defaults
} as const;

export type ModelSeedData = Omit<Prisma.ModelCreateInput, "relations">;

export function buildModel(overrides: Partial<ModelSeedData> = {}): ModelSeedData {
  return {
    id: overrides.id ?? MODEL_DEFAULTS.id(),
    // ... apply all defaults
  };
}
```
