# @repo/render

Typed API client for interacting with the [Render API](https://api-docs.render.com/).

## Installation

This package is part of the monorepo and available via workspace reference:

```json
{
  "dependencies": {
    "@repo/render": "workspace:*"
  }
}
```

## Configuration

Set your Render API key in your environment:

```bash
# In apps/web/.env.local
RENDER_API_KEY=rnd_xxxxx
```

Get your API key from the Render Dashboard > Account Settings > API Keys.

## Usage

### Creating a Client

```typescript
import { createRenderClient, createRenderClientFromEnv } from "@repo/render";

// Create client from environment variable (recommended)
const client = createRenderClientFromEnv();

// Or with explicit configuration
const client = createRenderClient({
  apiKey: process.env.RENDER_API_KEY!,
  timeout: 30000, // optional, defaults to 30s
});
```

### Service Operations

```typescript
// List all services
const { items: services } = await client.listServices();

// List with filters
const { items: webServices } = await client.listServices({
  type: "web_service",
  suspended: "not_suspended",
});

// Get a specific service
const service = await client.getService("srv-cxxxxxxxxx");
console.log(service.name, service.type, service.serviceDetails?.url);
```

### Deploy Operations

```typescript
// List deploys for a service
const { items: deploys } = await client.listDeploys("srv-cxxxxxxxxx");

// Get deploy details
const deploy = await client.getDeploy("srv-cxxxxxxxxx", "dep-cxxxxxxxxx");
console.log(deploy.status, deploy.trigger);

// Trigger a new deploy
const newDeploy = await client.triggerDeploy("srv-cxxxxxxxxx");
console.log("Deploy triggered:", newDeploy.id);

// Trigger deploy with cache clear
const freshDeploy = await client.triggerDeploy("srv-cxxxxxxxxx", {
  clearCache: true,
});

// Cancel a running deploy
const cancelled = await client.cancelDeploy("srv-cxxxxxxxxx", "dep-cxxxxxxxxx");
```

### Environment Variable Operations

```typescript
// List all env vars for a service
const envVars = await client.listEnvVars("srv-cxxxxxxxxx");

// Get a specific env var
const apiUrl = await client.getEnvVar("srv-cxxxxxxxxx", "API_URL");

// Set (create or update) an env var
await client.setEnvVar("srv-cxxxxxxxxx", {
  key: "DATABASE_URL",
  value: "postgresql://...",
});

// Delete an env var
await client.deleteEnvVar("srv-cxxxxxxxxx", "OLD_VAR");

// Replace all env vars at once
await client.setEnvVars("srv-cxxxxxxxxx", [
  { key: "NODE_ENV", value: "production" },
  { key: "API_URL", value: "https://api.example.com" },
]);
```

### Error Handling

```typescript
import { RenderApiError } from "@repo/render";

try {
  await client.getService("srv-invalid");
} catch (error) {
  if (error instanceof RenderApiError) {
    switch (error.code) {
      case "unauthorized":
        console.error("Invalid API key");
        break;
      case "not_found":
        console.error("Service not found");
        break;
      case "rate_limited":
        console.error("Rate limit exceeded, retry later");
        break;
      default:
        console.error(`API error: ${error.message}`);
    }
  }
}
```

## CLI Usage

The package includes CLI helpers via `@repo/scripts`:

```bash
# List services
pnpm --filter @repo/scripts render services list

# Get service details
pnpm --filter @repo/scripts render services get --service srv-xxx

# Trigger a deploy
pnpm --filter @repo/scripts render deploys trigger --service srv-xxx

# Manage env vars
pnpm --filter @repo/scripts render env list --service srv-xxx
pnpm --filter @repo/scripts render env set --service srv-xxx --key API_URL --value https://api.example.com
```

Run `pnpm --filter @repo/scripts render help` for full CLI documentation.

## API Reference

### Types

#### Service Types

- `web_service` - Web services with public URLs
- `private_service` - Internal services with private networking
- `background_worker` - Background workers without HTTP endpoints
- `static_site` - Static site hosting
- `cron_job` - Scheduled tasks

#### Deploy Statuses

- `created` - Deploy created but not started
- `build_in_progress` - Building
- `update_in_progress` - Deploying
- `live` - Successfully deployed
- `build_failed` - Build failed
- `update_failed` - Deploy failed
- `canceled` - Deploy was cancelled

#### Error Codes

- `unauthorized` - Invalid API key (401)
- `forbidden` - Access denied (403)
- `not_found` - Resource not found (404)
- `rate_limited` - Too many requests (429)
- `validation_error` - Invalid request (400/422)
- `server_error` - Render server error (5xx)
- `network_error` - Network/timeout issues

## Scope

### Supported Operations

- List and get services (read-only)
- Trigger, list, get, and cancel deploys
- Full CRUD for environment variables

### Not Supported

- Creating or deleting services
- Suspending or resuming services
- Scaling operations
- Render Postgres database operations

For unsupported operations, use the [Render Dashboard](https://dashboard.render.com/) or the full Render API directly.

## Related

- [Render API Documentation](https://api-docs.render.com/)
- [Render Dashboard](https://dashboard.render.com/)
- Claude skill: `.claude/skills/render/SKILL.md`
