# Analytics Examples

Practical examples for implementing analytics with the pluggable provider system and PostHog.

## Table of Contents

1. [Basic Event Tracking](#basic-event-tracking)
2. [Tracking with Properties](#tracking-with-properties)
3. [User Identification](#user-identification)
4. [Switching Analytics Providers](#switching-analytics-providers)
5. [Creating a Custom Provider](#creating-a-custom-provider)
6. [Common Event Patterns](#common-event-patterns)
7. [Testing Analytics Events](#testing-analytics-events)
8. [Debugging Tips](#debugging-tips)

---

## Basic Event Tracking

Track simple events using the `useAnalytics` hook:

```typescript
"use client";

import { useAnalytics } from "@analytics";

export function SignupButton() {
  const { trackEvent } = useAnalytics();

  const handleClick = () => {
    trackEvent("signup_button_clicked");
    // ... signup logic
  };

  return <button onClick={handleClick}>Sign Up</button>;
}
```

---

## Tracking with Properties

Add metadata to events for richer analytics:

```typescript
"use client";

import { useAnalytics } from "@analytics";

export function PricingCard({ plan, price }: { plan: string; price: number }) {
  const { trackEvent } = useAnalytics();

  const handleSelect = () => {
    trackEvent("pricing_plan_selected", {
      plan_name: plan,
      price_usd: price,
      billing_cycle: "monthly",
      source: "pricing_page",
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <button onClick={handleSelect}>
      Select {plan} - ${price}/mo
    </button>
  );
}
```

---

## User Identification

### Identify Users on Login (PostHog-specific)

Create a component that identifies users when they log in:

```typescript
"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import { authClient } from "@repo/auth/client";

export function AnalyticsIdentifier() {
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      // Identify the user with PostHog
      posthog.identify(session.user.id, {
        email: session.user.email,
        name: session.user.name,
        created_at: session.user.createdAt,
      });
    } else {
      // Reset identity on logout
      posthog.reset();
    }
  }, [session]);

  return null;
}
```

### Add to ClientProviders

```typescript
// apps/web/modules/shared/components/ClientProviders.tsx
import { AnalyticsScript } from "@analytics";
import { AnalyticsIdentifier } from "./AnalyticsIdentifier";

export function ClientProviders({ children }) {
  return (
    <>
      <AnalyticsScript />
      <AnalyticsIdentifier />
      {children}
    </>
  );
}
```

---

## Switching Analytics Providers

### Step 1: Update the Export

Edit `apps/web/modules/analytics/index.tsx`:

```typescript
// Before (PostHog):
export * from "./provider/posthog";

// After (e.g., Mixpanel):
export * from "./provider/mixpanel";
```

### Step 2: Set Environment Variables

Update `apps/web/.env.local` with the new provider's credentials:

```bash
# Remove or comment out PostHog
# NEXT_PUBLIC_POSTHOG_KEY=...

# Add new provider
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token
```

### Step 3: Restart Development Server

```bash
pnpm dev
```

No other code changes needed - the `useAnalytics` hook interface remains the same.

---

## Creating a Custom Provider

### Step 1: Create Provider Directory

```bash
mkdir -p apps/web/modules/analytics/provider/my-provider
```

### Step 2: Implement Provider Interface

Create `apps/web/modules/analytics/provider/my-provider/index.tsx`:

```typescript
"use client";

import { useEffect } from "react";

const apiKey = process.env.NEXT_PUBLIC_MY_ANALYTICS_KEY;

export function AnalyticsScript() {
  useEffect(() => {
    if (!apiKey) {
      console.warn("My Analytics: API key not configured");
      return;
    }

    // Initialize your analytics SDK here
    // Example: MyAnalytics.init(apiKey);
    console.log("My Analytics initialized");
  }, []);

  return null;
}

export function useAnalytics() {
  const trackEvent = (event: string, data?: Record<string, unknown>) => {
    if (!apiKey) {
      return;
    }

    // Send event to your analytics service
    // Example: MyAnalytics.track(event, data);
    console.log("Track:", event, data);
  };

  return { trackEvent };
}
```

### Step 3: Update Export

Edit `apps/web/modules/analytics/index.tsx`:

```typescript
export * from "./provider/my-provider";
```

---

## Common Event Patterns

### Authentication Events

```typescript
const { trackEvent } = useAnalytics();

// Signup
trackEvent("user_signed_up", {
  method: "email", // or "google", "github", "magic_link"
  referrer: document.referrer,
});

// Login
trackEvent("user_logged_in", {
  method: "password",
  remember_me: true,
});

// Logout
trackEvent("user_logged_out");

// Password reset
trackEvent("password_reset_requested", { email_domain: "gmail.com" });
trackEvent("password_reset_completed");
```

### Feature Engagement

```typescript
// Feature usage
trackEvent("feature_used", {
  feature: "dark_mode",
  action: "enabled",
});

// Onboarding
trackEvent("onboarding_started");
trackEvent("onboarding_step_completed", {
  step: 2,
  step_name: "profile_setup",
  total_steps: 5,
});
trackEvent("onboarding_completed", {
  duration_seconds: 120,
  steps_skipped: 0,
});
```

### Conversion Events

```typescript
// E-commerce / Subscription
trackEvent("checkout_started", {
  plan: "pro",
  billing: "monthly",
  value: 29,
  currency: "USD",
});

trackEvent("subscription_created", {
  plan: "pro",
  billing: "yearly",
  value: 290,
  discount_applied: true,
});

trackEvent("subscription_cancelled", {
  plan: "pro",
  reason: "too_expensive",
  months_subscribed: 3,
});
```

### Error Tracking

```typescript
// Application errors
trackEvent("error_occurred", {
  error_type: "PAYMENT_FAILED",
  error_message: "Card declined",
  page: "/checkout",
});

// Form validation errors
trackEvent("form_validation_failed", {
  form: "signup",
  fields: ["email", "password"],
  error_count: 2,
});
```

### Navigation & Engagement

```typescript
// Page views (if not using PostHog auto-capture)
trackEvent("page_viewed", {
  path: "/pricing",
  referrer: document.referrer,
});

// Search
trackEvent("search_performed", {
  query: "pricing plans",
  results_count: 5,
});

// CTA clicks
trackEvent("cta_clicked", {
  cta_name: "get_started",
  cta_location: "hero",
  page: "/home",
});
```

---

## Testing Analytics Events

### Manual Testing with Console

Temporarily add console logging to verify events:

```typescript
export function useAnalytics() {
  const trackEvent = (event: string, data?: Record<string, unknown>) => {
    // Debug logging
    console.log("[Analytics]", event, data);

    if (!posthogKey) return;
    posthog.capture(event, data);
  };

  return { trackEvent };
}
```

### Unit Testing with Mocks

```typescript
import { vi, describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { SignupButton } from "./SignupButton";

// Mock the analytics module
vi.mock("@analytics", () => ({
  useAnalytics: () => ({
    trackEvent: vi.fn(),
  }),
}));

describe("SignupButton", () => {
  it("tracks click event", () => {
    const mockTrackEvent = vi.fn();
    vi.mocked(useAnalytics).mockReturnValue({ trackEvent: mockTrackEvent });

    const { getByText } = render(<SignupButton />);
    fireEvent.click(getByText("Sign Up"));

    expect(mockTrackEvent).toHaveBeenCalledWith("signup_button_clicked");
  });
});
```

---

## Debugging Tips

### Enable PostHog Debug Mode

In browser console:

```javascript
posthog.debug();
```

This enables verbose logging of all PostHog activity.

### Check Network Requests

1. Open browser DevTools → Network tab
2. Filter by `posthog` or `i.posthog.com`
3. Verify events are being sent
4. Check response status codes

### Verify Environment Variables

```typescript
// Temporary debug in your component
console.log("PostHog Key:", process.env.NEXT_PUBLIC_POSTHOG_KEY);
console.log("PostHog Host:", process.env.NEXT_PUBLIC_POSTHOG_HOST);
```

### Use PostHog Toolbar

1. Enable Toolbar in PostHog project settings
2. Visit your app with `?__posthog_debug=true` query param
3. Click the PostHog icon to inspect events in real-time

### Common Issues

| Issue                 | Solution                                           |
| --------------------- | -------------------------------------------------- |
| Events not appearing  | Check `NEXT_PUBLIC_POSTHOG_KEY` is set             |
| Wrong PostHog project | Verify the API key matches your project            |
| Events delayed        | PostHog batches events; wait a few seconds         |
| User not identified   | Ensure `posthog.identify()` is called after login  |
| Stale user data       | Call `posthog.reset()` on logout                   |

### Disable Analytics in Development

To prevent dev events polluting your analytics:

```typescript
// In provider/posthog/index.tsx
const isDev = process.env.NODE_ENV === "development";

export function AnalyticsScript() {
  useEffect(() => {
    if (!posthogKey || isDev) {
      return;
    }
    // ... initialization
  }, []);

  return null;
}
```

Or use a separate PostHog project for development.
