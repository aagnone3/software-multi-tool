---
name: developing-sub-apps
description: Complete tool development including ToolJob database pattern, API modules, Inngest job processing, frontend UI, registry configuration, and testing. Use when creating tools from scratch, implementing tool databases, or setting up async job processing.
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

**Key components:**

- Define input/output schemas in `types.ts` using Zod
- Implement procedures using `publicProcedure` or `protectedProcedure`
- Export procedures from `router.ts` as an object
- Register router in `packages/api/orpc/router.ts`

See [implementation-patterns.md](implementation-patterns.md) for complete code examples.

### Step 5: Implement Job Processor

Create processor logic in `packages/api/modules/my-tool/lib/processor.ts`:

**Processor responsibilities:**

- Fetch job by ID using `getToolJobById()`
- Parse input and perform tool-specific processing
- Mark job as completed with `markJobCompleted(jobId, output)`
- Handle errors with `markJobFailed(jobId, errorMessage)`

**Register processor** in `packages/api/modules/jobs/lib/processor-registry.ts`:

```typescript
export const processorRegistry = {
  "my-tool": processMyToolJob,
};
```

See [implementation-patterns.md](implementation-patterns.md) for complete processor examples.

### Step 6: Create Frontend UI

Create tool page at `apps/web/app/(saas)/app/tools/my-tool/page.tsx`:

- Use Server Component for the page
- Import client component from `@/modules/saas/tools/my-tool/`

**Client component patterns:**

- Use `useApiMutation()` for creating jobs
- Use `useApiQuery()` with polling for job status
- Show loading states and error handling
- Poll job status until completed or failed

See [implementation-patterns.md](implementation-patterns.md) for complete UI examples with polling.

### Step 7: Update Middleware (if public tool)

For public tools, ensure `apps/web/middleware.ts` includes your tool's route in `isPublicToolRoute()`. The middleware checks `tool.public` from the registry.

### Step 8: Add Icon to ToolCard

Import the icon from Lucide React and add to `getToolIcon()` in `apps/web/modules/saas/tools/components/ToolCard.tsx`.

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

## Implementation Patterns

For detailed implementation patterns and complete examples, see [implementation-patterns.md](implementation-patterns.md).

### Quick Pattern Reference

#### Pattern 1: Synchronous Tool (Fast Processing)

- For operations < 500ms
- Process directly in API procedure, return immediately
- No job queue needed
- Example: Text formatters, validators

#### Pattern 2: Async Tool with Job Queue (Long Processing)

- For operations > 500ms or background processing
- Create job, return ID, process in background
- Client polls for results
- Example: Image processing, ML inference

#### Pattern 3: Hybrid Tool (Fast Preview + Full Processing)

- Return instant preview, create job for full results
- Show preview while job completes
- Example: SEO analyzers, data reports

## Testing

For comprehensive testing patterns and detailed examples, see [testing-patterns.md](testing-patterns.md).

### Quick Testing Reference

- **Unit tests**: Test API procedures in isolation using Vitest
- **Integration tests**: Test job processors with real database using Testcontainers
- **Database tests**: Use PostgreSQL container for isolated testing
- **Mock strategy**: Mock Inngest for background jobs, mock external APIs
- **E2E tests**: Use Playwright for complete user flows
- **Coverage**: Minimum thresholds enforced in CI (configured in `tooling/test/coverage-thresholds.ts`)

```bash
# Run all tests
pnpm test

# Run tests for specific workspace
pnpm --filter @repo/api test

# Run with coverage
pnpm test:ci
```

## Related Skills

- **tools**: For simple tool registration without backend implementation
- **architecture**: Overall codebase structure, API patterns, and Inngest documentation
- **prisma-migrate**: Database migration workflows
- **better-auth**: User authentication for private tools
- **managing-storage**: File upload patterns for tools
- **analytics**: Event tracking for tool usage
- **feature-flags**: A/B testing tool features
- **debugging**: Troubleshooting tool implementation issues

## Additional Resources

- **Progressive Disclosure**: For detailed examples and patterns, see:
  - `examples.md` in this skill directory (implementation examples)
  - `packages/api/modules/` for reference implementations
  - `packages/api/modules/jobs/README.md` for job queue details
  - `packages/database/README.md` for database patterns
