---
name: async-jobs
description: Use this skill when implementing job processors, debugging stuck or failed jobs, configuring job timeouts or retries, understanding pg-boss architecture, or troubleshooting job processing issues. Covers the ToolJob table, job-runner maintenance, and expire handlers.
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Grep
  - Glob
---

# Async Jobs Skill

> **Purpose**: Guide for implementing and managing async job processing with pg-boss

This skill documents the async job processing architecture using pg-boss as the primary job queue system.

## When to Use This Skill

Invoke this skill when:

- Implementing new job processors for tools
- Debugging stuck or failed jobs
- Understanding job lifecycle and state transitions
- Configuring job timeouts or retry behavior
- Troubleshooting preview environment job issues
- Understanding pg-boss architecture and table relationships
- Working with expire handlers or state reconciliation
- Adding maintenance tasks for job cleanup

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Job Processing Flow                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Job Creation (Vercel)           Job Processing (Render)                         │
│  ───────────────────            ─────────────────────────                        │
│                                                                                  │
│  ┌─────────────────┐            ┌─────────────────────┐                          │
│  │ create-job.ts   │            │ api-server workers  │                          │
│  │                 │            │                     │                          │
│  │ 1. Create       │            │ 1. Poll pg-boss     │                          │
│  │    ToolJob      │──────────→ │    queue            │                          │
│  │ 2. Submit to    │  pg-boss   │ 2. Claim ToolJob    │                          │
│  │    pg-boss      │  queue     │ 3. Run processor    │                          │
│  │    queue        │            │ 4. Update result    │                          │
│  └─────────────────┘            └─────────────────────┘                          │
│                                          │                                       │
│                                          ▼                                       │
│                                 ┌─────────────────────┐                          │
│                                 │ Expire Handler      │                          │
│                                 │ (onExpire callback) │                          │
│                                 │                     │                          │
│                                 │ Updates ToolJob     │                          │
│                                 │ when pg-boss marks  │                          │
│                                 │ job as expired      │                          │
│                                 └─────────────────────┘                          │
│                                                                                  │
│  Frontend Polling (Browser)      Maintenance (Vercel Cron)                       │
│  ──────────────────────────      ─────────────────────────                       │
│                                                                                  │
│  ┌─────────────────────────┐    ┌─────────────────────────┐                      │
│  │ jobs.get (oRPC)         │    │ /api/cron/job-maintenance│                     │
│  │                         │    │                         │                      │
│  │ • Poll tool_job status  │    │ 1. Reconcile pg-boss    │                      │
│  │ • Requires x-session-id │    │    state with ToolJob   │                      │
│  │   header for ownership  │    │ 2. Mark stuck jobs failed│                     │
│  └─────────────────────────┘    │ 3. Clean up expired jobs │                     │
│                                 └─────────────────────────┘                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Centralized Configuration

**All job configuration is centralized in `job-config.ts`**. Never define timeout or retry values elsewhere.

```typescript
// packages/api/modules/jobs/lib/job-config.ts

// Timeouts - all 10 minutes for consistency
export const JOB_TIMEOUT_MS = 10 * 60 * 1000;        // Application timeout (ms)
export const JOB_TIMEOUT_SECONDS = 600;              // pg-boss config (seconds)
export const JOB_EXPIRE_IN_INTERVAL = "00:10:00";    // pg-boss queue insert (PostgreSQL interval)
export const STUCK_JOB_TIMEOUT_MINUTES = 30;         // Cron cleanup (3x job timeout)

// Retry configuration
export const RETRY_CONFIG = {
  limit: 3,           // Max retry attempts
  delay: 60,          // Initial delay (seconds)
  backoff: true,      // Exponential backoff (60s, 3600s, ...)
} as const;

// Archive configuration
export const ARCHIVE_CONFIG = {
  completedAfterSeconds: 604800,   // 7 days
  failedAfterSeconds: 1209600,     // 14 days
} as const;

// Worker configuration
export const WORKER_CONFIG = {
  batchSize: 5,
  pollingIntervalSeconds: 2,
  monitorStateIntervalSeconds: 30,
} as const;
```

**Import from job-config.ts**:

```typescript
import {
  JOB_TIMEOUT_MS,
  JOB_TIMEOUT_SECONDS,
  JOB_EXPIRE_IN_INTERVAL,
  RETRY_CONFIG,
} from "@repo/api/modules/jobs/lib/job-config";
```

## Timeout Architecture

Jobs have a **three-tier timeout hierarchy** that provides defense-in-depth:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Timeout Hierarchy                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Tier 1: Application Timeout (10 minutes)                                    │
│  ────────────────────────────────────────                                    │
│  • withTimeout() wrapper in processor-registry.ts                            │
│  • Kills long-running job handlers                                           │
│  • Throws TimeoutError → Worker marks ToolJob FAILED                         │
│                                                                              │
│           ↓ If worker dies before completion                                 │
│                                                                              │
│  Tier 2: pg-boss Expiration (10 minutes)                                     │
│  ───────────────────────────────────────                                     │
│  • pg-boss marks job state = 'expired'                                       │
│  • onExpire handler triggers                                                 │
│  • Handler updates ToolJob status to FAILED                                  │
│                                                                              │
│           ↓ If pg-boss also fails                                            │
│                                                                              │
│  Tier 3: Stuck Job Cleanup (30 minutes)                                      │
│  ──────────────────────────────────────                                      │
│  • Cron job runs every minute                                                │
│  • Marks PROCESSING jobs > 30 min as FAILED                                  │
│  • Fallback for state divergence                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Why 30 minutes for stuck job cleanup?**

Set higher than the pg-boss expiration (10 min) to allow the onExpire handler to trigger first. This prevents duplicate state transitions and unnecessary database updates.

## Retry Strategy

pg-boss handles retries with **exponential backoff**:

| Attempt | Delay                    | Total Time             |
| ------- | ------------------------ | ---------------------- |
| 1       | Immediate                | 0                      |
| 2       | 60 seconds               | 1 minute               |
| 3       | 3600 seconds (60²)       | ~1 hour                |
| 4       | N/A (retryLimit reached) | Job permanently failed |

After all retries exhausted, the job is marked permanently failed in both pg-boss and ToolJob.

## Table Relationships

**CRITICAL**: There are TWO tables involved in job processing:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Table Relationship                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  public.tool_job                          pgboss.job                        │
│  ────────────────                         ──────────                        │
│  (Application state)                      (Queue state)                     │
│                                                                             │
│  ┌─────────────────────────┐              ┌────────────────────────────┐    │
│  │ id: "abc123"            │◄─────────────│ data: {toolJobId: "abc123"}│    │
│  │ status: PENDING/        │              │ name: "news-analyzer"      │    │
│  │         PROCESSING/     │              │ state: created/active/     │    │
│  │         COMPLETED/      │              │        completed/failed/   │    │
│  │         FAILED          │              │        expired             │    │
│  │ pgBossJobId: "uuid..."  │─────────────►│ id: "uuid..."              │    │
│  │ output: {...}           │              │ output: {...}              │    │
│  │ error: "..."            │              │                            │    │
│  └─────────────────────────┘              └────────────────────────────┘    │
│                                                                             │
│  Frontend reads: tool_job                 Worker reads: pgboss.job          │
│  Worker writes: tool_job                  pg-boss writes: pgboss.job        │
│  onExpire writes: tool_job                                                  │
│  reconcileJobStates: syncs both tables                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Important**:

- `tool_job` is the source of truth for job status displayed to users
- `pgboss.job` is the queue mechanism for worker coordination
- Both tables MUST be updated - orphaned records in either table cause bugs
- `reconcileJobStates()` handles state divergence

## Expire Handler

The **onExpire handler** ensures ToolJob status is updated when pg-boss marks jobs as expired:

```typescript
// apps/api-server/src/lib/pg-boss.ts

export async function registerExpireHandler(queueName: string): Promise<void> {
  const instance = getPgBoss();

  await instance.onExpire<JobPayload>(queueName, async (job) => {
    const { toolJobId } = job.data;

    logger.warn(`[onExpire:${queueName}] Job expired: ${job.id}`);

    // Only update if still PROCESSING (avoid overwriting COMPLETED/CANCELLED)
    await db.toolJob.updateMany({
      where: {
        id: toolJobId,
        status: "PROCESSING",
      },
      data: {
        status: "FAILED",
        error: `Job expired after ${JOB_TIMEOUT_SECONDS} seconds (pg-boss expiration)`,
        completedAt: new Date(),
      },
    });
  });
}
```

**Registration in workers/index.ts**:

```typescript
// Register expire handlers for each queue
for (const toolSlug of TOOL_SLUGS) {
  await registerExpireHandler(toolSlug);
}
```

## State Reconciliation

The **reconcileJobStates()** function syncs pg-boss state with ToolJob records:

```typescript
// packages/api/modules/jobs/lib/job-runner.ts

export async function reconcileJobStates(): Promise<{
  synced: number;
  completed: number;
  failed: number;
  expired: number;
}> {
  // 1. Find ToolJobs in PROCESSING state with pgBossJobId
  const processingJobs = await db.toolJob.findMany({
    where: {
      status: "PROCESSING",
      pgBossJobId: { not: null },
    },
  });

  // 2. Query pg-boss for actual state (job + archive tables)
  const pgBossJobs = await db.$queryRaw`
    SELECT id::text, state, output FROM pgboss.job
    WHERE id = ANY(${pgBossJobIds}::uuid[])
  `;

  // 3. Update ToolJob to match pg-boss state if diverged
  for (const toolJob of processingJobs) {
    const pgBossState = pgBossStateMap.get(toolJob.pgBossJobId);

    if (pgBossState === "completed") {
      await db.toolJob.update({ status: "COMPLETED", ... });
    } else if (pgBossState === "failed" || pgBossState === "expired") {
      await db.toolJob.update({ status: "FAILED", ... });
    } else if (pgBossState === "cancelled") {
      await db.toolJob.update({ status: "CANCELLED", ... });
    }
  }
}
```

**When reconciliation runs**:

- Called by cron maintenance job (`/api/cron/job-maintenance`)
- Runs BEFORE stuck job cleanup
- Handles cases where onExpire handler or worker failed to update ToolJob

## Key Components

### 1. Job Creation (`packages/api/modules/jobs/procedures/create-job.ts`)

Creates a new ToolJob record and submits it to the pg-boss queue:

```typescript
// 1. Create ToolJob in database (status: PENDING)
const job = await createToolJob({
  toolSlug,
  input,
  userId,
  sessionId,
  priority,
});

// 2. Submit to pg-boss queue for worker processing
await submitJobToQueue(toolSlug, job.id, {
  priority: priority ?? 0,
});
```

### 2. Job Queue (`packages/api/modules/jobs/lib/queue.ts`)

Handles job submission to pg-boss via direct SQL:

```typescript
// Insert job into pg-boss queue with centralized config
await db.$queryRaw`
  INSERT INTO pgboss.job (name, data, priority, "expireIn", "retryLimit", "retryDelay", "retryBackoff", ...)
  VALUES (
    ${queueName},
    ${JSON.stringify({ toolJobId })}::jsonb,
    ${priority},
    ${JOB_EXPIRE_IN_INTERVAL}::interval,
    ${RETRY_CONFIG.limit},
    ${RETRY_CONFIG.delay},
    ${RETRY_CONFIG.backoff},
    ...
  )
  RETURNING id::text
`;

// Update ToolJob with pg-boss job ID
await db.toolJob.update({
  where: { id: toolJobId },
  data: { pgBossJobId },
});
```

### 3. Workers (`apps/api-server/src/workers/index.ts`)

pg-boss workers that process jobs:

```typescript
import {
  JOB_TIMEOUT_MS,
  WORKER_CONFIG,
} from "@repo/api/modules/jobs/lib/job-config";

// Register worker for each tool
await boss.work<JobPayload>(
  toolSlug,
  {
    batchSize: WORKER_CONFIG.batchSize,
    pollingIntervalSeconds: WORKER_CONFIG.pollingIntervalSeconds,
  },
  async (jobs) => {
    for (const job of jobs) {
      // 1. Atomically claim ToolJob (PENDING → PROCESSING)
      // 2. Get processor for tool
      // 3. Execute processor with timeout
      const result = await withTimeout(processor(toolJob), JOB_TIMEOUT_MS);
      // 4. Update ToolJob with result
    }
  }
);

// Register expire handlers for each queue
for (const toolSlug of TOOL_SLUGS) {
  await registerExpireHandler(toolSlug);
}
```

### 4. Processors (`packages/api/modules/<tool>/lib/processor.ts`)

Tool-specific job processors:

```typescript
export const processNewsAnalysis: JobProcessor = async (job) => {
  // Extract input from job
  const { articleUrl, articleText } = job.input as NewsAnalyzerInput;

  // Process the job
  const analysis = await analyzeArticle(articleUrl || articleText);

  // Return result
  return {
    success: true,
    output: analysis,
  };
};
```

### 5. Maintenance (`apps/web/app/api/cron/job-maintenance/route.ts`)

Cron job for maintenance tasks:

```typescript
// 1. Reconcile pg-boss state with ToolJob (handles state divergence)
const reconcileResult = await reconcileJobStates();

// 2. Mark stuck jobs as failed (processing > 30 minutes)
const stuckResult = await handleStuckJobs();

// 3. Clean up expired jobs
const cleanupResult = await runCleanup();
```

## Creating a New Processor

For step-by-step instructions on creating a new job processor, see `creating-processors.md` in this skill directory.

**Quick overview:**

1. Create processor function implementing `JobProcessor` interface
2. Register processor with `registerProcessor()`
3. Add to worker initialization in `apps/api-server/src/workers/index.ts`
4. Configure environment variables for pg-boss workers

See `creating-processors.md` for complete examples, database schema, lifecycle diagrams, and testing guidance.

## Troubleshooting

For comprehensive troubleshooting guidance, see `troubleshooting.md` in this skill directory.

**Common issues:**

- Jobs not being processed → Check api-server and USE_PGBOSS_WORKERS
- Stuck jobs → Cron cleanup or manual reconciliation
- State divergence → Force reconciliation or check archive table
- Preview environment issues → Verify env var alignment across services
- Anonymous job ownership → Ensure x-session-id header is passed

## Related Files

- `packages/api/modules/jobs/lib/job-config.ts` - **Centralized configuration (timeouts, retries, archive)**
- `packages/api/modules/jobs/procedures/create-job.ts` - Job creation endpoint
- `packages/api/modules/jobs/lib/queue.ts` - pg-boss queue submission
- `packages/api/modules/jobs/lib/job-runner.ts` - Maintenance utilities (reconcileJobStates, handleStuckJobs)
- `packages/api/modules/jobs/lib/processor-registry.ts` - Processor registration and withTimeout
- `apps/api-server/src/workers/index.ts` - pg-boss workers and expire handler registration
- `apps/api-server/src/lib/pg-boss.ts` - pg-boss client configuration and registerExpireHandler
- `apps/web/app/api/cron/job-maintenance/route.ts` - Cron maintenance
- `packages/database/prisma/schema.prisma` - ToolJob schema
- `packages/database/prisma/queries/tool-jobs.ts` - Database queries
