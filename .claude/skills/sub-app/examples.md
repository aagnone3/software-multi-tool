# Sub-App Development Examples

This document provides complete, step-by-step walkthroughs for common sub-app patterns.

## Table of Contents

1. [Example 1: Simple Synchronous Tool](#example-1-simple-synchronous-tool)
2. [Example 2: Async Tool with Job Queue](#example-2-async-tool-with-job-queue)
3. [Example 3: Tool with Persistent User Data](#example-3-tool-with-persistent-user-data)

---

## Example 1: Simple Synchronous Tool

**Use case**: A URL shortener that processes requests instantly (< 500ms).

### Step 1: Register the Tool

```typescript
// config/index.ts
tools: {
  registry: [
    // ... existing tools
    {
      slug: "url-shortener",
      name: "URL Shortener",
      description: "Create short, shareable links from long URLs",
      icon: "link",
      public: true,
      enabled: true,
      rateLimits: {
        anonymous: { requests: 20, window: "1h" },
        authenticated: { requests: 200, window: "1h" },
      },
    },
  ],
}
```

### Step 2: Create API Module

```typescript
// packages/api/modules/url-shortener/types.ts
import { z } from "zod";

export const CreateShortUrlSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  customSlug: z.string().min(3).max(20).optional(),
});

export type CreateShortUrlInput = z.infer<typeof CreateShortUrlSchema>;

export interface CreateShortUrlOutput {
  shortUrl: string;
  slug: string;
  originalUrl: string;
}
```

```typescript
// packages/api/modules/url-shortener/procedures/create-short-url.ts
import { publicProcedure } from "../../../orpc/procedures";
import { CreateShortUrlSchema, type CreateShortUrlOutput } from "../types";
import { generateSlug } from "../lib/slug-generator";

export const createShortUrl = publicProcedure
  .route({
    method: "POST",
    path: "/url-shortener/shorten",
    tags: ["UrlShortener"],
    summary: "Create short URL",
    description: "Generate a short URL from a long URL",
  })
  .input(CreateShortUrlSchema)
  .handler(async ({ input }): Promise<CreateShortUrlOutput> => {
    const slug = input.customSlug || generateSlug();

    // Store in database (simplified)
    // await db.urlMapping.create({ data: { slug, url: input.url } });

    return {
      shortUrl: `https://yourdomain.com/${slug}`,
      slug,
      originalUrl: input.url,
    };
  });
```

```typescript
// packages/api/modules/url-shortener/router.ts
import { createShortUrl } from "./procedures/create-short-url";

export const urlShortenerRouter = {
  shorten: createShortUrl,
};
```

### Step 3: Register Router

```typescript
// packages/api/orpc/router.ts
import { urlShortenerRouter } from "../modules/url-shortener/router";

export const apiRouter = {
  // ... existing routers
  urlShortener: urlShortenerRouter,
};
```

### Step 4: Create Frontend

```tsx
// apps/web/app/(saas)/app/tools/url-shortener/page.tsx
import { UrlShortenerClient } from "@/modules/saas/tools/url-shortener/UrlShortenerClient";

export default function UrlShortenerPage() {
  return <UrlShortenerClient />;
}
```

```tsx
// apps/web/modules/saas/tools/url-shortener/UrlShortenerClient.tsx
"use client";

import { useState } from "react";
import { useApiMutation } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UrlShortenerClient() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const shorten = useApiMutation(
    (client) => client.urlShortener.shorten,
    {
      onSuccess: (data) => {
        setResult(data.shortUrl);
      },
    }
  );

  return (
    <div className="container max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">URL Shortener</h1>
      <p className="text-muted-foreground mb-6">
        Create short, shareable links from long URLs
      </p>

      <div className="space-y-4">
        <Input
          type="url"
          placeholder="https://example.com/very-long-url..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <Button
          onClick={() => shorten.mutate({ url })}
          disabled={shorten.isPending || !url}
          className="w-full"
        >
          {shorten.isPending ? "Shortening..." : "Shorten URL"}
        </Button>

        {result && (
          <div className="p-4 bg-green-50 rounded border border-green-200">
            <p className="text-sm text-muted-foreground mb-1">
              Short URL:
            </p>
            <a
              href={result}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-mono text-blue-600 hover:underline"
            >
              {result}
            </a>
          </div>
        )}

        {shorten.isError && (
          <div className="p-4 bg-red-50 rounded border border-red-200">
            <p className="text-sm text-red-600">
              {shorten.error?.message || "Failed to shorten URL"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Key Points**:

- No job queue needed - immediate response
- Simple API procedure pattern
- Error handling in UI
- Public access with rate limits

---

## Example 2: Async Tool with Job Queue

**Use case**: An image background remover that takes 5-30 seconds to process.

### Step 1: Register the Tool in Config

```typescript
// config/index.ts
tools: {
  registry: [
    // ... existing tools
    {
      slug: "bg-remover",
      name: "Background Remover",
      description: "Remove backgrounds from images with AI",
      icon: "image-minus",
      public: true,
      enabled: true,
      rateLimits: {
        anonymous: { requests: 5, window: "1d" },
        authenticated: { requests: 60, window: "1h" },
      },
    },
  ],
}
```

### Step 2: Define TypeScript Types

```typescript
// packages/api/modules/bg-remover/types.ts
import { z } from "zod";

export const CreateBgRemoverJobSchema = z.object({
  imageUrl: z.string().url("Must be a valid image URL"),
  format: z.enum(["png", "jpg", "webp"]).default("png"),
  sessionId: z.string().optional(), // For anonymous users
});

export type CreateBgRemoverJobInput = z.infer<typeof CreateBgRemoverJobSchema>;

export interface BgRemoverJobOutput {
  resultUrl: string;
  originalUrl: string;
  format: string;
  processingTimeMs: number;
}
```

### Step 3: Create API Procedures

```typescript
// packages/api/modules/bg-remover/procedures/create-job.ts
import { publicProcedure } from "../../../orpc/procedures";
import { createToolJob, type Prisma } from "@repo/database";
import { CreateBgRemoverJobSchema } from "../types";
import { ORPCError } from "@orpc/client";

export const createJob = publicProcedure
  .route({
    method: "POST",
    path: "/bg-remover/jobs",
    tags: ["BgRemover"],
    summary: "Create background removal job",
    description: "Submit an image for background removal",
  })
  .input(CreateBgRemoverJobSchema)
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

    // Require either userId or sessionId
    if (!userId && !input.sessionId) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Either authentication or sessionId is required",
      });
    }

    // Create job
    const job = await createToolJob({
      toolSlug: "bg-remover",
      input: input as Prisma.InputJsonValue,
      userId,
      sessionId: userId ? undefined : input.sessionId,
      priority: 0,
    });

    return { jobId: job.id, status: job.status };
  });
```

```typescript
// packages/api/modules/bg-remover/procedures/get-job.ts
import { publicProcedure } from "../../../orpc/procedures";
import { getToolJobById } from "@repo/database";
import { z } from "zod";

export const getJob = publicProcedure
  .route({
    method: "GET",
    path: "/bg-remover/jobs/:jobId",
    tags: ["BgRemover"],
    summary: "Get job status",
    description: "Check the status of a background removal job",
  })
  .input(z.object({ jobId: z.string() }))
  .handler(async ({ input }) => {
    const job = await getToolJobById(input.jobId);

    if (!job) {
      throw new ORPCError("NOT_FOUND", {
        message: "Job not found",
      });
    }

    return { job };
  });
```

```typescript
// packages/api/modules/bg-remover/router.ts
import { createJob } from "./procedures/create-job";
import { getJob } from "./procedures/get-job";

export const bgRemoverRouter = {
  jobs: {
    create: createJob,
    get: getJob,
  },
};
```

### Step 4: Implement Job Processor

```typescript
// packages/api/modules/bg-remover/lib/processor.ts
import {
  getToolJobById,
  markJobCompleted,
  markJobFailed,
} from "@repo/database";
import type { CreateBgRemoverJobInput, BgRemoverJobOutput } from "../types";
import { removeBackground } from "./remove-bg"; // Your AI logic

export async function processBgRemoverJob(jobId: string) {
  const startTime = Date.now();
  const job = await getToolJobById(jobId);

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  try {
    const input = job.input as CreateBgRemoverJobInput;

    // Call background removal AI
    const resultUrl = await removeBackground(input.imageUrl, input.format);

    const output: BgRemoverJobOutput = {
      resultUrl,
      originalUrl: input.imageUrl,
      format: input.format,
      processingTimeMs: Date.now() - startTime,
    };

    await markJobCompleted(jobId, output as any);
  } catch (error) {
    await markJobFailed(
      jobId,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
```

```typescript
// packages/api/modules/jobs/lib/processor-registry.ts
import { processBgRemoverJob } from "../../bg-remover/lib/processor";

export const processorRegistry = {
  "bg-remover": processBgRemoverJob,
  // ... other processors
};
```

### Step 5: Create Frontend with Polling

```tsx
// apps/web/modules/saas/tools/bg-remover/BgRemoverClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useApiMutation, useApiQuery } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BgRemoverClient() {
  const [imageUrl, setImageUrl] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID()); // For anonymous users

  // Create job mutation
  const createJob = useApiMutation(
    (client) => client.bgRemover.jobs.create,
    {
      onSuccess: (data) => {
        setJobId(data.jobId);
      },
    }
  );

  // Poll for job status
  const { data: jobData, refetch } = useApiQuery(
    (client) => client.bgRemover.jobs.get,
    { jobId: jobId! },
    {
      enabled: !!jobId,
      refetchInterval: (data) => {
        // Stop polling when job is complete or failed
        if (!data?.job) return false;
        return ["COMPLETED", "FAILED", "CANCELLED"].includes(data.job.status)
          ? false
          : 2000; // Poll every 2 seconds
      },
    }
  );

  const handleSubmit = () => {
    createJob.mutate({ imageUrl, sessionId });
  };

  const job = jobData?.job;
  const isProcessing = job?.status === "PROCESSING" || job?.status === "PENDING";

  return (
    <div className="container max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Background Remover</h1>
      <p className="text-muted-foreground mb-6">
        Remove backgrounds from images using AI
      </p>

      <div className="space-y-4">
        <Input
          type="url"
          placeholder="https://example.com/image.jpg"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          disabled={isProcessing}
        />

        <Button
          onClick={handleSubmit}
          disabled={createJob.isPending || isProcessing || !imageUrl}
          className="w-full"
        >
          {isProcessing ? "Processing..." : "Remove Background"}
        </Button>

        {isProcessing && (
          <div className="p-4 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-blue-600">
              Processing your image... This may take up to 30 seconds.
            </p>
          </div>
        )}

        {job?.status === "COMPLETED" && job.output && (
          <div className="p-4 bg-green-50 rounded border border-green-200">
            <p className="text-sm text-muted-foreground mb-2">
              Background removed successfully!
            </p>
            <img
              src={job.output.resultUrl}
              alt="Result"
              className="w-full rounded border"
            />
            <a
              href={job.output.resultUrl}
              download
              className="text-sm text-blue-600 hover:underline mt-2 inline-block"
            >
              Download Result
            </a>
          </div>
        )}

        {job?.status === "FAILED" && (
          <div className="p-4 bg-red-50 rounded border border-red-200">
            <p className="text-sm text-red-600">
              {job.error || "Failed to process image"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Key Points**:

- Job queue for async processing
- Polling pattern for status updates
- sessionId for anonymous users
- Clear progress indicators
- Error handling

---

## Example 3: Tool with Persistent User Data

**Use case**: A tool that saves user preferences and history.

### Step 1: Define Database Models

```prisma
// packages/database/prisma/schema.prisma

// Tool-specific user preferences
model MyTool_UserPreferences {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Tool-specific settings
  defaultFormat  String   @default("png")
  quality        Int      @default(80)
  autoSave       Boolean  @default(false)

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([userId])
  @@map("mytool_user_preferences")
}

// Tool-specific history/saved items
model MyTool_SavedItem {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  name       String
  data       Json     // Flexible data storage

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([userId, createdAt])
  @@map("mytool_saved_item")
}
```

### Step 2: Create Query Helpers

```typescript
// packages/database/prisma/queries/my-tool-preferences.ts
import { db } from "../client";

export async function getMyToolPreferences(userId: string) {
  return await db.myTool_UserPreferences.findUnique({
    where: { userId },
  });
}

export async function upsertMyToolPreferences(
  userId: string,
  data: {
    defaultFormat?: string;
    quality?: number;
    autoSave?: boolean;
  }
) {
  return await db.myTool_UserPreferences.upsert({
    where: { userId },
    create: {
      userId,
      ...data,
    },
    update: data,
  });
}

export async function getMyToolSavedItems(userId: string, limit = 20) {
  return await db.myTool_SavedItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function createMyToolSavedItem(
  userId: string,
  data: { name: string; data: any }
) {
  return await db.myTool_SavedItem.create({
    data: {
      userId,
      ...data,
    },
  });
}
```

### Step 3: Create Protected Procedures

```typescript
// packages/api/modules/my-tool/procedures/get-preferences.ts
import { protectedProcedure } from "../../../orpc/procedures";
import { getMyToolPreferences } from "@repo/database";

export const getPreferences = protectedProcedure
  .route({
    method: "GET",
    path: "/my-tool/preferences",
    tags: ["MyTool"],
    summary: "Get user preferences",
  })
  .handler(async ({ context }) => {
    const prefs = await getMyToolPreferences(context.user.id);
    return { preferences: prefs };
  });
```

```typescript
// packages/api/modules/my-tool/procedures/update-preferences.ts
import { protectedProcedure } from "../../../orpc/procedures";
import { upsertMyToolPreferences } from "@repo/database";
import { z } from "zod";

const UpdatePreferencesSchema = z.object({
  defaultFormat: z.string().optional(),
  quality: z.number().min(1).max(100).optional(),
  autoSave: z.boolean().optional(),
});

export const updatePreferences = protectedProcedure
  .route({
    method: "PUT",
    path: "/my-tool/preferences",
    tags: ["MyTool"],
    summary: "Update user preferences",
  })
  .input(UpdatePreferencesSchema)
  .handler(async ({ input, context }) => {
    const prefs = await upsertMyToolPreferences(context.user.id, input);
    return { preferences: prefs };
  });
```

### Step 4: Frontend with User Context

```tsx
// apps/web/modules/saas/tools/my-tool/MyToolClient.tsx
"use client";

import { useApiQuery, useApiMutation } from "@/lib/api-client";
import { useSession } from "@saas/auth/hooks/use-session";

export function MyToolClient() {
  const { user } = useSession();

  // Load user preferences (only when authenticated)
  const { data: prefsData } = useApiQuery(
    (client) => client.myTool.preferences.get,
    undefined,
    {
      enabled: !!user, // Only fetch if user is authenticated
    }
  );

  // Update preferences
  const updatePrefs = useApiMutation(
    (client) => client.myTool.preferences.update
  );

  const handleToggleAutoSave = () => {
    if (!user) return;

    updatePrefs.mutate({
      autoSave: !prefsData?.preferences?.autoSave,
    });
  };

  return (
    <div className="container max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Tool</h1>

      {user ? (
        <>
          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={prefsData?.preferences?.autoSave ?? false}
                onChange={handleToggleAutoSave}
              />
              <span>Auto-save results</span>
            </label>
          </div>

          {/* Tool functionality */}
        </>
      ) : (
        <div className="p-4 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-sm text-yellow-800">
            Sign in to save your preferences and history
          </p>
        </div>
      )}
    </div>
  );
}
```

**Key Points**:

- Separate models for tool-specific data
- Protected procedures for authenticated-only features
- Graceful degradation for anonymous users
- User context in frontend

---

## Common Patterns Summary

| Pattern             | When to Use                     | Key Features                                 |
| ------------------- | ------------------------------- | -------------------------------------------- |
| **Synchronous**     | Fast operations (< 500ms)       | Immediate response, no job queue             |
| **Async with Jobs** | Long operations (> 500ms)       | Job queue, polling, progress tracking        |
| **With User Data**  | Personalization, history        | Protected procedures, user models            |

## Testing Tips

1. **Unit test procedures**: Mock database calls, test business logic
2. **Integration test processors**: Use Testcontainers for real database
3. **E2E test UI**: Use Playwright for full user flows
4. **Load test rate limits**: Verify limits work as expected

## Next Steps

After implementing your tool:

1. ✅ Write comprehensive tests
2. ✅ Update CLAUDE.md with tool-specific commands
3. ✅ Add monitoring/analytics events
4. ✅ Document any new patterns discovered
5. ✅ Create PR and request review
