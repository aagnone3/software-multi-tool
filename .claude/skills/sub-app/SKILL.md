---
name: sub-app
description: Use this skill when creating new sub-applications/tools in the multi-app structure, implementing tool-specific database schemas, API endpoints, or understanding the complete sub-app development workflow
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Glob
  - Grep
---

# Sub-App Development Skill

This skill provides comprehensive guidance for creating new sub-applications (tools/utilities) within the multi-app architecture. Use this when building complete tools from scratch, not just registering them in the config.

## Quick Reference

| Component                    | Location                                        |
| ---------------------------- | ----------------------------------------------- |
| Tool Registry Config         | `config/index.ts` (tools.registry)              |
| Tool Type Definition         | `config/types.ts` (ToolConfig)                  |
| Database Schema              | `packages/database/prisma/schema.prisma`        |
| Database Query Helpers       | `packages/database/prisma/queries/`             |
| API Module Template          | `packages/api/modules/<module-name>/`           |
| Job Queue System             | `packages/api/modules/jobs/`                    |
| Tool Routes                  | `apps/web/app/(saas)/app/tools/[toolSlug]/`     |
| Middleware (public access)   | `apps/web/middleware.ts`                        |

## When to Use This Skill

Invoke this skill when:

- Creating a new tool/sub-app from scratch
- Implementing tool-specific database models
- Setting up API endpoints for a tool
- Understanding the async job queue pattern
- Adding database query helpers for a tool
- Building tool-specific UI components
- Questions like "How do I create a new tool?" or "What's the pattern for tool database models?"

**Note**: For just registering an existing tool in the config, use the `tools` skill instead. This skill is for complete implementations.

## Architecture Overview

### Sub-App Components

A complete sub-app typically consists of:

1. **Registry Entry** - Tool metadata in `config/index.ts`
2. **Database Models** - Tool-specific data models in Prisma schema
3. **Query Helpers** - Database access functions in `packages/database/prisma/queries/`
4. **API Module** - Backend procedures in `packages/api/modules/`
5. **Frontend UI** - React components in `apps/web/app/(saas)/app/tools/[toolSlug]/`
6. **Rate Limiting** - Per-tool rate limits (defined in registry)

### Async Job Queue System

For long-running operations, tools use the shared job queue:

- **Generic Job Model**: `ToolJob` model stores all tool jobs
- **Tool-Specific Input/Output**: JSON fields for flexibility
- **Job Processors**: Tool-specific logic for processing jobs
- **Worker Pool**: Automated job claiming and processing

## Step-by-Step: Creating a New Sub-App

### Step 1: Register the Tool

Add the tool to `config/index.ts` in the `tools.registry` array:

```typescript
{
  slug: "my-new-tool",           // URL-safe identifier
  name: "My New Tool",           // Display name
  description: "Brief description of what this tool does",
  icon: "wrench",                // Lucide icon name
  public: true,                  // Whether accessible without auth
  enabled: true,                 // Whether currently active
  rateLimits: {
    anonymous: { requests: 5, window: "1d" },      // Unauthenticated users
    authenticated: { requests: 60, window: "1h" }, // Authenticated users
  },
}
```

### Step 2: Define Database Schema (if needed)

**CRITICAL PATTERN**: The project uses a **shared generic `ToolJob` model** for all tools, NOT tool-specific models.

#### Generic Job Model (Already Exists)

```prisma
// packages/database/prisma/schema.prisma
model ToolJob {
  id          String        @id @default(cuid())
  toolSlug    String        // Identifies which tool owns this job
  status      ToolJobStatus @default(PENDING)
  priority    Int           @default(0)

  // Tool-specific data stored as JSON
  input       Json          // Tool-specific input data
  output      Json?         // Tool-specific output data
  error       String?       // Error message if failed

  // Ownership (supports both authenticated and anonymous users)
  userId      String?
  user        User?         @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessionId   String?       // For anonymous users

  // Job lifecycle tracking
  attempts    Int           @default(0)
  maxAttempts Int           @default(3)
  startedAt   DateTime?
  completedAt DateTime?
  expiresAt   DateTime      // Auto-cleanup after this time

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([status, priority])
  @@index([toolSlug, status])
  @@index([userId])
  @@index([sessionId])
  @@index([expiresAt])
  @@map("tool_job")
}

enum ToolJobStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}
```

**Key Design Principles**:

1. **One Model for All Tools**: Instead of `BgRemover_Job`, `Diarization_Job`, etc., use `ToolJob.toolSlug` to identify the tool
2. **JSON Input/Output**: Each tool defines its own TypeScript types for input/output, serialized to JSON
3. **Session Support**: Supports both authenticated users (`userId`) and anonymous users (`sessionId`)
4. **Auto-Cleanup**: Jobs expire after `expiresAt` for automatic garbage collection

#### Tool-Specific Metadata Models (Optional)

If your tool needs persistent data beyond jobs (e.g., user preferences, history, configurations):

```prisma
// Use prefixed model names for tool-specific data
model MyTool_UserPreferences {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  settings   Json     // Tool-specific settings
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([userId])
  @@map("mytool_user_preferences")
}
```

After adding models, run:

```bash
# Generate Prisma client and Zod schemas
pnpm --filter @repo/database generate

# Create migration
pnpm --filter @repo/database migrate

# Or push directly for development (skips migration)
pnpm --filter @repo/database push
```

### Step 3: Create Query Helpers

**IMPORTANT**: Use the existing generic job query helpers in `packages/database/prisma/queries/tool-jobs.ts`:

```typescript
// Already implemented - use these functions:
import {
  createToolJob,          // Create a new job
  getToolJobById,         // Get job by ID
  getToolJobsByUserId,    // List user's jobs
  getToolJobsBySessionId, // List anonymous user's jobs
  cancelToolJob,          // Cancel a job
  markJobCompleted,       // Mark job as completed with output
  markJobFailed,          // Mark job as failed with error
} from "@repo/database";
```

#### TypeScript Types for Your Tool

Define input/output types in your API module:

```typescript
// packages/api/modules/my-tool/types.ts
import { z } from "zod";

// Input schema for creating a job
export const MyToolInputSchema = z.object({
  parameter1: z.string(),
  parameter2: z.number().optional(),
  // ... tool-specific parameters
});

export type MyToolInput = z.infer<typeof MyToolInputSchema>;

// Output schema for job results
export interface MyToolOutput {
  resultUrl?: string;
  metadata?: Record<string, any>;
  // ... tool-specific results
}
```

### Step 4: Create API Module

API modules follow a consistent structure:

```text
packages/api/modules/my-tool/
├── router.ts              # Export router object
├── types.ts               # Zod schemas and TypeScript types
├── procedures/            # Individual API procedures
│   ├── create-job.ts     # Create a job for the tool
│   ├── get-job.ts        # Get job status/results
│   └── list-jobs.ts      # List user's jobs
└── lib/                  # Tool-specific logic
    └── processor.ts      # Job processing logic
```

#### Example: Create Job Procedure

```typescript
// packages/api/modules/my-tool/procedures/create-job.ts
import { publicProcedure } from "../../../orpc/procedures";
import { createToolJob, type Prisma } from "@repo/database";
import { MyToolInputSchema } from "../types";
import { ORPCError } from "@orpc/client";

export const createJob = publicProcedure
  .route({
    method: "POST",
    path: "/my-tool/jobs",
    tags: ["MyTool"],
    summary: "Create My Tool job",
    description: "Create a new async job for My Tool",
  })
  .input(MyToolInputSchema)
  .handler(async ({ input, context }) => {
    // Try to get user from session if authenticated
    let userId: string | undefined;
    try {
      const { auth } = await import("@repo/auth");
      const session = await auth.api.getSession({
        headers: context.headers,
      });
      userId = session?.user?.id;
    } catch {
      // Not authenticated, continue without userId
    }

    // For anonymous users, generate or accept a sessionId
    const sessionId = !userId ? (input.sessionId || generateSessionId()) : undefined;

    const job = await createToolJob({
      toolSlug: "my-tool",
      input: input as Prisma.InputJsonValue,
      userId,
      sessionId,
      priority: 0,
    });

    return { job };
  });
```

#### Example: Router

```typescript
// packages/api/modules/my-tool/router.ts
import { createJob } from "./procedures/create-job";
import { getJob } from "./procedures/get-job";
import { listJobs } from "./procedures/list-jobs";

export const myToolRouter = {
  jobs: {
    create: createJob,
    get: getJob,
    list: listJobs,
  },
};
```

#### Register Router in Main API

```typescript
// packages/api/orpc/router.ts
import { myToolRouter } from "../modules/my-tool/router";

export const apiRouter = {
  // ... existing routers
  myTool: myToolRouter,
};
```

### Step 5: Implement Job Processor

Create processor logic that runs in the background:

```typescript
// packages/api/modules/my-tool/lib/processor.ts
import { getToolJobById, markJobCompleted, markJobFailed } from "@repo/database";
import type { MyToolInput, MyToolOutput } from "../types";

export async function processMyToolJob(jobId: string) {
  const job = await getToolJobById(jobId);

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  try {
    // Parse input
    const input = job.input as MyToolInput;

    // Perform tool-specific processing
    // This could involve:
    // - Calling external APIs
    // - Running ML models
    // - Processing files
    // - etc.
    const result = await performToolLogic(input);

    // Prepare output
    const output: MyToolOutput = {
      resultUrl: result.url,
      metadata: result.metadata,
    };

    // Mark job as completed
    await markJobCompleted(jobId, output as any);

  } catch (error) {
    // Mark job as failed
    await markJobFailed(
      jobId,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

async function performToolLogic(input: MyToolInput) {
  // Implement your tool-specific logic here
  // ...
}
```

#### Register Processor

```typescript
// packages/api/modules/jobs/lib/processor-registry.ts
import { processMyToolJob } from "../../my-tool/lib/processor";

export const processorRegistry = {
  "my-tool": processMyToolJob,
  // ... other tool processors
};
```

### Step 6: Create Frontend UI

#### Basic Tool Page

```tsx
// apps/web/app/(saas)/app/tools/my-tool/page.tsx
import { MyToolClient } from "@/modules/saas/tools/my-tool/MyToolClient";

export default function MyToolPage() {
  return <MyToolClient />;
}
```

#### Client Component

```tsx
// apps/web/modules/saas/tools/my-tool/MyToolClient.tsx
"use client";

import { useState } from "react";
import { useApiMutation } from "@/lib/api-client";

export function MyToolClient() {
  const [input, setInput] = useState("");

  const createJob = useApiMutation(
    (client) => client.myTool.jobs.create,
    {
      onSuccess: (data) => {
        console.log("Job created:", data.job);
        // Poll for job status or redirect to results
      },
    }
  );

  const handleSubmit = () => {
    createJob.mutate({
      parameter1: input,
    });
  };

  return (
    <div className="container max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">My New Tool</h1>

      <div className="space-y-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter input..."
          className="w-full px-4 py-2 border rounded"
        />

        <button
          onClick={handleSubmit}
          disabled={createJob.isPending}
          className="px-6 py-2 bg-blue-600 text-white rounded"
        >
          {createJob.isPending ? "Processing..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
```

### Step 7: Update Middleware (if public tool)

If your tool should be accessible without authentication, ensure middleware allows it:

```typescript
// apps/web/middleware.ts
function isPublicToolRoute(pathname: string): boolean {
  if (!pathname.startsWith("/app/tools")) return false;
  if (pathname === "/app/tools") return true;

  const toolSlug = pathname.split("/app/tools/")[1]?.split("/")[0];
  const tool = appConfig.tools.registry.find(
    (t) => t.slug === toolSlug && t.enabled
  );
  return tool?.public ?? false;
}
```

### Step 8: Add Icon to ToolCard

```typescript
// apps/web/modules/saas/tools/components/ToolCard.tsx
import { WrenchIcon, MyNewToolIcon } from "lucide-react";

function getToolIcon(iconName: string) {
  const icons = {
    "wrench": WrenchIcon,
    "my-new-tool": MyNewToolIcon,
    // ... other icons
  };
  return icons[iconName] || WrenchIcon;
}
```

## Best Practices

### Database Schema

1. **Use Generic ToolJob Model**: Don't create tool-specific job models
2. **Tool-Specific Metadata Only**: Only create separate models for non-job data
3. **Prefix Model Names**: Use `ToolName_ModelName` pattern (e.g., `BgRemover_UserSettings`)
4. **JSON for Flexibility**: Use JSON fields for tool-specific data structures

### API Design

1. **Follow Module Pattern**: Organize by domain in `packages/api/modules/`
2. **Procedure Naming**: Use CRUD verbs (create, get, list, update, delete, cancel)
3. **Public Procedures**: Use `publicProcedure` for tools accessible to anonymous users
4. **Protected Procedures**: Use `protectedProcedure` when authentication is required
5. **Error Handling**: Use `ORPCError` with appropriate HTTP status codes

### Job Processing

1. **Idempotent Operations**: Design processors to be safely retryable
2. **Timeouts**: Set reasonable `maxAttempts` for job retry logic
3. **Expiration**: Set appropriate `expiresAt` for job cleanup
4. **Progress Updates**: For long jobs, consider storing progress in job output
5. **Error Messages**: Provide clear, actionable error messages

### Frontend

1. **Server Components First**: Use RSC by default, client components only when needed
2. **Loading States**: Show clear loading indicators during job processing
3. **Error Handling**: Display user-friendly error messages
4. **Polling Pattern**: Poll job status for async operations
5. **Progressive Enhancement**: Ensure basic functionality without JavaScript

### Rate Limiting

1. **Tiered Limits**: Provide more generous limits for authenticated users
2. **Per-Tool Limits**: Configure in registry, not hardcoded in logic
3. **Clear Feedback**: Show users their usage limits and remaining quota

## Common Patterns

### Pattern 1: Synchronous Tool (Fast Processing)

For tools that complete instantly (< 500ms):

- Process directly in the API procedure
- Return results immediately
- No job queue needed

```typescript
export const processSync = publicProcedure
  .input(MyToolInputSchema)
  .handler(async ({ input }) => {
    const result = await performFastOperation(input);
    return { result };
  });
```

### Pattern 2: Async Tool with Job Queue (Long Processing)

For tools that take > 500ms or require background processing:

- Create job in API procedure
- Return job ID immediately
- Process in background worker
- Client polls for results

```typescript
// 1. Create job endpoint (returns immediately)
export const createJob = publicProcedure
  .input(MyToolInputSchema)
  .handler(async ({ input }) => {
    const job = await createToolJob({
      toolSlug: "my-tool",
      input: input as any,
    });
    return { jobId: job.id };
  });

// 2. Get job status endpoint (polling target)
export const getJob = publicProcedure
  .input(z.object({ jobId: z.string() }))
  .handler(async ({ input }) => {
    const job = await getToolJobById(input.jobId);
    return { job };
  });

// 3. Background processor
export async function processMyToolJob(jobId: string) {
  // ... processing logic
}
```

### Pattern 3: Hybrid Tool (Fast Preview + Full Processing)

For tools that can show quick preview but also detailed results:

- Return instant preview in API response
- Create job for full processing
- Show preview while job completes

## Testing

### Unit Tests for Procedures

```typescript
// packages/api/modules/my-tool/router.test.ts
import { describe, it, expect } from "vitest";
import { myToolRouter } from "./router";

describe("myToolRouter", () => {
  it("creates a job", async () => {
    const result = await myToolRouter.jobs.create({
      input: { parameter1: "test" },
      context: { headers: new Headers() },
    });

    expect(result.job).toBeDefined();
    expect(result.job.toolSlug).toBe("my-tool");
  });
});
```

### Integration Tests for Processors

```typescript
// packages/api/modules/my-tool/lib/processor.test.ts
import { describe, it, expect } from "vitest";
import { processMyToolJob } from "./processor";
import { createToolJob, getToolJobById } from "@repo/database";

describe("processMyToolJob", () => {
  it("processes job successfully", async () => {
    // Create test job
    const job = await createToolJob({
      toolSlug: "my-tool",
      input: { parameter1: "test" },
    });

    // Process job
    await processMyToolJob(job.id);

    // Verify results
    const processed = await getToolJobById(job.id);
    expect(processed?.status).toBe("COMPLETED");
    expect(processed?.output).toBeDefined();
  });
});
```

## Related Skills

- **tools**: For simple tool registration without backend implementation
- **architecture**: Overall codebase structure and API patterns
- **prisma-migrate**: Database migration workflows
- **better-auth**: User authentication for private tools

## Additional Resources

- Examples: See `examples.md` in this skill directory
- Existing modules: `packages/api/modules/` for reference implementations
- Job queue docs: `packages/api/modules/jobs/README.md`
- Database docs: `packages/database/README.md`
