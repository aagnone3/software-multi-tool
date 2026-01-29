# Implementation Patterns for Sub-Apps

This document provides detailed implementation patterns for common sub-application scenarios.

## Pattern Overview

Sub-apps typically follow one of three patterns based on processing requirements:

1. **Synchronous** - Fast operations that complete instantly
2. **Asynchronous** - Long-running operations using job queue
3. **Hybrid** - Quick preview + full processing

## Pattern 1: Synchronous Tool (Fast Processing)

For tools that complete instantly (< 500ms):

- Process directly in the API procedure
- Return results immediately
- No job queue needed
- Best for: Format converters, validators, simple transformations

### Example: Text Formatter

```typescript
// packages/api/modules/text-formatter/types.ts
import { z } from "zod";

export const FormatInputSchema = z.object({
  text: z.string(),
  format: z.enum(["uppercase", "lowercase", "titlecase"]),
});

export type FormatInput = z.infer<typeof FormatInputSchema>;

export interface FormatOutput {
  formatted: string;
  characterCount: number;
}
```

```typescript
// packages/api/modules/text-formatter/procedures/format.ts
import { publicProcedure } from "../../../orpc/procedures";
import { FormatInputSchema, type FormatOutput } from "../types";

export const format = publicProcedure
  .route({
    method: "POST",
    path: "/text-formatter/format",
    tags: ["TextFormatter"],
    summary: "Format text",
  })
  .input(FormatInputSchema)
  .handler(async ({ input }): Promise<{ result: FormatOutput }> => {
    // Process immediately
    let formatted: string;
    switch (input.format) {
      case "uppercase":
        formatted = input.text.toUpperCase();
        break;
      case "lowercase":
        formatted = input.text.toLowerCase();
        break;
      case "titlecase":
        formatted = input.text.replace(/\b\w/g, (c) => c.toUpperCase());
        break;
    }

    return {
      result: {
        formatted,
        characterCount: formatted.length,
      },
    };
  });
```

```typescript
// packages/api/modules/text-formatter/router.ts
import { format } from "./procedures/format";

export const textFormatterRouter = {
  format,
};
```

## Pattern 2: Async Tool with Job Queue (Long Processing)

For tools that take > 500ms or require background processing:

- Create job in API procedure
- Return job ID immediately
- Process in background worker
- Client polls for results
- Best for: File processing, ML inference, external API calls

### Example: Image Processor

```typescript
// packages/api/modules/image-processor/types.ts
import { z } from "zod";

export const ProcessImageInputSchema = z.object({
  imageUrl: z.string().url(),
  effect: z.enum(["grayscale", "blur", "sharpen"]),
  sessionId: z.string().optional(), // For anonymous users
});

export type ProcessImageInput = z.infer<typeof ProcessImageInputSchema>;

export interface ProcessImageOutput {
  resultUrl: string;
  processingTime: number;
}
```

```typescript
// packages/api/modules/image-processor/procedures/create-job.ts
import { publicProcedure } from "../../../orpc/procedures";
import { createToolJob, type Prisma } from "@repo/database";
import { ProcessImageInputSchema } from "../types";

function generateSessionId(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

export const createJob = publicProcedure
  .route({
    method: "POST",
    path: "/image-processor/jobs",
    tags: ["ImageProcessor"],
    summary: "Create image processing job",
  })
  .input(ProcessImageInputSchema)
  .handler(async ({ input, context }) => {
    // Try to get authenticated user
    let userId: string | undefined;
    try {
      const { auth } = await import("@repo/auth");
      const session = await auth.api.getSession({
        headers: context.headers,
      });
      userId = session?.user?.id;
    } catch {
      // Not authenticated
    }

    // For anonymous users, use or generate sessionId
    const sessionId = !userId ? (input.sessionId || generateSessionId()) : undefined;

    const job = await createToolJob({
      toolSlug: "image-processor",
      input: input as Prisma.InputJsonValue,
      userId,
      sessionId,
      priority: 0,
    });

    return { job };
  });
```

```typescript
// packages/api/modules/image-processor/procedures/get-job.ts
import { publicProcedure } from "../../../orpc/procedures";
import { getToolJobById } from "@repo/database";
import { z } from "zod";

export const getJob = publicProcedure
  .route({
    method: "GET",
    path: "/image-processor/jobs/:jobId",
    tags: ["ImageProcessor"],
    summary: "Get job status",
  })
  .input(z.object({ jobId: z.string() }))
  .handler(async ({ input }) => {
    const job = await getToolJobById(input.jobId);
    return { job };
  });
```

```typescript
// packages/api/modules/image-processor/lib/processor.ts
import { getToolJobById, markJobCompleted, markJobFailed } from "@repo/database";
import type { ProcessImageInput, ProcessImageOutput } from "../types";

export async function processImageJob(jobId: string) {
  const job = await getToolJobById(jobId);

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  const startTime = Date.now();

  try {
    const input = job.input as ProcessImageInput;

    // Download image
    const response = await fetch(input.imageUrl);
    const imageBuffer = await response.arrayBuffer();

    // Apply effect (simplified example)
    const processedBuffer = await applyEffect(imageBuffer, input.effect);

    // Upload result to storage
    const { uploadFile } = await import("@repo/storage");
    const resultUrl = await uploadFile({
      buffer: Buffer.from(processedBuffer),
      filename: `processed-${Date.now()}.png`,
      contentType: "image/png",
    });

    const output: ProcessImageOutput = {
      resultUrl,
      processingTime: Date.now() - startTime,
    };

    await markJobCompleted(jobId, output as any);
  } catch (error) {
    await markJobFailed(
      jobId,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

async function applyEffect(buffer: ArrayBuffer, effect: string) {
  // Implement image processing logic
  // This could use libraries like sharp, jimp, etc.
  return buffer;
}
```

```typescript
// packages/api/modules/image-processor/router.ts
import { createJob } from "./procedures/create-job";
import { getJob } from "./procedures/get-job";

export const imageProcessorRouter = {
  jobs: {
    create: createJob,
    get: getJob,
  },
};
```

### Frontend: Polling Pattern

```tsx
// apps/web/modules/saas/tools/image-processor/ImageProcessorClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useApiMutation, useApiQuery } from "@/lib/api-client";

export function ImageProcessorClient() {
  const [jobId, setJobId] = useState<string | null>(null);

  const createJob = useApiMutation(
    (client) => client.imageProcessor.jobs.create,
    {
      onSuccess: (data) => {
        setJobId(data.job.id);
      },
    }
  );

  // Poll for job status
  const { data: jobData } = useApiQuery(
    (client) => client.imageProcessor.jobs.get,
    { jobId: jobId! },
    {
      enabled: !!jobId,
      refetchInterval: (data) => {
        // Stop polling when completed or failed
        if (data?.job?.status === "COMPLETED" || data?.job?.status === "FAILED") {
          return false;
        }
        return 1000; // Poll every second
      },
    }
  );

  const handleSubmit = (imageUrl: string, effect: string) => {
    createJob.mutate({ imageUrl, effect });
  };

  return (
    <div>
      {!jobId && <UploadForm onSubmit={handleSubmit} />}
      {jobId && <JobStatus job={jobData?.job} />}
    </div>
  );
}
```

## Pattern 3: Hybrid Tool (Fast Preview + Full Processing)

For tools that can show quick preview but also detailed results:

- Return instant preview in API response
- Create job for full processing
- Show preview while job completes
- Best for: Data analysis, report generation, content optimization

### Example: SEO Analyzer

```typescript
// packages/api/modules/seo-analyzer/types.ts
import { z } from "zod";

export const AnalyzeInputSchema = z.object({
  url: z.string().url(),
  depth: z.enum(["quick", "full"]),
});

export interface QuickAnalysis {
  title: string;
  description: string;
  wordCount: number;
}

export interface FullAnalysis extends QuickAnalysis {
  keywords: string[];
  backlinks: number;
  score: number;
  recommendations: string[];
}
```

```typescript
// packages/api/modules/seo-analyzer/procedures/analyze.ts
import { publicProcedure } from "../../../orpc/procedures";
import { createToolJob, type Prisma } from "@repo/database";
import { AnalyzeInputSchema, type QuickAnalysis } from "../types";

export const analyze = publicProcedure
  .input(AnalyzeInputSchema)
  .handler(async ({ input }) => {
    // Always perform quick analysis immediately
    const response = await fetch(input.url);
    const html = await response.text();

    const quickAnalysis: QuickAnalysis = {
      title: extractTitle(html),
      description: extractDescription(html),
      wordCount: countWords(html),
    };

    // For full analysis, create a job
    let jobId: string | undefined;
    if (input.depth === "full") {
      const job = await createToolJob({
        toolSlug: "seo-analyzer",
        input: input as Prisma.InputJsonValue,
      });
      jobId = job.id;
    }

    return {
      preview: quickAnalysis,
      jobId, // Only present for full analysis
    };
  });
```

## Common Utilities

### Session Management

```typescript
// packages/api/orpc/utils/session.ts
export async function getUserSession(headers: Headers) {
  try {
    const { auth } = await import("@repo/auth");
    const session = await auth.api.getSession({ headers });
    return session?.user?.id;
  } catch {
    return undefined;
  }
}

export function generateSessionId(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}
```

### Error Handling

```typescript
// packages/api/orpc/utils/errors.ts
import { ORPCError } from "@orpc/client";

export function handleToolError(error: unknown): never {
  if (error instanceof ORPCError) {
    throw error;
  }

  if (error instanceof Error) {
    throw new ORPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }

  throw new ORPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
  });
}
```

## Choosing the Right Pattern

| Criteria | Synchronous | Asynchronous | Hybrid |
|----------|------------|--------------|--------|
| Processing time | < 500ms | > 500ms | Variable |
| User feedback | Immediate | Polling required | Instant preview + polling |
| Complexity | Low | Medium | High |
| Best for | Simple transforms | Heavy processing | Adaptive UX |

## Related Documentation

- `SKILL.md` - Main sub-app development guide
- `testing-patterns.md` - Testing approaches for each pattern
- `packages/api/modules/jobs/README.md` - Job queue details
