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

## Error Handling

The CLI will display error messages in red with the `[render]` prefix:

```text
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

## API Server Deployment (apps/api-server)

The repository includes a standalone Fastify backend service (`apps/api-server`) designed for deployment on Render. This service provides:

- **WebSocket support** for real-time communication
- **Long-running jobs** without serverless timeout limits
- **Full oRPC compatibility** with the Next.js frontend
- **Shared database and auth** with the main application

### Deployment Configuration

The api-server uses **Render native Node.js** (not Docker). Configure via the Render dashboard:

| Setting           | Value                                                                            |
| ----------------- | -------------------------------------------------------------------------------- |
| **Runtime**       | Node                                                                             |
| **Build Command** | `pnpm install --frozen-lockfile; pnpm turbo run build --filter=@repo/api-server` |
| **Start Command** | `cd apps/api-server; pnpm run start`                                             |
| **Health Check**  | `/health`                                                                        |
| **Auto-Deploy**   | Yes (on push to main or PR branch)                                               |

### Build System

The api-server uses **esbuild** to create a bundled production build:

```bash
# Build command (in package.json)
pnpm exec esbuild src/index.ts --bundle --platform=node --format=cjs --outfile=dist/index.cjs
```

**Key design decisions:**

- **CJS format**: Prisma's generated client uses dynamic `require()` calls that are incompatible with ESM bundles. Using `--format=cjs` ensures compatibility.
- **Turbo orchestration**: The turbo build respects `dependsOn: ["^generate"]`, ensuring Prisma client is generated before bundling.
- **Bundled output**: Workspace packages (`@repo/*`) are bundled into the output, eliminating runtime resolution issues.

### Required Environment Variables

Set these in the Render dashboard for the api-server service:

| Variable             | Description                            | Example                           |
| -------------------- | -------------------------------------- | --------------------------------- |
| `PORT`               | Server port (auto-provided by Render)  | (leave unset - Render provides)   |
| `HOST`               | Bind address                           | `0.0.0.0`                         |
| `NODE_ENV`           | Environment                            | `production`                      |
| `DATABASE_URL`       | PostgreSQL connection string           | `postgresql://user:pass@...`      |
| `BETTER_AUTH_SECRET` | Session secret (shared with Next.js)   | (from Vercel env)                 |
| `BETTER_AUTH_URL`    | API server public URL                  | `https://api-server.onrender.com` |
| `CORS_ORIGIN`        | Frontend origin (Next.js URL)          | `https://your-domain.com`         |
| `LOG_LEVEL`          | Logging level                          | `info`                            |

### Deployment Workflow

1. **Initial Setup**:
   - Create a new Web Service in Render dashboard
   - Connect to your GitHub repository
   - Set runtime to **Node**
   - Configure build and start commands (see table above)

2. **Set Environment Variables**:

   ```bash
   # List current env vars
   pnpm --filter @repo/scripts render env list --service <service-id>

   # Set required variables
   pnpm --filter @repo/scripts render env set --service <service-id> \
     --key BETTER_AUTH_SECRET \
     --value "your-secret-from-vercel"

   pnpm --filter @repo/scripts render env set --service <service-id> \
     --key CORS_ORIGIN \
     --value "https://your-domain.vercel.app"
   ```

3. **Trigger Deploy**:

   ```bash
   pnpm --filter @repo/scripts render deploys trigger --service <service-id>
   ```

4. **Monitor Deploy**:

   ```bash
   # Get deploy status
   pnpm --filter @repo/scripts render deploys list --service <service-id>

   # Check service health
   curl https://your-api-server.onrender.com/health
   # Should return: OK
   ```

### Health Monitoring

The api-server exposes a health check endpoint:

```bash
# Health check
GET /health
# Response: OK (200)

# WebSocket endpoint
WS /ws
# Requires Bearer token authentication
```

### Local Development

Run the api-server locally:

```bash
# From repository root
pnpm --filter @repo/api-server dev

# Server starts on http://localhost:4000
# Health check: http://localhost:4000/health
# WebSocket: ws://localhost:4000/ws
```

### Troubleshooting

**Build fails with "Cannot find module '@repo/...'**:

- Ensure you're using `pnpm turbo run build --filter=@repo/api-server` (not direct `pnpm build`)
- Turbo ensures workspace dependencies are built first

**Build fails with Prisma errors**:

- Turbo should handle this via `dependsOn: ["^generate"]`
- If issues persist, run `pnpm --filter @repo/database generate` before build

**Runtime error "Dynamic require of X is not supported"**:

- Ensure build uses `--format=cjs` (not esm)
- Prisma requires CommonJS format for dynamic imports

**Service won't start:**

- Check environment variables are set correctly
- Verify `DATABASE_URL` is accessible from Render
- Check build logs: `pnpm --filter @repo/scripts render deploys get --service <id> --deploy <id>`

**Health check failing:**

- Verify `HOST=0.0.0.0` (not `127.0.0.1`)
- Ensure `PORT` is not hardcoded (use Render's auto-provided value)
- Check Render dashboard for errors

**CORS errors:**

- Verify `CORS_ORIGIN` matches your frontend URL exactly
- Include protocol (https://) and no trailing slash
- For multiple origins, update `apps/api-server/src/lib/server.ts`

**WebSocket connection fails:**

- Check `BETTER_AUTH_SECRET` matches between Vercel and Render
- Verify authentication token is being sent
- Check Render logs for connection attempts

### Integration with Next.js Frontend

The Next.js frontend can connect to the api-server for:

1. **WebSocket connections**:

   ```typescript
   const ws = new WebSocket('wss://your-api-server.onrender.com/ws', {
     headers: {
       Authorization: `Bearer ${session.token}`
     }
   });
   ```

2. **Long-running API calls** (fallback to api-server for timeout-prone operations):

   ```typescript
   // In frontend, detect timeout and retry via api-server
   const API_SERVER_URL = process.env.NEXT_PUBLIC_API_SERVER_URL;
   ```

### Auto-Deploy

Configure auto-deploy in the Render dashboard to deploy on push to `main` branch. To manually trigger:

```bash
pnpm --filter @repo/scripts render deploys trigger --service <service-id> --clear-cache
```
