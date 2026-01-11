---
name: render
description: Use this skill when the user needs to interact with Render for managing services, triggering deploys, or managing environment variables. This skill wraps the Render API client and CLI helpers.
allowed-tools:
  - Bash
---

# Render Deployment Skill

This skill provides comprehensive Render integration for managing services, deploys, and environment variables using the Render API client and CLI helpers in this repository.

## Prerequisites

- `RENDER_API_KEY` must be set in `apps/web/.env.local`
- Get your API key from the Render Dashboard > Account Settings > API Keys
- The Render CLI helpers are located at `tooling/scripts/src/render/index.mjs`
- The typed API client is available at `packages/render`

## Core Command Pattern

All Render CLI operations use this base command:

```bash
pnpm --filter @repo/scripts render <resource> <action> [options]
```

## Available Operations

### Services

#### List Services

```bash
pnpm --filter @repo/scripts render services list [--name <text>] [--type <type>]
```

- Lists all services you have access to
- Optional filters:
  - `--name <text>` - Filter by service name
  - `--type <type>` - Filter by service type
- Output: ID, TYPE, NAME columns

**Service types:** `web_service`, `private_service`, `background_worker`, `static_site`, `cron_job`

#### Get Service Details

```bash
pnpm --filter @repo/scripts render services get --service <id>
```

- Shows detailed information about a specific service
- Output includes: name, ID, type, environment, branch, URL, region, plan

### Deploys

#### List Deploys

```bash
pnpm --filter @repo/scripts render deploys list --service <id>
```

- Lists all deploys for a service
- Output: ID, STATUS, TRIGGER, CREATED columns

#### Get Deploy Details

```bash
pnpm --filter @repo/scripts render deploys get --service <id> --deploy <id>
```

- Shows detailed information about a specific deploy
- Output includes: status, trigger, timestamps, commit info

#### Trigger Deploy

```bash
pnpm --filter @repo/scripts render deploys trigger --service <id> [--clear-cache]
```

- Triggers a new deploy for the service
- Optional `--clear-cache` flag clears the build cache before building
- Returns: deploy ID and status

#### Cancel Deploy

```bash
pnpm --filter @repo/scripts render deploys cancel --service <id> --deploy <id>
```

- Cancels a running deploy
- Only works on deploys that are currently in progress

### Environment Variables

#### List Environment Variables

```bash
pnpm --filter @repo/scripts render env list --service <id>
```

- Lists all environment variables for a service
- Output: KEY, VALUE columns
- Note: Secret values may be hidden

#### Get Environment Variable

```bash
pnpm --filter @repo/scripts render env get --service <id> --key <name>
```

- Gets a specific environment variable by key
- Shows the key and value

#### Set Environment Variable

```bash
pnpm --filter @repo/scripts render env set --service <id> --key <name> --value <value>
```

- Creates or updates an environment variable
- The change will trigger a redeploy if auto-deploy is enabled

#### Delete Environment Variable

```bash
pnpm --filter @repo/scripts render env delete --service <id> --key <name>
```

- Deletes an environment variable
- The change will trigger a redeploy if auto-deploy is enabled

## Using the TypeScript API Client

For programmatic access, use the `@repo/render` package:

```typescript
import { createRenderClient, createRenderClientFromEnv } from "@repo/render";

// Create client from environment variable
const client = createRenderClientFromEnv();

// Or with explicit configuration
const client = createRenderClient({
  apiKey: process.env.RENDER_API_KEY!,
});

// List services
const { items: services } = await client.listServices({
  type: "web_service",
});

// Get service details
const service = await client.getService("srv-xxx");

// Trigger a deploy
const deploy = await client.triggerDeploy("srv-xxx", {
  clearCache: true,
});

// Manage environment variables
await client.setEnvVar("srv-xxx", {
  key: "API_URL",
  value: "https://api.example.com",
});

const envVars = await client.listEnvVars("srv-xxx");
await client.deleteEnvVar("srv-xxx", "OLD_VAR");
```

## Common Workflows

### Deploy a Service

```bash
# Trigger a fresh deploy with cache clear
pnpm --filter @repo/scripts render deploys trigger --service srv-xxx --clear-cache

# Monitor the deploy status
pnpm --filter @repo/scripts render deploys list --service srv-xxx
```

### Update Environment Variables

```bash
# Set a new variable
pnpm --filter @repo/scripts render env set --service srv-xxx --key DATABASE_URL --value "postgresql://..."

# Verify the change
pnpm --filter @repo/scripts render env get --service srv-xxx --key DATABASE_URL

# Trigger a deploy to apply changes
pnpm --filter @repo/scripts render deploys trigger --service srv-xxx
```

### Debug a Service

```bash
# Get service info
pnpm --filter @repo/scripts render services get --service srv-xxx

# Check recent deploys
pnpm --filter @repo/scripts render deploys list --service srv-xxx

# Get details of a specific deploy
pnpm --filter @repo/scripts render deploys get --service srv-xxx --deploy dep-xxx
```

## Error Handling

The CLI will display error messages in red with the `[render]` prefix:

```
[render] Missing required flag "--service".
[render] HTTP 401: Invalid API key
[render] HTTP 404: Resource not found
```

Common errors:
- `Missing RENDER_API_KEY` - Set the API key in `.env.local`
- `HTTP 401` - Invalid or expired API key
- `HTTP 404` - Service or deploy not found
- `HTTP 429` - Rate limit exceeded

## When to Use This Skill

Invoke this skill when:

- Listing or getting details about Render services
- Triggering deploys or checking deploy status
- Managing environment variables on services
- Debugging deployment issues
- Automating Render operations in scripts

## Scope Limitations

This skill supports:
- Service listing and details (read-only)
- Deploy triggering, listing, and cancellation
- Environment variable CRUD

This skill does NOT support:
- Creating or deleting services
- Suspending or resuming services
- Scaling operations
- Render Postgres (database operations)

For these operations, use the Render Dashboard directly.
