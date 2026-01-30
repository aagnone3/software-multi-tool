# Vercel Cron + KV Evaluation

This document evaluates Vercel Cron Jobs + Redis (via Upstash) as a replacement for pg-boss in our migration from Render to a Vercel + Supabase architecture.

## Overview

Vercel Cron Jobs allow you to schedule HTTP GET requests to Vercel Functions on a time-based schedule. Combined with a Redis store (Upstash, the default provider since Vercel KV was deprecated in December 2024), you can implement a basic job queue and state management system entirely within the Vercel ecosystem.

**Important**: Vercel KV was deprecated and migrated to Upstash Redis in December 2024. All references to "KV" now mean Upstash Redis via the Vercel Marketplace.

## Pros

### Native Platform Integration

- **Zero external services**: Cron Jobs are built into Vercel—no additional accounts or configuration
- **Upstash Marketplace integration**: One-click Redis setup with automatic environment variable injection
- **Unified billing**: Cron invocations use standard Vercel Functions pricing
- **Preview environment awareness**: Cron jobs only run on production deployment, preventing duplicate executions

### Simplicity

- **No SDK required**: Cron jobs are just HTTP endpoints—any API route works
- **Declarative configuration**: Define schedules in `vercel.json` with standard cron expressions
- **Familiar patterns**: Uses standard Redis commands for state management
- **Gradual adoption**: Can start with simple cron jobs, add Redis state as needed

### Cost Efficiency

- **Cron jobs are free**: Included in all plans, you only pay for function execution
- **Upstash free tier**: 500K commands/month and 256MB storage covers small workloads
- **Pay-per-use**: No baseline cost for low-volume job processing
- **Shared infrastructure**: No dedicated compute or database costs

## Cons

### Severe Limitations for Job Queues

- **No retry logic**: Failed jobs don't automatically retry—you must implement this yourself
- **No job deduplication**: Must manually track job IDs to prevent duplicate processing
- **No concurrency control**: Multiple cron invocations can run simultaneously without coordination
- **No progress tracking**: Must build your own status and progress reporting
- **No fan-out support**: Cannot easily trigger multiple parallel jobs from one cron invocation

### Cron-Specific Constraints

- **Hobby plan: once per day only**: Cron expressions running more frequently fail deployment
- **Hobby timing imprecision**: Jobs scheduled for 1:00 AM may run anywhere from 1:00–1:59 AM
- **Production-only execution**: Cron jobs never run on preview deployments (testing requires manual triggers)
- **No event-driven triggers**: Must poll or use webhooks—cannot trigger jobs from database changes
- **100 cron jobs max**: Per-project limit across all plans

### Function Duration Limits

| Plan       | Default Duration | Maximum Duration |
| ---------- | ---------------- | ---------------- |
| Hobby      | 300s (5 min)     | 300s (5 min)     |
| Pro        | 300s (5 min)     | 800s (13 min)    |
| Enterprise | 300s (5 min)     | 800s (13 min)    |

- **No step-based recovery**: If a job fails at minute 12, it must restart from the beginning
- **No durable execution**: Functions cannot survive cold starts or be checkpointed
- **Streaming required for long responses**: Edge functions must begin responding within 25 seconds

### Redis State Complexity

- **Manual queue implementation**: Must build job queue semantics (enqueue, dequeue, visibility timeout)
- **Race conditions**: Without careful locking, concurrent workers can process the same job
- **No dead letter queue**: Failed jobs require custom handling
- **State size management**: Must manually clean up old job state
- **Single region by default**: May add latency; multi-region costs extra

## Cost Analysis

### Vercel Cron (Included in All Plans)

| Plan       | Cron Jobs | Minimum Interval | Precision  |
| ---------- | --------- | ---------------- | ---------- |
| Hobby      | 100       | Once per day     | ±59 min    |
| Pro        | 100       | Once per minute  | Per-minute |
| Enterprise | 100       | Once per minute  | Per-minute |

Cron jobs themselves are free; you pay for the function execution they trigger.

### Upstash Redis Pricing

| Tier            | Storage | Commands   | Cost                 |
| --------------- | ------- | ---------- | -------------------- |
| Free            | 256 MB  | 500K/month | $0                   |
| Pay-as-you-go   | 1 GB+   | Unlimited  | ~$0.20/100K commands |
| Fixed $10/month | 250 MB  | Unlimited  | $10/month            |
| Fixed $50/month | 1 GB    | Unlimited  | $50/month            |

### Vercel Functions (Pro Plan)

| Resource            | Cost                                      |
| ------------------- | ----------------------------------------- |
| Active CPU          | $0.128–$0.221/hour (varies by region)     |
| Provisioned Memory  | $0.0106–$0.0183/GB-hour (varies by region)|
| Invocations         | $0.60 per million (first 1M included)     |

### Cost Projection

| Scenario             | Monthly Jobs | Estimated Monthly Cost |
| -------------------- | ------------ | ---------------------- |
| Current (low volume) | ~10,000      | ~$0 (free tiers)       |
| Growth (moderate)    | ~100,000     | ~$5–15 (function cost) |
| Scale (high volume)  | ~500,000     | ~$25–50 + Upstash fees |
| Scale (very high)    | ~2,000,000   | ~$100–200 + complexity |

**Note**: These estimates assume simple cron jobs. Complex queue implementations increase Redis commands significantly, potentially 5–10x per job (enqueue, dequeue, status updates, retries).

## Manual Queue Implementation Approach

Since Vercel Cron + Redis doesn't provide job queue semantics, you must build them yourself.

### Basic Architecture

```text
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Cron Trigger │────▶│ Vercel Func  │────▶│ Upstash Redis│
│ (vercel.json)│     │ /api/jobs/   │     │ (job queue)  │
└──────────────┘     │  process     │     └──────────────┘
                     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │ Job Logic    │
                     │ (your code)  │
                     └──────────────┘
```

### Queue Data Structures in Redis

```typescript
// Job states stored in Redis
interface JobQueue {
  // List of pending job IDs
  "jobs:pending": string[];         // LPUSH/RPOP

  // Set of in-progress job IDs (with TTL for stuck job recovery)
  "jobs:processing": Set<string>;   // SADD/SREM

  // Hash of job data
  "jobs:data:{jobId}": {
    id: string;
    type: string;
    payload: string;
    status: "pending" | "processing" | "completed" | "failed";
    attempts: number;
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
    error?: string;
  };
}
```

### Visibility Timeout Pattern

To prevent multiple workers from processing the same job:

```typescript
async function claimJob(redis: Redis): Promise<Job | null> {
  // Atomic: move from pending to processing with timeout
  const jobId = await redis.rpoplpush("jobs:pending", "jobs:processing");
  if (!jobId) return null;

  // Set visibility timeout (auto-return to pending if not completed)
  await redis.expire(`jobs:lock:${jobId}`, 300); // 5 minute timeout

  const jobData = await redis.hgetall(`jobs:data:${jobId}`);
  return jobData as Job;
}

async function completeJob(redis: Redis, jobId: string) {
  await redis.pipeline()
    .srem("jobs:processing", jobId)
    .hset(`jobs:data:${jobId}`, "status", "completed")
    .del(`jobs:lock:${jobId}`)
    .exec();
}
```

### Retry Logic

```typescript
const MAX_RETRIES = 3;

async function processWithRetry(redis: Redis, job: Job) {
  try {
    await processJob(job);
    await completeJob(redis, job.id);
  } catch (error) {
    const attempts = job.attempts + 1;

    if (attempts >= MAX_RETRIES) {
      // Move to dead letter queue
      await redis.pipeline()
        .srem("jobs:processing", job.id)
        .lpush("jobs:failed", job.id)
        .hset(`jobs:data:${job.id}`, {
          status: "failed",
          error: error.message,
          attempts,
        })
        .exec();
    } else {
      // Return to pending with backoff
      await redis.pipeline()
        .srem("jobs:processing", job.id)
        .lpush("jobs:pending", job.id)
        .hset(`jobs:data:${job.id}`, {
          status: "pending",
          attempts,
        })
        .exec();
    }
  }
}
```

## Cron Pattern Limitations

### Expression Format

Vercel supports standard 5-field cron expressions:

| Field        | Range         | Example      |
| ------------ | ------------- | ------------ |
| Minute       | 0–59          | `5 * * * *`  |
| Hour         | 0–23          | `* 5 * * *`  |
| Day of Month | 1–31          | `* * 5 * *`  |
| Month        | 1–12          | `* * * 5 *`  |
| Day of Week  | 0–6 (Sun–Sat) | `* * * * 5`  |

### Not Supported

- **Named values**: `MON`, `SUN`, `JAN`, `DEC` are not allowed
- **Combined day constraints**: Cannot set both day-of-month AND day-of-week
- **Sub-minute scheduling**: Minimum granularity is 1 minute (Pro+)
- **Timezone configuration**: Always UTC, cannot specify local timezone
- **Dynamic scheduling**: Schedule is fixed at deployment time

### Hobby Plan Restrictions

```jsonc
// This will FAIL deployment on Hobby:
{
  "crons": [
    { "path": "/api/jobs/process", "schedule": "0 * * * *" }  // Hourly - NOT ALLOWED
  ]
}

// This works on Hobby:
{
  "crons": [
    { "path": "/api/jobs/process", "schedule": "0 0 * * *" }  // Daily at midnight
  ]
}
```

## Code Example: Basic Cron Job with KV State

### vercel.json Configuration

```json
{
  "crons": [
    {
      "path": "/api/jobs/process-news",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Redis Client Setup

```typescript
// lib/redis.ts
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

### Cron Endpoint

```typescript
// app/api/jobs/process-news/route.ts
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { db } from "@repo/database";

export const maxDuration = 300; // 5 minutes max

export async function GET(request: Request) {
  // Verify this is a legitimate cron invocation
  const userAgent = request.headers.get("user-agent");
  if (userAgent !== "vercel-cron/1.0") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get pending jobs from queue
  const jobId = await redis.rpop("jobs:news:pending");
  if (!jobId) {
    return NextResponse.json({ message: "No pending jobs" });
  }

  // Mark as processing
  await redis.hset(`jobs:news:${jobId}`, {
    status: "processing",
    startedAt: Date.now(),
  });

  try {
    // Get job data
    const jobData = await redis.hgetall(`jobs:news:${jobId}`);
    const { url } = jobData as { url: string };

    // Process the job
    const response = await fetch(url);
    const content = await response.text();

    // Analyze content (simplified)
    const analysis = await analyzeContent(content);

    // Save results
    await db.newsAnalysis.create({
      data: {
        url,
        content,
        analysis,
        analyzedAt: new Date(),
      },
    });

    // Mark complete
    await redis.hset(`jobs:news:${jobId}`, {
      status: "completed",
      completedAt: Date.now(),
    });

    return NextResponse.json({ success: true, jobId });
  } catch (error) {
    // Handle failure
    const attempts = ((await redis.hget(`jobs:news:${jobId}`, "attempts")) as number) || 0;

    if (attempts < 3) {
      // Return to queue for retry
      await redis.pipeline()
        .hset(`jobs:news:${jobId}`, {
          status: "pending",
          attempts: attempts + 1,
          lastError: error instanceof Error ? error.message : "Unknown error",
        })
        .lpush("jobs:news:pending", jobId)
        .exec();
    } else {
      // Move to failed queue
      await redis.pipeline()
        .hset(`jobs:news:${jobId}`, {
          status: "failed",
          attempts: attempts + 1,
          lastError: error instanceof Error ? error.message : "Unknown error",
        })
        .lpush("jobs:news:failed", jobId)
        .exec();
    }

    return NextResponse.json({ error: "Job failed", jobId }, { status: 500 });
  }
}

// Helper to enqueue a job (called from your application)
export async function enqueueNewsJob(url: string) {
  const jobId = crypto.randomUUID();

  await redis.pipeline()
    .hset(`jobs:news:${jobId}`, {
      id: jobId,
      url,
      status: "pending",
      attempts: 0,
      createdAt: Date.now(),
    })
    .lpush("jobs:news:pending", jobId)
    .exec();

  return jobId;
}
```

### Job Status Endpoint

```typescript
// app/api/jobs/status/[jobId]/route.ts
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;
  const job = await redis.hgetall(`jobs:news:${jobId}`);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}
```

## Technical Limits Summary

| Limit                    | Value                          | Notes                            |
| ------------------------ | ------------------------------ | -------------------------------- |
| Function duration        | 300s (Hobby) / 800s (Pro)      | Per invocation                   |
| Cron jobs per project    | 100                            | All plans                        |
| Cron minimum interval    | Daily (Hobby) / Minute (Pro)   | Hobby has strict daily limit     |
| Request/response body    | 4.5 MB                         | Per request                      |
| Function memory          | 2 GB (Hobby) / 4 GB (Pro)      | Configurable                     |
| Redis commands (free)    | 500K/month                     | Upstash free tier                |
| Redis storage (free)     | 256 MB                         | Upstash free tier                |
| Redis bandwidth (free)   | 10 GB/month                    | Upstash free tier                |

## When to Choose Vercel Cron + Redis

### Good Fit

- Simple scheduled tasks (daily reports, cleanup jobs)
- Low-frequency operations (hourly or less)
- Jobs that complete quickly (<5 minutes)
- Minimal retry requirements
- Small team with limited job processing needs
- Budget-constrained projects

### Poor Fit

- High-volume job processing (>1000/day)
- Long-running jobs (>15 minutes)
- Complex retry and backoff requirements
- Jobs requiring step-based checkpointing
- Fan-out/fan-in workflow patterns
- Real-time job progress tracking
- Event-driven (not time-based) triggers

## Recommendation

**Vercel Cron + Redis is NOT recommended** for our use case because:

1. **Speaker separation jobs exceed limits**: These can run 30+ minutes, far exceeding the 800s maximum
2. **No durable execution**: Jobs cannot checkpoint and resume after timeout
3. **Manual queue complexity**: We'd need to build and maintain job queue infrastructure
4. **No step-level retries**: Failed jobs restart from scratch
5. **Hobby plan unusable**: Daily-only cron makes development and testing impractical

For teams with simple, quick, time-based jobs, Vercel Cron + Redis is a cost-effective option. For anything requiring reliability, long-running execution, or job queue semantics, a dedicated job platform like Inngest is more appropriate.

See [Job Platform Recommendation](./job-platform-recommendation.md) for the comparison and final recommendation.

## References

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Vercel Cron Usage & Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [Vercel Functions Limits](https://vercel.com/docs/functions/limitations)
- [Vercel Functions Pricing](https://vercel.com/docs/functions/usage-and-pricing)
- [Upstash Redis Pricing](https://upstash.com/docs/redis/overall/pricing)
- [Redis on Vercel Marketplace](https://vercel.com/docs/redis)
