---
name: tracking-analytics
description: Event tracking with PostHog including user identification, feature flags, A/B testing, and pluggable provider architecture with client hooks, server-side tracking, and PostHog configuration. Use when implementing event tracking, setting up PostHog, or switching analytics providers.
allowed-tools:
  - Read
  - Edit
  - Write
  - Bash
  - Grep
  - Glob
---

# Analytics Skill

This skill provides comprehensive guidance for working with the pluggable analytics system in this project, with PostHog as the default provider.

## Quick Reference

| Component              | Location                                                 |
| ---------------------- | -------------------------------------------------------- |
| Active Provider Export | `apps/web/modules/analytics/index.tsx`                   |
| PostHog Provider       | `apps/web/modules/analytics/provider/posthog/index.tsx`  |
| Client Instrumentation | `apps/web/instrumentation-client.js`                     |
| Provider Integration   | `apps/web/modules/shared/components/ClientProviders.tsx` |
| TypeScript Alias       | `@analytics` -> `./modules/analytics`                    |
| Package Dependency     | `posthog-js` v1.280.1                                    |
| **Tool Analytics**     | `apps/web/modules/tools/analytics/`                      |
| **Server Analytics**   | `packages/api/lib/analytics/`                            |

## Environment Variables

Required in `apps/web/.env.local`:

```bash
NEXT_PUBLIC_POSTHOG_KEY=<your-posthog-project-key>
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**Hosting Options:**

- US: `https://us.i.posthog.com` or `https://i.posthog.com`
- EU: `https://eu.i.posthog.com` (for European data residency)

## Architecture Overview

The analytics system uses a **pluggable provider pattern** that allows swapping analytics services without changing application code.

### Provider Interface

All providers implement the same interface:

```typescript
// Component for initialization (rendered once in ClientProviders)
export function AnalyticsScript(): React.ReactNode;

// Hook for event tracking
export function useAnalytics(): {
  trackEvent: (event: string, data?: Record<string, unknown>) => void;
};
```

### Provider Selection

The active provider is determined by the export in `modules/analytics/index.tsx`:

```typescript
// Currently exports PostHog
export * from "./provider/posthog";
```

To switch providers, change this export to another provider directory.

## Available Providers

| Provider              | Directory             | Required Env Var                  |
| --------------------- | --------------------- | --------------------------------- |
| **PostHog** (default) | `provider/posthog/`   | `NEXT_PUBLIC_POSTHOG_KEY`         |
| Google Analytics      | `provider/google/`    | `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` |
| Mixpanel              | `provider/mixpanel/`  | `NEXT_PUBLIC_MIXPANEL_TOKEN`      |
| Vercel Analytics      | `provider/vercel/`    | (automatic with Vercel)           |
| Pirsch                | `provider/pirsch/`    | `NEXT_PUBLIC_PIRSCH_CODE`         |
| Plausible             | `provider/plausible/` | `NEXT_PUBLIC_PLAUSIBLE_URL`       |
| Umami                 | `provider/umami/`     | (script URL based)                |
| Custom                | `provider/custom/`    | (user-defined)                    |

## PostHog Configuration

### Initialization Options

The PostHog provider is configured in `provider/posthog/index.tsx`:

```typescript
posthog.init(posthogKey, {
  api_host: "https://i.posthog.com",
  person_profiles: "identified_only",
});
```

**Configuration Options:**

- `api_host`: PostHog server endpoint (use `eu.i.posthog.com` for EU)
- `person_profiles`:
  - `"identified_only"` - Only create profiles for identified users (recommended)
  - `"always"` - Create profiles for anonymous users too

### Safety Features

- Gracefully handles missing API key (no errors in dev without config)
- Guards all tracking calls against missing configuration
- Client-side only (no server-side tracking)

## Client-Side Usage

### Basic Event Tracking

```typescript
"use client";

import { useAnalytics } from "@analytics";

export function MyComponent() {
  const { trackEvent } = useAnalytics();

  const handleClick = () => {
    trackEvent("button_clicked", {
      button_name: "signup",
      page: "/home",
    });
  };

  return <button onClick={handleClick}>Sign Up</button>;
}
```

### User Identification (PostHog-specific)

For user identification, import PostHog directly:

```typescript
"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import { authClient } from "@repo/auth/client";

export function AnalyticsIdentifier() {
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      posthog.identify(session.user.id, {
        email: session.user.email,
        name: session.user.name,
      });
    } else {
      posthog.reset();
    }
  }, [session]);

  return null;
}
```

## Integration Points

### ClientProviders

Analytics is initialized via `<AnalyticsScript />` in the root providers:

```typescript
// apps/web/modules/shared/components/ClientProviders.tsx
import { AnalyticsScript } from "@analytics";

export function ClientProviders({ children }) {
  return (
    <>
      <AnalyticsScript />
      {/* other providers */}
      {children}
    </>
  );
}
```

### TypeScript Path Alias

The `@analytics` alias is configured in `apps/web/tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@analytics": ["./modules/analytics"]
    }
  }
}
```

## When to Use This Skill

Invoke this skill when:

- Implementing event tracking in components
- Setting up PostHog for a new project
- Switching between analytics providers
- Adding user identification to analytics
- Debugging analytics events
- Understanding the analytics architecture
- Creating a custom analytics provider
- Configuring PostHog options (EU hosting, person profiles)
- Adding analytics to new tools (see `tool-analytics.md`)

## Common Event Patterns

```typescript
// Authentication events
trackEvent("user_signed_up", { method: "email" });
trackEvent("user_logged_in", { method: "google" });
trackEvent("user_logged_out");

// Feature engagement
trackEvent("feature_used", { feature: "dark_mode", action: "enabled" });
trackEvent("onboarding_step_completed", { step: 2, total_steps: 5 });

// Conversion events
trackEvent("checkout_started", { plan: "pro", billing: "monthly" });
trackEvent("subscription_created", { plan: "pro", value: 29 });

// Error events
trackEvent("error_occurred", { code: "PAYMENT_FAILED", message: "Card declined" });
```

## Debugging

- Check browser console for PostHog initialization
- Use PostHog's Toolbar (enabled in project settings) for live event inspection
- Verify `NEXT_PUBLIC_POSTHOG_KEY` is set correctly
- Check Network tab for requests to `i.posthog.com`
- Run `posthog.debug()` in browser console for verbose logging

## Tool Usage Analytics

For comprehensive documentation on tracking tool usage for anonymous and authenticated users, see `tool-analytics.md` in this skill directory.

**Quick overview:**

- **Client-side**: `useToolAnalytics` hook for event tracking with session management
- **Server-side**: `trackToolServerEvent` for backend job processing events
- **Anonymous users**: localStorage session IDs for tracking before authentication
- **Conversion tracking**: Track signup and purchase events from tools

See `tool-analytics.md` for detailed implementation guide and examples.

## Related Skills

- **architecture**: Overall codebase structure and module organization
- **better-auth**: User session integration for analytics identification
- **sub-app**: Adding analytics to new sub-applications/tools
- **feature-flags**: PostHog feature flags and A/B testing integration
- **cli**: CLI commands for inspecting feature flags via PostHog

## Additional Resources

- PostHog docs: https://posthog.com/docs
- PostHog JS SDK: https://posthog.com/docs/libraries/js
- See `examples.md` in this skill directory for detailed usage examples
