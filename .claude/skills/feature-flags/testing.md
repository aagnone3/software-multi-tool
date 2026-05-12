# Feature Flags Testing

## Unit Tests (Mocking)

```typescript
import { vi } from "vitest";

// Mock the entire module
vi.mock("@repo/api/lib/feature-flags", () => ({
  getFeatureFlag: vi.fn().mockResolvedValue("variant-a"),
  isFeatureEnabled: vi.fn().mockResolvedValue(true),
  getAllFeatureFlags: vi.fn().mockResolvedValue({ "my-flag": true }),
}));
```

## Client-Side Tests

```tsx
import { render } from "@testing-library/react";
import { FeatureFlagProvider } from "@analytics/feature-flags";

function renderWithFlags(ui: React.ReactNode, flags = {}) {
  return render(
    <FeatureFlagProvider bootstrappedFlags={flags}>
      {ui}
    </FeatureFlagProvider>
  );
}

it("shows feature when flag is enabled", () => {
  const { getByText } = renderWithFlags(
    <MyComponent />,
    { "new-feature": true }
  );
  expect(getByText("New Feature")).toBeInTheDocument();
});
```

## Integration Tests

The service is auto-disabled in test environment (`NODE_ENV=test`):

```typescript
// In tests, flags return defaults without calling PostHog
const result = await isFeatureEnabled("any-flag", "user-123");
// → false (default, no API call made)
```

## Related

- [SKILL.md](SKILL.md) — main feature flags skill
- `packages/api/lib/feature-flags/` — server-side implementation
- `apps/web/modules/analytics/provider/posthog/feature-flags.tsx` — client-side hooks
