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

## Database Schema

### ToolJob Table (`public.tool_job`)

```sql
CREATE TABLE "tool_job" (
  "id"           TEXT PRIMARY KEY DEFAULT cuid(),
  "toolSlug"     TEXT NOT NULL,
  "status"       "ToolJobStatus" DEFAULT 'PENDING',
  "priority"     INTEGER DEFAULT 0,
  "input"        JSONB NOT NULL,
  "output"       JSONB,
  "error"        TEXT,
  "userId"       TEXT REFERENCES "user"("id"),
  "sessionId"    TEXT,
  "pgBossJobId"  TEXT UNIQUE,  -- Links to pg-boss job
  "attempts"     INTEGER DEFAULT 0,
  "maxAttempts"  INTEGER DEFAULT 3,
  "startedAt"    TIMESTAMPTZ,
  "completedAt"  TIMESTAMPTZ,
  "expiresAt"    TIMESTAMPTZ,
  "createdAt"    TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ DEFAULT NOW()
);
```

### pg-boss Job Table (`pgboss.job`)

```sql
CREATE TABLE "pgboss"."job" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"         TEXT NOT NULL,  -- Queue name (tool slug)
  "data"         JSONB,          -- { toolJobId: "..." }
  "state"        "pgboss"."job_state" DEFAULT 'created',
  "priority"     INTEGER DEFAULT 0,
  "retry_limit"  INTEGER DEFAULT 3,
  "retry_count"  INTEGER DEFAULT 0,
  "start_after"  TIMESTAMPTZ DEFAULT NOW(),
  "expire_in"    INTERVAL DEFAULT '00:10:00',
  ...
) PARTITION BY LIST ("name");
```

## Creating a New Processor

### 1. Create the Processor

```typescript
// packages/api/modules/my-tool/lib/processor.ts
import type { JobProcessor, JobResult } from "../jobs/lib/processor-registry";
import type { ToolJob } from "@repo/database";

interface MyToolInput {
  text: string;
  options?: {
    format: "json" | "text";
  };
}

export const processMyTool: JobProcessor = async (
  job: ToolJob,
): Promise<JobResult> => {
  const input = job.input as MyToolInput;

  try {
    // Process the job
    const result = await doWork(input);

    return {
      success: true,
      output: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
```

### 2. Register the Processor

```typescript
// packages/api/modules/my-tool/lib/register.ts
import { registerProcessor } from "../jobs/lib/processor-registry";
import { processMyTool } from "./processor";

export function registerMyToolProcessor(): void {
  registerProcessor("my-tool", processMyTool);
}
```

### 3. Add to Worker Initialization

```typescript
// apps/api-server/src/workers/index.ts
import { registerMyToolProcessor } from "@repo/api/modules/my-tool/lib/register";

const TOOL_SLUGS = [
  // ... existing tools
  "my-tool",
] as const;

function initializeProcessors(): void {
  registerAllProcessors();
  registerMyToolProcessor(); // Add new processor
}
```

## Job Lifecycle

```text
┌──────────┐
│ PENDING  │◄────────────────────────────────────────┐
└────┬─────┘                                         │
     │ Worker claims job                             │
     ▼                                               │
┌──────────────┐                                     │
│ PROCESSING   │                                     │
└────┬────┬────┘                                     │
     │    │                                          │
     │    │ Error + retries remaining                │
     │    └──────────────────────────────────────────┘
     │
     │ Success or max retries reached
     ▼
┌──────────────┐     ┌──────────────┐
│ COMPLETED    │     │   FAILED     │
└──────────────┘     └──────────────┘
```

## Environment Configuration

### Render (api-server)

```bash
# CRITICAL: Workers won't run without this!
USE_PGBOSS_WORKERS=true

# Required
DATABASE_URL=postgresql://...

# Optional
PGBOSS_BATCH_SIZE=5
PGBOSS_POLLING_INTERVAL=2
```

**WARNING**: If `USE_PGBOSS_WORKERS` is not set to `true`, workers will NOT start.
Jobs will be queued but never processed. This is the #1 cause of "stuck" jobs.

### Vercel (web)

```bash
# Required for cron authentication
CRON_SECRET=your-secret-here
```

### vercel.json

```json
{
  "crons": [
    {
      "path": "/api/cron/job-maintenance",
      "schedule": "* * * * *"
    }
  ]
}
```

## Testing

### Unit Tests

```typescript
// packages/api/modules/my-tool/lib/processor.test.ts
import { describe, it, expect, vi } from "vitest";
import { processMyTool } from "./processor";

describe("processMyTool", () => {
  it("should process valid input", async () => {
    const job = {
      id: "job-123",
      toolSlug: "my-tool",
      input: { text: "Hello" },
      // ... other fields
    };

    const result = await processMyTool(job);

    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
  });
});
```

### Configuration Tests

```typescript
// packages/api/modules/jobs/lib/job-config.test.ts
import { describe, it, expect } from "vitest";
import {
  JOB_TIMEOUT_MS,
  JOB_TIMEOUT_SECONDS,
  STUCK_JOB_TIMEOUT_MINUTES,
} from "./job-config";

describe("job-config", () => {
  it("should have consistent timeout values", () => {
    expect(JOB_TIMEOUT_SECONDS).toBe(JOB_TIMEOUT_MS / 1000);
  });

  it("should have stuck timeout greater than job timeout", () => {
    expect(STUCK_JOB_TIMEOUT_MINUTES).toBeGreaterThan(JOB_TIMEOUT_SECONDS / 60);
  });
});
```

### Integration Tests

Integration tests require the api-server running with `USE_PGBOSS_WORKERS=true`:

1. Start api-server locally
2. Create a job via API
3. Verify job is processed within polling interval
4. Check ToolJob status changes: PENDING → PROCESSING → COMPLETED

## Troubleshooting

### Jobs Not Being Processed

1. **Check api-server is running**:
   - Verify `USE_PGBOSS_WORKERS=true` is set
   - Check logs for "pg-boss started successfully"

2. **Check pg-boss queue**:

   ```sql
   SELECT * FROM pgboss.job WHERE name = 'my-tool' AND state = 'created';
   ```

3. **Check ToolJob status**:

   ```sql
   SELECT * FROM tool_job WHERE "toolSlug" = 'my-tool' AND status = 'PENDING';
   ```

### Stuck Jobs

Jobs stuck in PROCESSING status for > 30 minutes:

1. **Cron will mark them failed** automatically
2. **Check reconciliation ran**:

   ```sql
   -- Jobs that should have been reconciled
   SELECT tj.id, tj.status, tj."pgBossJobId", pj.state
   FROM tool_job tj
   LEFT JOIN pgboss.job pj ON tj."pgBossJobId" = pj.id::text
   WHERE tj.status = 'PROCESSING';
   ```

3. **Manual fix**:

   ```sql
   UPDATE tool_job
   SET status = 'FAILED', error = 'Manually marked as failed'
   WHERE status = 'PROCESSING'
   AND "startedAt" < NOW() - INTERVAL '30 minutes';
   ```

### State Divergence

If pg-boss shows job as completed but ToolJob is still PROCESSING:

1. **Check if onExpire handler ran** - look for logs with `[onExpire:]`
2. **Force reconciliation**:

   ```typescript
   import { reconcileJobStates } from "@repo/api/modules/jobs/lib/job-runner";
   await reconcileJobStates();
   ```

3. **Check archive table** - completed jobs may have been archived:

   ```sql
   SELECT * FROM pgboss.archive WHERE id = 'your-job-uuid';
   ```

### pg-boss Queue Issues

If pg-boss queue is corrupted or jobs are stuck:

```sql
-- Check queue status
SELECT name, COUNT(*), state
FROM pgboss.job
GROUP BY name, state;

-- Archive stuck jobs
UPDATE pgboss.job
SET state = 'cancelled'
WHERE state = 'active'
AND started_on < NOW() - INTERVAL '1 hour';
```

### Preview Environment Jobs Not Working

**Symptom:** Jobs submitted in preview environment return success but never appear in the database or get processed.

**Common causes:**

1. **Wrong database**: Render service pointing to wrong Supabase preview branch
2. **Wrong Render service**: Vercel proxy forwarding to a different PR's Render
3. **Stale deployment**: Vercel env vars changed but deployment not redeployed

**Diagnosis checklist:**

1. **Verify Render's DATABASE_URL points to correct Supabase branch:**

   ```bash
   pnpm --filter @repo/scripts render env list --service <service-id> | grep DATABASE
   ```

   - The URL should contain the correct Supabase preview project_ref

2. **Verify Vercel proxy is using correct Render URL:**

   ```bash
   vercel env ls preview | grep API_SERVER
   ```

   - Look for branch-specific entry matching your PR

3. **Check which database the job landed in:**

   ```sql
   -- Query each Supabase preview branch to find the job
   SELECT id, status, "createdAt" FROM tool_job WHERE id = '<job-id>';
   ```

**Resolution:**

1. **Re-run preview-sync** to ensure all env vars are correctly set:

   ```bash
   node tooling/scripts/src/preview-sync/index.mjs sync \
     --branch <branch-name> \
     --pr <pr-number>
   ```

2. **Trigger Vercel redeploy** to pick up new env vars:

   ```bash
   git commit --allow-empty -m "chore: trigger redeploy" && git push
   ```

3. **Verify all three services are aligned:**
   - Supabase preview branch → correct DATABASE_URL on Render
   - Render preview URL → correct NEXT_PUBLIC_API_SERVER_URL on Vercel
   - All env vars picked up by current deployment

See also: `api-proxy` skill for detailed proxy troubleshooting.

## Anonymous Job Ownership

Jobs can be created by anonymous users (not logged in). To verify ownership when polling:

### How It Works

1. **Job Creation**: Frontend generates a `sessionId` and stores in localStorage
2. **Job Create Request**: `sessionId` is passed in the request body
3. **Job Polling**: `x-session-id` header must be included for ownership verification

### Frontend Implementation

```typescript
// apps/web/modules/shared/lib/orpc-client.ts
const link = new RPCLink({
  url: getOrpcUrl(),
  headers: async () => {
    if (typeof window !== "undefined") {
      // Include x-session-id for anonymous job ownership
      const sessionId = localStorage.getItem("news-analyzer-session-id");
      if (sessionId) {
        return { "x-session-id": sessionId };
      }
      return {};
    }
    // Server-side: forward all headers
    const { headers } = await import("next/headers");
    return Object.fromEntries(await headers());
  },
});
```

### Backend Verification

```typescript
// packages/api/modules/jobs/procedures/get-job.ts
const requestSessionId = context.headers.get("x-session-id");

const isOwner =
  (userId && job.userId === userId) ||  // Authenticated user owns job
  (requestSessionId && job.sessionId === requestSessionId);  // Anonymous session match

if (!isOwner) {
  throw new ORPCError("FORBIDDEN", {
    message: "You do not have access to this job",
  });
}
```

**WARNING**: If `x-session-id` header is missing, anonymous users get 403 Forbidden
when polling their job status.

## Seed Data Warning

**CRITICAL**: Seeded jobs in `supabase/seed.sql` must ONLY use terminal states:

- `COMPLETED`
- `FAILED`

**Never seed PENDING or PROCESSING jobs** because:

1. They are not submitted to pg-boss queue
2. Workers will never process them
3. Frontend polling will hang indefinitely

```sql
-- CORRECT: Terminal state
INSERT INTO tool_job (id, status, ...) VALUES ('preview_job_001', 'COMPLETED', ...);

-- WRONG: Non-terminal state (will appear stuck)
INSERT INTO tool_job (id, status, ...) VALUES ('preview_job_002', 'PENDING', ...);
```

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
