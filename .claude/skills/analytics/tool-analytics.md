# Tool Usage Analytics

Comprehensive tracking for public tools that can be used by both authenticated and anonymous users.

## Architecture

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

## Client-Side: useToolAnalytics Hook

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

## Server-Side: trackToolServerEvent

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

## Anonymous Session Management

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

## Conversion Tracking

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

## Integration Example: News Analyzer

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

## Adding Analytics to a New Tool

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
