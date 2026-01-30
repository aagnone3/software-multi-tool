# Inngest Evaluation

This document evaluates Inngest as a replacement for pg-boss in our migration from Render to a Vercel + Supabase architecture.

## Overview

Inngest is a durable execution platform that enables reliable background job processing through a serverless-friendly architecture. It handles scheduling, retries, and state management outside of your application, making it ideal for Vercel deployments where traditional persistent processes aren't available.

## Pros

### Developer Experience

- **First-class Vercel integration**: Available in the [Vercel Marketplace](https://vercel.com/marketplace/inngest) with one-click install and integrated billing
- **Colocated with application code**: Functions are defined in `app/api/inngest/` alongside your Next.js routes
- **TypeScript-first SDK**: Full type safety for events, functions, and step results
- **Preview environment support**: Automatic branch and staging environments that mirror your Vercel deployments
- **Local development server**: `npx inngest-cli@latest dev` provides a local dashboard for testing functions

### Reliability & Durability

- **Durable execution**: Functions survive serverless cold starts and timeouts through checkpointing
- **Automatic retries**: Built-in retry logic with configurable strategies per step
- **Step-level recovery**: On failure, only the failed step reruns—not the entire function
- **Event-driven architecture**: Decoupled triggers enable flexible workflow composition

### Long-Running Job Support

- **Step functions**: Break jobs into individually retriable checkpoints
- **Sleep up to 1 year**: `step.sleep()` and `step.sleepUntil()` pause without consuming compute
- **2-hour step timeout**: Each step can run up to 2 hours (vs. Vercel's 10-60 second limits)
- **Cross-function orchestration**: `step.invoke()` chains functions with typed results

### Observability

- **Built-in tracing**: Function execution traces with step-level visibility
- **Logs and metrics**: Dashboard shows run history, errors, and performance
- **Alerting**: Configurable alerts on function failures

## Cons

### Limitations

- **1000 steps per function**: Maximum steps limit requires thoughtful workflow design
- **32MB state limit**: Total function run state (events + step returns + metadata) cannot exceed 32MB
- **4MB step return limit**: Individual step return data capped at 4MB
- **7-day sleep limit on free tier**: Free plan restricts sleep duration (1 year on paid plans)
- **5 concurrent steps on free tier**: Parallelism limited until upgrade

### Vendor Lock-in

- **Proprietary platform**: Unlike pg-boss (open source), Inngest is a commercial SaaS
- **Event format coupling**: Events must conform to Inngest's schema (`name`, `data`, `user`, `ts`)
- **SDK dependency**: Functions require Inngest SDK; not easily portable to other systems

### Operational Considerations

- **External dependency**: Adds another service to monitor and manage
- **Network latency**: Events are sent to Inngest's servers before triggering functions
- **Learning curve**: Team must learn new patterns (steps, events, durable execution)

## Cost Analysis

### Free Tier (Hobby)

| Resource             | Limit            |
| -------------------- | ---------------- |
| Executions           | 50,000/month     |
| Concurrent Steps     | 5                |
| Realtime Connections | 50               |
| Users                | 3                |
| Workers              | 3                |
| Trace Retention      | 24 hours         |
| Sleep Duration       | 7 days max       |

### Pro Tier ($75/month)

| Resource              | Limit                    |
| --------------------- | ------------------------ |
| Executions            | 1,000,000/month included |
| Additional Executions | $50 per 1M               |
| Concurrent Steps      | 100+                     |
| Realtime Connections  | 1,000+                   |
| Users                 | 15+                      |
| Workers               | 20                       |
| Trace Retention       | 7 days                   |
| Sleep Duration        | 1 year                   |

### Cost Projection

Assuming our current workload:

| Scenario             | Monthly Jobs | Monthly Cost       |
| -------------------- | ------------ | ------------------ |
| Current (low volume) | ~10,000      | Free               |
| Growth (moderate)    | ~100,000     | Free               |
| Scale (high volume)  | ~500,000     | Free               |
| Scale (very high)    | ~2,000,000   | ~$75 + $50 = $125  |

**vs. Render**: Our current Render service costs $7-25/month depending on tier, but includes persistent process overhead, manual scaling concerns, and operational complexity. Inngest's pricing is execution-based, scaling with actual usage.

## Vercel Integration Approach

### Installation

1. Install from [Vercel Marketplace](https://vercel.com/marketplace/inngest)
2. Or add SDK manually: `pnpm add inngest`

### Environment Variables

```bash
# apps/web/.env.local
INNGEST_EVENT_KEY=your-event-key
INNGEST_SIGNING_KEY=your-signing-key
```

### Project Structure

```text
apps/web/
├── inngest/
│   ├── client.ts          # Inngest client initialization
│   └── functions/
│       ├── news-analyzer.ts
│       └── speaker-separation.ts
└── app/
    └── api/
        └── inngest/
            └── route.ts   # Serve endpoint
```

### Client Initialization

```typescript
// apps/web/inngest/client.ts
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "software-multi-tool",
  // Optional: Define event schemas for type safety
  schemas: new EventSchemas().fromRecord<{
    "app/news.analyze": { data: { url: string } };
    "app/speaker.separate": { data: { fileId: string } };
  }>(),
});
```

### Serve Endpoint

```typescript
// apps/web/app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { newsAnalyzer } from "@/inngest/functions/news-analyzer";
import { speakerSeparation } from "@/inngest/functions/speaker-separation";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [newsAnalyzer, speakerSeparation],
});
```

## Step Functions for Long-Running Jobs

Inngest's step functions enable reliable execution of long-running jobs that exceed serverless timeout limits.

### How Steps Work

Each `step.run()` call creates a checkpoint:

1. Inngest calls your function
2. Function executes until it hits a step
3. Step result is persisted to Inngest's state
4. On next invocation, previous step results are replayed from state
5. Execution continues from the next step

This "durable execution" model means:

- Functions can span minutes, hours, or days
- Failures only retry the failed step
- State persists across serverless cold starts

### Available Step Types

```typescript
// Execute code with automatic retry
const result = await step.run("step-name", async () => {
  return await doWork();
});

// Pause execution (no compute cost)
await step.sleep("wait-1-hour", "1h");
await step.sleepUntil("wait-for-date", "2024-12-01");

// Wait for external event
const event = await step.waitForEvent("wait-for-completion", {
  event: "app/process.completed",
  timeout: "24h",
  match: "data.processId",
});

// Trigger another function
const subResult = await step.invoke("call-other-function", {
  function: otherFunction,
  data: { input: "value" },
});

// Fan-out to trigger multiple functions
await step.sendEvent("trigger-notifications", {
  name: "app/notify.user",
  data: { userId: "123" },
});
```

### Timeout Configuration

```typescript
inngest.createFunction(
  {
    id: "long-running-job",
    timeouts: {
      start: "5m",    // Max time to wait for first step to start
      finish: "2h",   // Max total function duration
    },
  },
  { event: "app/job.start" },
  async ({ step }) => {
    // Steps can each run up to 2 hours
    await step.run("process-data", async () => {
      return await processLargeDataset();
    });
  }
);
```

## Code Example: Basic Job Definition

Here's a complete example of a background job that processes data with retry logic and progress reporting:

```typescript
// apps/web/inngest/functions/news-analyzer.ts
import { inngest } from "../client";
import { db } from "@repo/database";

export const newsAnalyzer = inngest.createFunction(
  {
    id: "news-analyzer",
    retries: 3,
    throttle: {
      limit: 10,
      period: "1m",
    },
  },
  { event: "app/news.analyze" },
  async ({ event, step }) => {
    const { url } = event.data;

    // Step 1: Fetch the article
    const article = await step.run("fetch-article", async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      return response.text();
    });

    // Step 2: Extract content
    const content = await step.run("extract-content", async () => {
      return parseArticle(article);
    });

    // Step 3: Analyze with AI (potentially long-running)
    const analysis = await step.run("analyze-content", async () => {
      return await analyzeWithAI(content);
    });

    // Step 4: Save results
    await step.run("save-results", async () => {
      await db.newsAnalysis.create({
        data: {
          url,
          content,
          analysis,
          analyzedAt: new Date(),
        },
      });
    });

    return { success: true, url };
  }
);
```

### Triggering the Job

```typescript
// From anywhere in your application
import { inngest } from "@/inngest/client";

// Event-based trigger
await inngest.send({
  name: "app/news.analyze",
  data: { url: "https://example.com/article" },
});

// Or schedule via cron
inngest.createFunction(
  {
    id: "scheduled-news-analyzer",
    // Run every hour
  },
  { cron: "0 * * * *" },
  async ({ step }) => {
    const urls = await step.run("get-pending-urls", async () => {
      return await db.newsQueue.findMany({ where: { status: "pending" } });
    });

    // Fan-out to process each URL
    await step.sendEvent(
      "trigger-analysis",
      urls.map((item) => ({
        name: "app/news.analyze",
        data: { url: item.url },
      }))
    );
  }
);
```

## Technical Limits Summary

| Limit               | Value                     | Notes                            |
| ------------------- | ------------------------- | -------------------------------- |
| Step timeout        | 2 hours                   | Per step, not per function       |
| Sleep duration      | 1 year (7 days free)      | No compute cost                  |
| Steps per function  | 1,000                     | Design workflows accordingly     |
| Function state size | 32 MB                     | Events + step returns + metadata |
| Step return size    | 4 MB                      | Per step                         |
| Event name length   | 256 chars                 |                                  |
| Event payload size  | 256 KB (free), 3 MB (paid)| Per request                      |
| Events per request  | 5,000                     | For batch operations             |

## Recommendation

Inngest is well-suited for our migration because:

1. **Native Vercel integration** eliminates the need for a separate compute layer
2. **Step functions** handle our long-running speaker separation jobs
3. **Free tier** likely covers our current volume
4. **Observability** replaces our need for custom job monitoring
5. **Event-driven model** aligns with modern serverless patterns

See [Job Platform Recommendation](./job-platform-recommendation.md) for comparison with alternatives.

## References

- [Inngest Documentation](https://www.inngest.com/docs)
- [Vercel + Inngest Integration](https://www.inngest.com/blog/vercel-integration)
- [Inngest Pricing](https://www.inngest.com/pricing)
- [Vercel Marketplace - Inngest](https://vercel.com/marketplace/inngest)
- [Usage Limits](https://www.inngest.com/docs/usage-limits/inngest)
- [Steps & Workflows](https://www.inngest.com/docs/features/inngest-functions/steps-workflows)
