# Async Jobs Skill

> **Purpose**: Guide for implementing and managing async job processing with pg-boss

This skill documents the async job processing architecture using pg-boss as the primary job queue system.

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Job Processing Flow                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Job Creation (Vercel)           Job Processing (Render)                    │
│  ───────────────────            ─────────────────────────                   │
│                                                                             │
│  ┌─────────────────┐            ┌─────────────────────┐                     │
│  │ create-job.ts   │            │ api-server workers  │                     │
│  │                 │            │                     │                     │
│  │ 1. Create       │            │ 1. Poll pg-boss     │                     │
│  │    ToolJob      │──────────→ │    queue            │                     │
│  │ 2. Submit to    │  pg-boss   │ 2. Claim ToolJob    │                     │
│  │    pg-boss      │  queue     │ 3. Run processor    │                     │
│  │    queue        │            │ 4. Update result    │                     │
│  └─────────────────┘            └─────────────────────┘                     │
│                                                                             │
│  Frontend Polling (Browser)      Maintenance (Vercel Cron)                  │
│  ──────────────────────────      ─────────────────────────                  │
│                                                                             │
│  ┌─────────────────────────┐    ┌─────────────────────────┐                 │
│  │ jobs.get (oRPC)         │    │ /api/cron/job-maintenance│                │
│  │                         │    │                         │                 │
│  │ • Poll tool_job status  │    │ • Mark stuck jobs failed│                 │
│  │ • Requires x-session-id │    │ • Clean up expired jobs │                 │
│  │   header for ownership  │    └─────────────────────────┘                 │
│  └─────────────────────────┘                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

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
│  │         COMPLETED/      │              │        completed/failed    │    │
│  │         FAILED          │              │                            │    │
│  │ pgBossJobId: "uuid..."  │─────────────►│ id: "uuid..."              │    │
│  │ output: {...}           │              │ output: {...}              │    │
│  │ error: "..."            │              │                            │    │
│  └─────────────────────────┘              └────────────────────────────┘    │
│                                                                             │
│  Frontend reads: tool_job                 Worker reads: pgboss.job          │
│  Worker writes: tool_job                  pg-boss writes: pgboss.job        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Important**:

- `tool_job` is the source of truth for job status displayed to users
- `pgboss.job` is the queue mechanism for worker coordination
- Both tables MUST be updated - orphaned records in either table cause bugs

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
// Insert job into pg-boss queue
await db.$queryRaw`
  INSERT INTO pgboss.job (name, data, priority, ...)
  VALUES (${queueName}, ${JSON.stringify({ toolJobId })}::jsonb, ${priority}, ...)
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
// Register worker for each tool
await boss.work<JobPayload>(
  toolSlug,
  { batchSize: 5, pollingIntervalSeconds: 2 },
  async (jobs) => {
    for (const job of jobs) {
      // 1. Atomically claim ToolJob (PENDING → PROCESSING)
      // 2. Get processor for tool
      // 3. Execute processor
      // 4. Update ToolJob with result
    }
  }
);
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

Cron job for maintenance tasks only:

```typescript
// Mark stuck jobs as failed (processing > 30 minutes)
const stuckResult = await handleStuckJobs(30);

// Clean up expired jobs
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
  "expire_in"    INTERVAL DEFAULT '00:15:00',
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

**⚠️ WARNING**: If `USE_PGBOSS_WORKERS` is not set to `true`, workers will NOT start.
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
2. **Manual fix**:

   ```sql
   UPDATE tool_job
   SET status = 'FAILED', error = 'Manually marked as failed'
   WHERE status = 'PROCESSING'
   AND "startedAt" < NOW() - INTERVAL '30 minutes';
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

**⚠️ WARNING**: If `x-session-id` header is missing, anonymous users get 403 Forbidden
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
-- ✅ CORRECT: Terminal state
INSERT INTO tool_job (id, status, ...) VALUES ('preview_job_001', 'COMPLETED', ...);

-- ❌ WRONG: Non-terminal state (will appear stuck)
INSERT INTO tool_job (id, status, ...) VALUES ('preview_job_002', 'PENDING', ...);
```

## Related Files

- `packages/api/modules/jobs/procedures/create-job.ts` - Job creation endpoint
- `packages/api/modules/jobs/lib/queue.ts` - pg-boss queue submission
- `packages/api/modules/jobs/lib/job-runner.ts` - Maintenance utilities
- `packages/api/modules/jobs/lib/processor-registry.ts` - Processor registration
- `apps/api-server/src/workers/index.ts` - pg-boss workers
- `apps/api-server/src/lib/pg-boss.ts` - pg-boss client configuration
- `apps/web/app/api/cron/job-maintenance/route.ts` - Cron maintenance
- `packages/database/prisma/schema.prisma` - ToolJob schema
- `packages/database/prisma/queries/tool-jobs.ts` - Database queries
