# Creating a New Job Processor

## Step 1: Create the Processor

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

## Step 2: Register the Processor

```typescript
// packages/api/modules/my-tool/lib/register.ts
import { registerProcessor } from "../jobs/lib/processor-registry";
import { processMyTool } from "./processor";

export function registerMyToolProcessor(): void {
  registerProcessor("my-tool", processMyTool);
}
```

## Step 3: Add to Worker Initialization

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
