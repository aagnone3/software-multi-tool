# API Server

Standalone Node.js backend service built with Fastify for long-running jobs and real-time communication.

## Features

- **Fastify Framework**: High-performance HTTP server (2-3x faster than Express)
- **oRPC Integration**: Fully compatible with existing `@repo/api` router
- **WebSocket Support**: Real-time bidirectional communication for Slack/Discord bots
- **Long-Running Jobs**: No 60-second timeout limits (unlike Vercel serverless)
- **PostgreSQL**: Direct database access via Prisma
- **Better Auth**: Session validation for protected endpoints

## Architecture

```text
┌─────────────────────┐         ┌──────────────────────┐
│   Next.js (Vercel)  │         │  Fastify Backend     │
│   - Web UI          │────────▶│  (Render)            │
│   - Light API routes│  HTTP   │  - oRPC handlers     │
│   - SSR/SSG         │         │  - WebSocket server  │
└─────────────────────┘         │  - Job processing    │
                                │  - Slack/Discord API │
                                └──────────────────────┘
                                         │
                                         ▼
                                  PostgreSQL
```

## Development

### Setup

1. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your configuration

3. Install dependencies (from monorepo root):

   ```bash
   pnpm install
   ```

### Running Locally

Start the development server with hot reload:

```bash
pnpm --filter @repo/api-server dev
```

The server will start on `http://localhost:4000` (or the PORT specified in `.env.local`).

### Building

Compile TypeScript to JavaScript:

```bash
pnpm --filter @repo/api-server build
```

### Production

Run the compiled server:

```bash
pnpm --filter @repo/api-server start
```

## API Endpoints

### Health Check

```text
GET /health
```

Returns `OK` if the server is running.

### oRPC Endpoints

All existing oRPC procedures from `@repo/api` are available:

- **RPC**: `/api/rpc/*` (binary RPC format)
- **OpenAPI**: `/api/*` (REST-style endpoints)

### WebSocket

```text
WS /ws
```

Establish a WebSocket connection for real-time events. Requires authentication via Bearer token or session cookie.

**Connection Example:**

```typescript
const ws = new WebSocket('ws://localhost:4000/ws', {
  headers: {
    'Authorization': 'Bearer <token>'
  }
});

ws.on('open', () => {
  console.log('Connected');
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Received:', message);
});
```

## Testing

### Run Tests

```bash
pnpm --filter @repo/api-server test
```

### Run Tests with Coverage

```bash
pnpm --filter @repo/api-server test:ci
```

### Type Checking

```bash
pnpm --filter @repo/api-server type-check
```

## Deployment

### Render (PaaS)

This service is designed to deploy on Render with Docker support.

**Configuration:**

- Build Command: `pnpm --filter @repo/api-server build`
- Start Command: `pnpm --filter @repo/api-server start`
- Runtime: Docker (see `Dockerfile`)
- Deploy: Auto-deploy on push to main

See `render.yaml` in the repository root for infrastructure-as-code configuration.

### Environment Variables (Production)

Set these in the Render dashboard:

- `PORT`: Auto-provided by Render
- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Secret key for session validation
- `BETTER_AUTH_URL`: Public URL of the API server
- `CORS_ORIGIN`: Next.js frontend URL (e.g., `https://yourdomain.com`)
- `NODE_ENV`: `production`

## Monitoring

### Logs

Structured logging via `@repo/logs` (pino):

```typescript
import { logger } from '@repo/logs';

logger.info('Server started', { port: 4000 });
logger.error('Database connection failed', { error });
```

### Health Checks

Render automatically pings `/health` to verify server uptime.

## Known Limitations

- **Cold Starts**: None! Long-lived process stays warm
- **Timeout**: No timeout limits (unlike Vercel's 60s/13min limits)
- **Scaling**: Horizontal scaling via Render (add more instances)
- **Stateful Connections**: WebSocket connections are instance-specific (use Redis for cross-instance pub/sub in the future)

## Future Enhancements

- [ ] Job queue integration (BullMQ, pg-boss)
- [ ] Redis caching layer
- [ ] Advanced WebSocket routing/broadcasting
- [ ] Metrics endpoint (Prometheus)
- [ ] Distributed tracing (OpenTelemetry)
- [ ] Rate limiting (Redis-backed)

## License

Private - Part of Software Multi-Tool monorepo
