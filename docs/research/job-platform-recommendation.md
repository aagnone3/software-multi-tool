# Job Platform Recommendation

This document compares **Inngest** and **Vercel Cron + Redis** for replacing pg-boss in our migration from Render to a Vercel + Supabase architecture.

## Executive Summary

We recommend **Inngest** for our job processing platform.

Inngest is the recommended job processing platform for our architecture migration. It provides the durable execution, step-based checkpointing, and built-in reliability features required by our long-running speaker separation jobs, while eliminating the need to build and maintain custom queue infrastructure.

## Comparison Matrix

| Criteria | Inngest | Vercel Cron + Redis |
| --- | --- | --- |
| Developer Experience | Excellent | Good |
| Cost at Scale | Good | Excellent |
| Timeout Handling | Excellent | Poor |
| Retry Logic | Excellent | Poor |
| Observability | Excellent | Poor |
| Vendor Lock-in | Moderate | Low |
| Long-Running Jobs | Excellent | Unsuitable |
| Event-Driven Triggers | Excellent | Poor |

## Detailed Comparison

### Developer Experience

Inngest provides a TypeScript-first SDK with full type safety for events, functions, and step results. Functions are colocated with application code in `app/api/inngest/` directory. A local development server with visual dashboard is available via `npx inngest-cli@latest dev`. Preview environment support mirrors Vercel deployments automatically, and minimal boilerplate is required—define functions declaratively, and Inngest handles execution.

```typescript
// Inngest: ~20 lines for a complete job definition
export const newsAnalyzer = inngest.createFunction(
  { id: "news-analyzer", retries: 3 },
  { event: "app/news.analyze" },
  async ({ event, step }) => {
    const article = await step.run("fetch", () => fetch(event.data.url));
    const analysis = await step.run("analyze", () => analyzeContent(article));
    await step.run("save", () => db.save(analysis));
  }
);
```

Vercel Cron + Redis requires no SDK but requires building queue infrastructure from scratch. Cron schedules are declaratively defined in `vercel.json`, but there is no local testing UI—you must manually trigger endpoints or deploy to preview. Significantly more code is required to implement enqueue, dequeue, visibility timeout, retries, and dead letter queue functionality.

```typescript
// Vercel Cron + Redis: ~100+ lines for equivalent functionality
// Requires: job queue implementation, retry logic, error handling, status tracking
```

**Winner: Inngest** — Dramatically reduces implementation time and maintenance burden.

### Cost at Scale

Inngest pricing:

| Volume | Monthly Cost |
| --- | --- |
| 10,000 jobs | $0 (free tier) |
| 100,000 jobs | $0 (free tier) |
| 500,000 jobs | $0 (free tier) |
| 2,000,000 jobs | ~$125 ($75 base + $50/M) |

Free tier includes 50K executions/month. A "job" with 5 steps counts as 5 executions.

Vercel Cron + Redis pricing:

| Volume | Monthly Cost |
| --- | --- |
| 10,000 jobs | ~$0 (free tiers) |
| 100,000 jobs | ~$5–15 (functions) |
| 500,000 jobs | ~$25–50 + Redis |
| 2,000,000 jobs | ~$100–200 |

**Note**: Complex queue implementations increase Redis commands 5–10x per job (enqueue, status, retry, dequeue).

**Winner: Vercel Cron + Redis (marginally)** — Lower raw cost, but requires significant engineering investment. The cost difference is minimal compared to developer time savings from Inngest.

### Timeout Handling

Inngest provides a 2-hour step timeout—each step can run up to 2 hours. Durable execution means functions survive serverless cold starts through checkpointing. Step-level recovery ensures that on failure, only the failed step reruns—not the entire function. Sleep can last up to 1 year with `step.sleep()` pausing without consuming compute.

```typescript
// Long-running job with Inngest: works out of the box
const speakerSeparation = inngest.createFunction(
  { id: "speaker-separation", timeouts: { finish: "2h" } },
  { event: "app/speaker.separate" },
  async ({ step }) => {
    const audio = await step.run("download", async () => downloadFile(fileId));  // May take 10 min
    const result = await step.run("process", async () => separateSpeakers(audio)); // May take 30 min
    await step.run("upload", async () => uploadResults(result));
  }
);
```

Vercel Cron + Redis has a maximum of 800 seconds (13 min) on Pro plan, 300s on Hobby. No checkpointing means jobs that timeout must restart from the beginning. No durable execution means functions cannot survive cold starts. Critically, this approach cannot handle our speaker separation jobs which run 30+ minutes.

**Winner: Inngest** — This is the decisive factor. Vercel Cron cannot handle our long-running jobs.

### Retry Logic

Inngest offers built-in retry configuration at function and step level with configurable backoff strategies (exponential, linear, or custom). Step-level retries mean failed steps retry independently. Dead letter queue automatically handles permanently failed jobs. Throttling is built-in to limit concurrent executions.

```typescript
inngest.createFunction({
  id: "job",
  retries: 5, // Automatic exponential backoff
  throttle: { limit: 10, period: "1m" },
});
```

Vercel Cron + Redis provides no built-in retry logic—you must implement from scratch. Manual retry counter tracks attempts in Redis. Manual backoff calculates delay between retries. Manual dead letter queue moves failed jobs to separate queue. Manual concurrency control uses Redis locks to prevent race conditions.

**Winner: Inngest** — Built-in reliability vs. hundreds of lines of custom code.

### Observability

Inngest includes built-in tracing with function execution traces and step-level visibility. A dashboard provides a visual interface showing run history, errors, and performance metrics. Logs are searchable per function and step. Alerting is configurable on function failures. Replay allows re-running failed functions from the dashboard.

Vercel Cron + Redis relies on Vercel function logs for basic stdout/stderr logging. There is no job-specific dashboard—you must build custom monitoring. No built-in alerting means you must integrate with external services. Manual status tracking requires querying Redis for job state. No replay support means you must manually re-enqueue failed jobs.

**Winner: Inngest** — Purpose-built observability vs. DIY monitoring.

### Vendor Lock-in

Inngest is a proprietary SaaS platform that cannot be self-hosted. SDK dependency means functions require the Inngest SDK. Event format coupling requires using Inngest event schema. Migration difficulty is high—moving away requires rewriting all job functions.

Vercel Cron + Redis uses standard HTTP endpoints, so any API route works. Portable Redis patterns mean the queue implementation works with any Redis. No SDK lock-in means pure application code. Migration is easier since cron patterns and Redis code work elsewhere.

**Winner: Vercel Cron + Redis** — More portable, but the flexibility comes at significant implementation cost.

### Long-Running Jobs

Our speaker separation jobs can run 30+ minutes. This is the critical requirement.

| Requirement | Inngest | Vercel Cron + Redis |
| --- | --- | --- |
| 30-minute jobs | Yes (2h step limit) | No (800s max) |
| Progress checkpointing | Yes (step.run) | No (must restart) |
| Resume after failure | Yes (automatic) | No (manual) |
| Status updates | Yes (step boundaries) | Partial (custom impl) |

**Winner: Inngest** — Only viable option for our workload.

### Event-Driven Triggers

Inngest supports event-based triggers—jobs start from events, not just schedules. Webhook integration receives events from external services. Event fan-out allows one event to trigger multiple functions. Wait for events with `step.waitForEvent()` pauses until external event arrives. Cross-function orchestration with `step.invoke()` chains functions.

Vercel Cron + Redis is time-based only with cron schedules, no event triggers. You must poll or use webhooks to build event handling separately. No native fan-out means you must manually trigger multiple jobs. No event waiting would need custom pub/sub implementation.

**Winner: Inngest** — Rich event-driven patterns vs. basic time-based scheduling.

## Our Specific Requirements

### Current pg-boss Jobs

| Job | Duration | Trigger | Inngest Fit | Vercel Cron Fit |
| --- | --- | --- | --- | --- |
| news-analyzer | ~5 min | Event/Schedule | Good | Borderline |
| speaker-separation | 30+ min | Event | Good | Unsuitable |

### Non-Negotiable Requirements

1. **Long-running job support**: Speaker separation requires 30+ minute execution
2. **Reliable retry logic**: Jobs must not silently fail
3. **Progress tracking**: Users need status updates during processing
4. **Event-driven triggers**: Jobs start from user actions, not just schedules

Inngest meets all requirements. Vercel Cron + Redis fails requirement #1.

## Migration Complexity

### Migration Path with Inngest

1. Install SDK (`pnpm add inngest`)
2. Create client and serve endpoint
3. Convert pg-boss handlers to Inngest functions
4. Replace `pgBoss.send()` with `inngest.send()`
5. Deploy and verify

Estimated effort: 2-3 days for existing jobs.

### Migration Path with Vercel Cron + Redis

1. Install Upstash Redis client
2. Build job queue infrastructure (enqueue, dequeue, visibility timeout)
3. Build retry logic with exponential backoff
4. Build dead letter queue handling
5. Build job status API
6. Build monitoring and alerting
7. Rewrite long-running jobs to chunk work (may not be possible for speaker separation)
8. Test extensively for race conditions
9. Deploy and monitor for edge cases

Estimated effort: 2-3 weeks, with ongoing maintenance burden.

## Cost-Benefit Analysis

| Factor | Inngest | Vercel Cron + Redis |
| --- | --- | --- |
| Implementation time | ~3 days | ~3 weeks |
| Monthly cost (current volume) | $0 | $0–5 |
| Maintenance burden | Low | High |
| Risk of bugs | Low (battle-tested) | High (custom code) |
| Supports all jobs | Yes | No |

Even if Vercel Cron were $0 forever, the engineering time to build and maintain a custom queue system exceeds the cost of Inngest Pro for years.

## Final Recommendation

We recommend using Inngest for the following reasons:

1. **Only option that works**: Speaker separation jobs cannot run on Vercel Cron's 800-second limit
2. **Dramatically simpler**: Built-in retries, observability, and durability vs. weeks of custom code
3. **Free tier sufficient**: 50K executions/month covers our current and projected workload
4. **Native Vercel integration**: First-party marketplace support, automatic preview environments
5. **Future-proof**: As we add more background jobs, Inngest scales without additional infrastructure work

### Implementation Plan

1. **US-006**: Install Inngest SDK and configure client
2. **US-007**: Migrate news-analyzer job
3. **US-008**: Migrate speaker-separation job (benefits most from step functions)
4. **US-009**: Migrate any remaining jobs
5. **US-012–013**: Remove pg-boss after validation

## References

- [Inngest Evaluation](./inngest-evaluation.md) — Detailed Inngest analysis
- [Vercel Cron + KV Evaluation](./vercel-cron-kv-evaluation.md) — Detailed Vercel Cron analysis
- [Inngest Documentation](https://www.inngest.com/docs)
- [Vercel Cron Documentation](https://vercel.com/docs/cron-jobs)
- [Inngest Pricing](https://www.inngest.com/pricing)
