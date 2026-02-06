---
name: managing-feature-flags
description: Provides feature flag implementation guidance for A/B testing, progressive rollouts, and conditional feature access. Covers PostHog feature flag integration for both server-side (SSR/API) and client-side (React hooks) evaluation.
allowed-tools:
  - Read
  - Edit
  - Write
  - Bash
  - Grep
  - Glob
---

# Feature Flags Skill

This skill provides comprehensive guidance for implementing feature flags using PostHog in this project. The system supports both server-side evaluation (for SSR and API routes) and client-side evaluation (React hooks with bootstrapping to prevent UI flicker).

## Quick Reference

| Component | Location |
| --------- | -------- |
| **Server-Side Service** | `packages/api/lib/feature-flags/server-feature-flags.ts` |
| **Bootstrap Helpers** | `packages/api/lib/feature-flags/bootstrap.ts` |
| **Client Hooks** | `apps/web/modules/analytics/provider/posthog/feature-flags.tsx` |
| **Package Export** | `packages/api/lib/feature-flags/index.ts` |
| **Server SDK** | `posthog-node` |
| **Client SDK** | `posthog-js` (shared with analytics) |

## Environment Variables

Required in `apps/web/.env.local`:

```bash
# PostHog API key (same as analytics)
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_key

# PostHog host (required for server-side)
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Server-side requires the project API key (same as client key for PostHog)
POSTHOG_API_KEY=phc_your_project_key
```

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                     Server-Side (SSR/API)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           ServerFeatureFlagService                        │   │
│  │  • PostHog Node SDK integration                           │   │
│  │  • In-memory caching (5-min TTL per user)                 │   │
│  │  • "Fail open with defaults" pattern                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│           │                                                      │
│           │ getBootstrapFlags(userId)                            │
│           ▼                                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Bootstrap Helpers                            │   │
│  │  • Serialize flags for client hydration                   │   │
│  │  • Prevent UI flicker on initial render                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ SSR props / RSC data
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Client-Side (React)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           FeatureFlagProvider                             │   │
│  │  • Bootstrapped with server-evaluated flags               │   │
│  │  • Subscribes to PostHog for live updates                 │   │
│  │  • Graceful fallback if provider not present              │   │
│  └──────────────────────────────────────────────────────────┘   │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              React Hooks                                  │   │
│  │  • useFeatureFlag(key, default)                           │   │
│  │  • useIsFeatureEnabled(key, default)                      │   │
│  │  • useFeatureFlags() - all flags                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Server-Side Usage

### Basic Flag Evaluation

```typescript
import {
  getFeatureFlag,
  isFeatureEnabled,
  getAllFeatureFlags,
} from "@repo/api/lib/feature-flags";

// Get a flag value (string variant or boolean)
const variant = await getFeatureFlag("experiment-checkout", userId, {
  defaultValue: "control",
});

// Check if a flag is enabled (boolean)
const showNewUI = await isFeatureEnabled("new-dashboard", userId);

// Get all flags for a user (useful for bootstrapping)
const allFlags = await getAllFeatureFlags(userId);
```

### With Person Properties

Target flags based on user attributes:

```typescript
const variant = await getFeatureFlag("pricing-experiment", userId, {
  properties: {
    plan: user.plan,
    company_size: user.organization?.size,
    created_at: user.createdAt.toISOString(),
  },
  defaultValue: "control",
});
```

### With Groups (B2B)

Target flags at the organization level:

```typescript
const enabled = await isFeatureEnabled("enterprise-feature", userId, {
  groups: {
    company: user.organizationId,
  },
});
```

### Error Handling ("Fail Open")

The service gracefully handles errors by returning default values:

```typescript
// If PostHog is unreachable, returns "control" instead of throwing
const variant = await getFeatureFlag("risky-experiment", userId, {
  defaultValue: "control",
});

// If PostHog is unreachable, returns false instead of throwing
const enabled = await isFeatureEnabled("new-feature", userId);
// → false (default)
```

### Caching Behavior

- Flags are cached per-user for 5 minutes (configurable)
- Cache is automatically invalidated on TTL expiry
- Manual cache clearing available:

```typescript
import { serverFeatureFlags } from "@repo/api/lib/feature-flags";

// Clear cache for specific user
serverFeatureFlags.clearCache(userId);

// Clear all cached flags
serverFeatureFlags.clearCache();
```

## Client-Side Usage

### Setup: FeatureFlagProvider

Wrap your app with the provider, passing bootstrapped flags from the server:

```tsx
// In layout.tsx (Server Component)
import { getAllFeatureFlags } from "@repo/api/lib/feature-flags";
import { FeatureFlagProvider } from "@analytics/feature-flags";

export default async function Layout({ children }) {
  const session = await auth();
  const flags = session?.user
    ? await getAllFeatureFlags(session.user.id)
    : {};

  return (
    <FeatureFlagProvider
      bootstrappedFlags={flags}
      distinctId={session?.user?.id}
    >
      {children}
    </FeatureFlagProvider>
  );
}
```

### Hook: useFeatureFlag

Get a single flag value:

```tsx
"use client";

import { useFeatureFlag } from "@analytics/feature-flags";

export function ExperimentComponent() {
  const variant = useFeatureFlag("checkout-experiment", "control");

  if (variant === "variant-a") {
    return <NewCheckout />;
  }
  return <OriginalCheckout />;
}
```

### Hook: useIsFeatureEnabled

Boolean check for feature toggles:

```tsx
"use client";

import { useIsFeatureEnabled } from "@analytics/feature-flags";

export function Dashboard() {
  const showNewWidget = useIsFeatureEnabled("new-dashboard-widget");

  return (
    <div>
      <MainContent />
      {showNewWidget && <NewWidget />}
    </div>
  );
}
```

### Hook: useFeatureFlags

Get all flags (useful for debugging):

```tsx
"use client";

import { useFeatureFlags } from "@analytics/feature-flags";

export function DebugPanel() {
  const { flags, isLoaded } = useFeatureFlags();

  return (
    <pre>
      Loaded: {isLoaded ? "Yes" : "No"}
      {JSON.stringify(flags, null, 2)}
    </pre>
  );
}
```

### Graceful Degradation

Hooks work without the provider (return defaults):

```tsx
// This component works even without FeatureFlagProvider
function SafeComponent() {
  // Returns false if provider is missing
  const enabled = useIsFeatureEnabled("feature", false);
  return enabled ? <Feature /> : null;
}
```

## Common Patterns

### Progressive Rollout

```typescript
// In PostHog: Set flag to 10% rollout
const enabled = await isFeatureEnabled("new-algorithm", userId);
if (enabled) {
  return newAlgorithm(data);
}
return legacyAlgorithm(data);
```

### A/B Testing with Variants

```typescript
// In PostHog: Create multivariate flag with "control", "variant-a", "variant-b"
const variant = await getFeatureFlag("pricing-page", userId, {
  defaultValue: "control",
});

switch (variant) {
  case "variant-a":
    return <PricingPageA />;
  case "variant-b":
    return <PricingPageB />;
  default:
    return <PricingPageControl />;
}
```

### Feature Gates by Plan

```typescript
const canUseAdvancedFeature = await isFeatureEnabled("advanced-analytics", userId, {
  properties: {
    plan: user.subscription?.plan ?? "free",
  },
});
```

### Kill Switch

```typescript
// In PostHog: Create boolean flag, default OFF
// Turn ON to disable problematic feature
const isDisabled = await isFeatureEnabled("disable-payments", userId);
if (isDisabled) {
  throw new Error("Payments temporarily disabled for maintenance");
}
```

## Testing

### Unit Tests (Mocking)

```typescript
import { vi } from "vitest";

// Mock the entire module
vi.mock("@repo/api/lib/feature-flags", () => ({
  getFeatureFlag: vi.fn().mockResolvedValue("variant-a"),
  isFeatureEnabled: vi.fn().mockResolvedValue(true),
  getAllFeatureFlags: vi.fn().mockResolvedValue({ "my-flag": true }),
}));
```

### Client-Side Tests

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

### Integration Tests

The service is auto-disabled in test environment (`NODE_ENV=test`):

```typescript
// In tests, flags return defaults without calling PostHog
const result = await isFeatureEnabled("any-flag", "user-123");
// → false (default, no API call made)
```

## Debugging

### Check Service Status

```typescript
import { serverFeatureFlags } from "@repo/api/lib/feature-flags";

console.log("Feature flags enabled:", serverFeatureFlags.isEnabled());
```

### Verify Flag Values

```typescript
// Server-side
const flags = await getAllFeatureFlags(userId);
console.log("User flags:", flags);

// Client-side (browser console)
import posthog from "posthog-js";
console.log(posthog.featureFlags.getFlagVariants());
```

### PostHog Dashboard

1. Go to PostHog → Feature Flags
2. Check flag configuration and rollout percentage
3. View flag calls in Activity tab
4. Use "Test flag" to evaluate for specific users

## When to Use This Skill

Invoke this skill when:

- Implementing a new feature flag
- Setting up A/B tests or experiments
- Creating progressive rollouts
- Adding feature gates based on user properties
- Debugging flag evaluation
- Understanding the bootstrapping flow
- Writing tests involving feature flags

## Related Skills

- **analytics**: PostHog event tracking and user identification
- **better-auth**: User session for distinctId
- **architecture**: Overall system design
- **cli**: CLI commands for inspecting feature flags
- **tools**: Feature gating for tools by plan tier
- **sub-app**: Adding feature flags to new tools
