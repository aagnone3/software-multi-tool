---
name: analytics
description: Use this skill when implementing event tracking, working with PostHog analytics, swapping analytics providers, or adding analytics to new features. Provides guidance on the pluggable analytics system and PostHog configuration.
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

## Tool Usage Analytics (Anonymous + Authenticated)

The tool usage analytics system provides comprehensive tracking for public tools that can be used by both authenticated and anonymous users. It consists of client-side hooks and server-side tracking.

### Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Client-Side                               │
│  ┌──────────────────┐    ┌─────────────────────────────────┐   │
│  │ useToolAnalytics │───▶│ useAnalytics (from @analytics) │   │
│  │ (tool-specific)  │    │ (PostHog provider)              │   │
│  └──────────────────┘    └─────────────────────────────────┘   │
│           │                                                      │
│           │ sessionId (localStorage)                             │
│           ▼                                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    API Request                            │   │
│  │         (includes sessionId for anonymous users)          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Server-Side                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              trackToolServerEvent()                       │   │
│  │    (uses userId for auth, sessionId for anonymous)        │   │
│  └──────────────────────────────────────────────────────────┘   │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              ServerAnalytics.capture()                    │   │
│  │           (direct PostHog API calls)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Client-Side: useToolAnalytics Hook

Location: `apps/web/modules/tools/analytics/use-tool-analytics.ts`

This hook provides tool-specific event tracking with automatic session management:

```typescript
"use client";

import { useToolAnalytics } from "../../../modules/tools/analytics";

export function MyTool() {
  const {
    trackToolViewed,
    trackUploadStarted,
    trackProcessingStarted,
    trackProcessingCompleted,
    trackProcessingFailed,
    trackResultDownloaded,
    sessionId,
  } = useToolAnalytics({ toolName: "my-tool" });

  // Track page view on mount
  useEffect(() => {
    trackToolViewed();
  }, [trackToolViewed]);

  const handleSubmit = async () => {
    const startTime = Date.now();
    trackProcessingStarted({ jobId: "pending", fromCache: false });

    try {
      const result = await processJob();
      trackProcessingCompleted({
        jobId: result.id,
        processingDurationMs: Date.now() - startTime,
        fromCache: false,
      });
    } catch (error) {
      trackProcessingFailed({
        jobId: "failed",
        errorType: "processing_error",
        processingDurationMs: Date.now() - startTime,
      });
    }
  };
}
```

**Available Events:**

| Method | Event Name | Properties |
| ------ | ---------- | ---------- |
| `trackToolViewed()` | `tool_viewed` | `page_path`, `referrer` |
| `trackUploadStarted()` | `tool_upload_started` | `file_type`, `file_size` |
| `trackProcessingStarted()` | `tool_processing_started` | `job_id`, `from_cache` |
| `trackProcessingCompleted()` | `tool_processing_completed` | `job_id`, `processing_duration_ms`, `from_cache` |
| `trackProcessingFailed()` | `tool_processing_failed` | `job_id`, `error_type`, `processing_duration_ms` |
| `trackResultDownloaded()` | `tool_result_downloaded` | `job_id`, `download_format` |

**Base Properties (included in all events):**

- `tool_name`: Tool identifier (e.g., "news-analyzer")
- `session_id`: Anonymous session ID from localStorage
- `is_authenticated`: Whether user is logged in

### Server-Side: trackToolServerEvent

Location: `packages/api/lib/analytics/server-analytics.ts`

Server-side tracking for tool job processing events:

```typescript
import { trackToolServerEvent } from "../../../lib/analytics";

// In job creation handler
trackToolServerEvent("tool_job_created", {
  tool_name: toolSlug,
  job_id: job.id,
  is_authenticated: !!userId,
  session_id: sessionId,
  user_id: userId,
  input_type: "url" | "text" | "file",
}).catch(() => {
  // Non-blocking - ignore errors
});

// In job runner
trackToolServerEvent("tool_processing_completed", {
  tool_name: toolSlug,
  job_id: jobId,
  is_authenticated: !!userId,
  session_id,
  user_id: userId,
  processing_duration_ms: Date.now() - startTime,
}).catch(() => {});
```

**Server Events:**

| Event | When Triggered |
| ----- | -------------- |
| `tool_job_created` | New job created via API |
| `tool_processing_started` | Job runner begins processing |
| `tool_processing_completed` | Job completes successfully |
| `tool_processing_failed` | Job fails with error |
| `tool_cache_hit` | Cached result returned |

### Anonymous Session Management

Sessions are managed via localStorage for anonymous users:

```typescript
// Client-side session ID (in useToolAnalytics)
const SESSION_ID_KEY = "tool_analytics_session_id";

function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}
```

The session ID is:

- Persisted across page loads
- Sent to server with API requests
- Used as `distinctId` for PostHog when user is anonymous
- Replaced by `userId` when user authenticates

### Conversion Tracking

Location: `apps/web/modules/tools/analytics/use-conversion-tracking.ts`

Track conversion events when anonymous users sign up or purchase:

```typescript
import { useConversionTracking } from "../../../modules/tools/analytics";

function SignupPrompt() {
  const { trackCreditsStarted, trackCreditsCompleted, trackAccountCreated } =
    useConversionTracking({ toolName: "news-analyzer" });

  const handleSignup = async () => {
    trackAccountCreated({ source: "tool_upsell" });
    // ... handle signup
  };

  const handlePurchase = async () => {
    trackCreditsStarted({ creditAmount: 100 });
    // ... process payment
    trackCreditsCompleted({ creditAmount: 100 });
  };
}
```

**Conversion Events:**

- `credits_purchase_started`: User begins credit purchase
- `credits_purchase_completed`: Credit purchase successful
- `account_created_from_tool`: Anonymous user signs up from tool

### Integration Example: News Analyzer

The news-analyzer tool demonstrates full analytics integration:

```typescript
// apps/web/components/tools/news-analyzer/news-analyzer.tsx

export function NewsAnalyzer() {
  const {
    trackToolViewed,
    trackProcessingStarted,
    trackProcessingCompleted,
    trackProcessingFailed,
  } = useToolAnalytics({ toolName: "news-analyzer" });
  const processingStartTime = useRef<number | null>(null);

  // Track page view
  useEffect(() => {
    trackToolViewed();
  }, [trackToolViewed]);

  const handleSubmit = (data) => {
    processingStartTime.current = Date.now();
    trackProcessingStarted({ jobId: "pending", fromCache: false });
    createJobMutation.mutate(data);
  };

  // In mutation success handler:
  // - trackProcessingCompleted({ jobId, processingDurationMs, fromCache })

  // In mutation error handler:
  // - trackProcessingFailed({ jobId, errorType, processingDurationMs })
}
```

### Adding Analytics to a New Tool

1. **Import the hook:**

   ```typescript
   import { useToolAnalytics } from "../../../modules/tools/analytics";
   ```

2. **Initialize with tool name:**

   ```typescript
   const { trackToolViewed, trackProcessingStarted, ... } =
     useToolAnalytics({ toolName: "your-tool-slug" });
   ```

3. **Track page view on mount:**

   ```typescript
   useEffect(() => { trackToolViewed(); }, [trackToolViewed]);
   ```

4. **Track processing lifecycle:**
   - Call `trackProcessingStarted` before API call
   - Call `trackProcessingCompleted` on success
   - Call `trackProcessingFailed` on error

5. **Pass sessionId to API:**

   ```typescript
   const { sessionId } = useToolAnalytics({ toolName: "your-tool" });

   await apiClient.createJob({
     toolSlug: "your-tool",
     input: data,
     sessionId, // Required for anonymous users
   });
   ```

## Related Skills

- **architecture**: Overall codebase structure and module organization
- **better-auth**: User session integration for analytics identification
- **sub-app**: Adding analytics to new sub-applications/tools

## Additional Resources

- PostHog docs: https://posthog.com/docs
- PostHog JS SDK: https://posthog.com/docs/libraries/js
- See `examples.md` in this skill directory for detailed usage examples
