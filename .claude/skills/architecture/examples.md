# Architecture Examples

This document provides practical examples for navigating and extending the codebase.

## Table of Contents

1. [Navigating the API Layer](#1-navigating-the-api-layer)
2. [Adding a New API Module](#2-adding-a-new-api-module)
3. [Creating a New Package](#3-creating-a-new-package)
4. [Adding a New Integration](#4-adding-a-new-integration)
5. [Understanding Frontend Data Fetching](#5-understanding-frontend-data-fetching)
6. [Extending Existing Modules](#6-extending-existing-modules)
7. [Working with Deployment](#7-working-with-deployment)
8. [Adding Background Jobs (Inngest)](#8-adding-background-jobs-inngest)
9. [Adding Real-time Features (Supabase)](#9-adding-real-time-features-supabase)
10. [Tips and Common Questions](#10-tips-and-common-questions)

---

## 1. Navigating the API Layer

### Finding an API endpoint

To find where a specific API endpoint is implemented:

```bash
# Search for router definitions
grep -r "createRouter" packages/api/modules/

# Search for a specific procedure name
grep -r "procedureName" packages/api/modules/

# Find all procedures in a module
grep -r "\.handler" packages/api/modules/users/
```

### Tracing a request

1. **Entry point**: `apps/web/app/api/[[...rest]]/route.ts`
2. **Hono app**: `packages/api/index.ts`
3. **oRPC router**: `packages/api/orpc/router.ts`
4. **Module router**: `packages/api/modules/<domain>/router.ts`
5. **Procedure handler**: `packages/api/modules/<domain>/procedures/<name>.ts`

### Finding middleware

```bash
# Auth middleware (protectedProcedure, adminProcedure)
cat packages/api/orpc/procedures.ts

# Hono middleware
grep -r "app.use" packages/api/index.ts
```

---

## 2. Adding a New API Module

### Step-by-step guide

**Example**: Adding a `notifications` module

#### Step 1: Create module directory

```bash
mkdir -p packages/api/modules/notifications/procedures
```

#### Step 2: Create the router

Create `packages/api/modules/notifications/router.ts`:

```typescript
import { publicProcedure, protectedProcedure } from "../../orpc/procedures";
import { z } from "zod";

// Define input/output schemas
const NotificationSchema = z.object({
  id: z.string(),
  message: z.string(),
  read: z.boolean(),
  createdAt: z.date(),
});

// Create router with procedures
export const notificationsRouter = {
  // List notifications (protected)
  list: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .output(z.array(NotificationSchema))
    .handler(async ({ input, context }) => {
      // Implementation
      return [];
    }),

  // Mark as read (protected)
  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ input, context }) => {
      // Implementation
      return { success: true };
    }),
};
```

#### Step 3: Add to main router

Edit `packages/api/orpc/router.ts`:

```typescript
import { notificationsRouter } from "../modules/notifications/router";

export const apiRouter = router({
  // ... existing routers
  notifications: notificationsRouter,
});
```

#### Step 4: Create index export

Create `packages/api/modules/notifications/index.ts`:

```typescript
export { notificationsRouter } from "./router";
```

### Checklist for new modules

- [ ] Create module directory in `packages/api/modules/`
- [ ] Define Zod schemas for input/output
- [ ] Create router with procedures
- [ ] Use appropriate procedure type (public/protected/admin)
- [ ] Add router to main router in `orpc/router.ts`
- [ ] Add tests in `packages/api/modules/<module>/__tests__/`

---

## 3. Creating a New Package

### Package creation guide

**Example**: Adding a `@repo/analytics` package

#### Step 1: Create package directory

```bash
mkdir -p packages/analytics/src
```

#### Step 2: Create package.json

Create `packages/analytics/package.json`:

```json
{
  "name": "@repo/analytics",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --dts --watch",
    "test": "vitest run"
  },
  "dependencies": {},
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0",
    "vitest": "^2.0.0"
  }
}
```

#### Step 3: Create tsconfig.json

Create `packages/analytics/tsconfig.json`:

```json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### Step 4: Create main entry point

Create `packages/analytics/src/index.ts`:

```typescript
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
}

export function trackEvent(event: AnalyticsEvent): void {
  // Implementation
  console.log("Track:", event);
}

export function identify(userId: string, traits?: Record<string, unknown>): void {
  // Implementation
  console.log("Identify:", userId, traits);
}
```

#### Step 5: Install dependencies

```bash
pnpm install
```

#### Step 6: Add to consuming packages

In `apps/web/package.json` or other consumers:

```json
{
  "dependencies": {
    "@repo/analytics": "workspace:*"
  }
}
```

### Checklist for new packages

- [ ] Create directory in `packages/`
- [ ] Add `package.json` with correct name (`@repo/<name>`)
- [ ] Add `tsconfig.json` extending base config
- [ ] Create `src/index.ts` entry point
- [ ] Run `pnpm install` to link workspace
- [ ] Add to Turbo pipeline if needed (`turbo.json`)
- [ ] Add to consumers' dependencies

---

## 4. Adding a New Integration

### Pattern: External service integration

**Example**: Adding a new payment provider

#### Step 1: Add provider to packages/payments

Create `packages/payments/providers/new-provider.ts`:

```typescript
import type { PaymentProvider, PaymentConfig } from "../types";

export class NewProvider implements PaymentProvider {
  private apiKey: string;

  constructor(config: PaymentConfig) {
    this.apiKey = config.apiKey;
  }

  async createCheckout(params: CheckoutParams): Promise<CheckoutSession> {
    // Implementation
  }

  async handleWebhook(payload: unknown, signature: string): Promise<void> {
    // Implementation
  }
}
```

#### Step 2: Register in provider factory

Edit `packages/payments/index.ts`:

```typescript
import { NewProvider } from "./providers/new-provider";

export function createPaymentProvider(type: string): PaymentProvider {
  switch (type) {
    case "stripe":
      return new StripeProvider(config);
    case "new-provider":
      return new NewProvider(config);
    default:
      throw new Error(`Unknown provider: ${type}`);
  }
}
```

#### Step 3: Add environment variables

Update `apps/web/.env.local.example`:

```bash
NEW_PROVIDER_API_KEY=
NEW_PROVIDER_WEBHOOK_SECRET=
```

#### Step 4: Add config option

Edit `config/index.ts`:

```typescript
export const config = {
  payments: {
    provider: process.env.PAYMENT_PROVIDER || "stripe",
    newProvider: {
      apiKey: process.env.NEW_PROVIDER_API_KEY,
      webhookSecret: process.env.NEW_PROVIDER_WEBHOOK_SECRET,
    },
  },
};
```

### Pattern: Following existing integrations

When adding a new integration, examine existing ones for patterns:

```bash
# See how payments is structured
ls -la packages/payments/

# See how mail is structured
ls -la packages/mail/

# See how storage is structured
ls -la packages/storage/
```

---

## 5. Understanding Frontend Data Fetching

### Finding data fetching code

```bash
# Find TanStack Query usage
grep -r "useQuery\|useMutation" apps/web/

# Find oRPC client calls
grep -r "apiClient\." apps/web/

# Find server components fetching data
grep -r "await.*fetch\|await.*db\." apps/web/app/
```

### Client component data fetching

Located in `apps/web/` with `"use client"` directive:

```typescript
"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@repo/api/client";

export function UserList() {
  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiClient.users.list({}),
  });

  const mutation = useMutation({
    mutationFn: (data) => apiClient.users.create(data),
  });

  // ...
}
```

### Server component data fetching

Located in `apps/web/app/` without `"use client"`:

```typescript
import { db } from "@repo/database";

export default async function UsersPage() {
  const users = await db.user.findMany();

  return <UserList users={users} />;
}
```

---

## 6. Extending Existing Modules

### Adding a procedure to existing module

**Example**: Adding `deactivate` to users module

#### Step 1: Find the module

```bash
ls packages/api/modules/users/
```

#### Step 2: Add to router

Edit `packages/api/modules/users/router.ts`:

```typescript
export const usersRouter = {
  // ... existing procedures

  deactivate: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ input, context }) => {
      // Only allow self-deactivation or admin
      if (input.userId !== context.user.id && context.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      await db.user.update({
        where: { id: input.userId },
        data: { active: false },
      });

      return { success: true };
    }),
};
```

### Adding fields to database models

1. Edit `packages/database/prisma/schema.prisma`
2. Run `pnpm --filter @repo/database generate`
3. Create migration: `pnpm --filter @repo/database migrate`
4. Update API procedures to handle new fields

---

## 7. Working with Deployment

### Understanding the CI/CD pipeline

```bash
# Find workflow definitions
ls .github/workflows/

# See what runs on PRs
cat .github/workflows/validate-prs.yml

# See migration workflow
cat .github/workflows/db-migrate-deploy.yml
```

### Managing environment variables

```bash
# List all Vercel env vars
pnpm web:env:list

# Set a variable for production only
pnpm web:env:set MY_VAR "value" --target production

# Set for all environments
pnpm web:env:set MY_VAR "value"

# Remove a variable
pnpm web:env:unset MY_VAR --target production

# Pull latest from Vercel to local
pnpm web:env:pull
```

### Running migrations in production

Migrations run automatically on push to main via `db-migrate-deploy.yml`.

Manual migration (if needed):

```bash
pnpm db:migrate:deploy
```

### Checking deployment status

- **Vercel dashboard**: Shows deployment status, logs, and preview URLs
- **GitHub Actions tab**: Shows CI/CD workflow runs and test results
- **PR comments**: Include test results and coverage reports

### Debugging failed deployments

```bash
# Check workflow logs
gh run list --workflow=validate-prs.yml

# View specific run
gh run view <run-id> --log

# Check Vercel deployment logs
vercel logs <deployment-url>
```

### Adding new environment variables

1. Add to `apps/web/.env.local.example` (template)
2. Set in Vercel: `pnpm web:env:set VAR_NAME "value" --target production`
3. Pull to local: `pnpm web:env:pull`

---

## 8. Adding Background Jobs (Inngest)

### Creating a new job function

**Example**: Adding a `document-processor` job

#### Step 1: Add event type to client

Edit `apps/web/inngest/client.ts`:

```typescript
export const inngest = new Inngest({
  id: "software-multi-tool",
  schemas: new EventSchemas().fromRecord<{
    // ... existing events
    "jobs/document-processor.requested": {
      data: {
        toolJobId: string;
        input: {
          fileUrl: string;
          format: string;
        };
      };
    };
  }>(),
});
```

#### Step 2: Create the function

Create `apps/web/inngest/functions/document-processor.ts`:

```typescript
import { inngest } from "../client";
import { getToolJobById, markJobCompleted, markJobFailed } from "@repo/database";
import { logger } from "@repo/logs";

export const documentProcessor = inngest.createFunction(
  {
    id: "document-processor",
    name: "Document Processor",
    retries: 3,
  },
  { event: "jobs/document-processor.requested" },
  async ({ event, step }) => {
    const { toolJobId } = event.data;

    // Step 1: Validate job exists
    await step.run("validate-job", async () => {
      const job = await getToolJobById(toolJobId);
      if (!job) {
        throw new Error(`Tool job not found: ${toolJobId}`);
      }
      return { exists: true };
    });

    // Step 2: Process the document
    const result = await step.run("process-document", async () => {
      const job = await getToolJobById(toolJobId);
      if (!job) throw new Error(`Job not found: ${toolJobId}`);

      // Your processing logic here
      return { success: true, output: { /* result data */ } };
    });

    // Step 3: Update job status
    await step.run("update-job-status", async () => {
      if (result.success) {
        await markJobCompleted(toolJobId, result.output);
      } else {
        await markJobFailed(toolJobId, "Processing failed");
      }
    });

    return { success: result.success, toolJobId };
  }
);
```

#### Step 3: Register in serve endpoint

Edit `apps/web/app/api/inngest/route.ts`:

```typescript
import { documentProcessor } from "../../../inngest/functions/document-processor";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // ... existing functions
    documentProcessor,
  ],
});
```

#### Step 4: Trigger the job

From your API procedure or action:

```typescript
import { inngest } from "../../../inngest/client";

await inngest.send({
  name: "jobs/document-processor.requested",
  data: {
    toolJobId: "job-123",
    input: { fileUrl: "https://...", format: "pdf" },
  },
});
```

### Checklist for new jobs

- [ ] Add event type to `apps/web/inngest/client.ts`
- [ ] Create function in `apps/web/inngest/functions/`
- [ ] Use 3-step pattern: validate → process → update-status
- [ ] Configure retries (default: 3)
- [ ] Register in `apps/web/app/api/inngest/route.ts`
- [ ] For long-running jobs, break into multiple steps

---

## 9. Adding Real-time Features (Supabase)

### Adding broadcast messaging

**Example**: Adding real-time notifications

#### Step 1: Create notification subscription hook

Create `apps/web/modules/notifications/hooks.ts`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { subscribeToBroadcast } from "@realtime";

interface Notification {
  id: string;
  message: string;
  type: "info" | "success" | "error";
}

export function useNotifications(channelName: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const { unsubscribe } = subscribeToBroadcast<Notification>({
      channelName,
      event: "notification",
      onMessage: (notification) => {
        setNotifications((prev) => [...prev, notification]);
      },
    });

    return () => unsubscribe();
  }, [channelName]);

  return notifications;
}
```

#### Step 2: Send notifications from server

```typescript
import { broadcastMessage } from "@realtime";

await broadcastMessage({
  channelName: `user-${userId}`,
  event: "notification",
  payload: {
    id: crypto.randomUUID(),
    message: "Your job completed!",
    type: "success",
  },
});
```

### Adding presence tracking

**Example**: Who's viewing a document

```typescript
"use client";

import { useEffect, useState } from "react";
import { subscribeToPresence } from "@realtime";

interface ViewerState {
  name: string;
  cursor?: { x: number; y: number };
}

export function useDocumentViewers(documentId: string, currentUser: string) {
  const [viewers, setViewers] = useState<Record<string, ViewerState[]>>({});

  useEffect(() => {
    const { track, untrack, unsubscribe } = subscribeToPresence<ViewerState>({
      channelName: `doc-${documentId}`,
      presenceKey: currentUser,
      onSync: (state) => setViewers(state),
      onJoin: (key, current, newPresences) => {
        console.log(`${key} started viewing`);
      },
      onLeave: (key, current, leftPresences) => {
        console.log(`${key} stopped viewing`);
      },
    });

    // Track this user
    track({ name: currentUser });

    return () => {
      untrack();
      unsubscribe();
    };
  }, [documentId, currentUser]);

  return viewers;
}
```

### Checklist for realtime features

- [ ] Import from `@realtime` alias
- [ ] Use `subscribeToBroadcast` for pub/sub messaging
- [ ] Use `subscribeToPresence` for who's online
- [ ] Clean up subscriptions in useEffect return
- [ ] Mark components as `"use client"` (realtime is client-only)

---

## 10. Tips and Common Questions

### Where do I put...?

| What                | Where                                    |
| ------------------- | ---------------------------------------- |
| New API endpoint    | `packages/api/modules/<domain>/`         |
| New React component | `apps/web/components/`                   |
| New page            | `apps/web/app/`                          |
| Shared utility      | `packages/utils/`                        |
| Database change     | `packages/database/prisma/schema.prisma` |
| Email template      | `packages/mail/templates/`               |
| Config option       | `config/index.ts`                        |

### How do I find...?

```bash
# All usages of a function
grep -r "functionName" packages/ apps/

# All files importing a package
grep -r "from \"@repo/package\"" .

# All procedures in API
grep -r "\.handler" packages/api/modules/

# All client components
grep -r "\"use client\"" apps/web/
```

### Common mistakes

1. **Forgetting to add router to main router** - New modules won't be accessible
2. **Missing Zod schema** - oRPC requires input/output schemas
3. **Using wrong procedure type** - protectedProcedure requires auth
4. **Not running generate after schema changes** - Types won't update
5. **Circular imports** - Keep package dependencies one-way

### Build order

Turbo handles this automatically, but the dependency order is:

1. `@repo/utils` (no deps)
2. `@repo/database` (generates types)
3. `@repo/auth`, `@repo/mail`, etc. (depend on database)
4. `@repo/api` (depends on most packages)
5. `apps/web` (depends on all packages)
