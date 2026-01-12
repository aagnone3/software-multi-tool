# Render Deployment Guide

This guide walks you through deploying the `api-server` (Fastify backend) to Render using the Blueprint feature.

## Overview

The api-server is a standalone Fastify backend service that provides:

- **WebSocket support** for real-time communication
- **Long-running jobs** without serverless timeout limits
- **Full oRPC compatibility** with the Next.js frontend
- **Shared database and auth** with the main application

The deployment is configured via `render.yaml` at the repository root, which defines both the API service and PostgreSQL database.

## Prerequisites

- Render account with access to the target organization
- GitHub repository connected to Render
- Access to Vercel dashboard (to retrieve `BETTER_AUTH_SECRET`)
- PR #52 merged to main branch

## Step 1: Create Render Blueprint

1. **Navigate to Render Dashboard**: Go to [https://dashboard.render.com](https://dashboard.render.com)

2. **Create New Blueprint**:
   - Click "New +" button in the top right
   - Select "Blueprint"

3. **Connect Repository**:
   - Select "Connect a repository"
   - Choose `aagnone3/software-multi-tool`
   - Grant necessary permissions if prompted

4. **Render Auto-Detection**:
   - Render automatically detects `render.yaml` in the repository root
   - Preview shows two resources will be created:
     - **Web Service**: `api-server` (Fastify backend)
     - **PostgreSQL Database**: `postgres-db` (PostgreSQL 16)

5. **Apply Blueprint**:
   - Click "Apply" button
   - Render creates both resources
   - Initial deploy starts automatically
   - **Note**: First deploy will fail - environment variables need configuration

## Step 2: Get Assigned URLs

After blueprint creation, Render assigns URLs:

### API Server URL

- Format: `https://api-server-xxxx.onrender.com`
- Location: Render Dashboard > Services > api-server > "Settings" tab
- Copy this URL - you'll need it for `BETTER_AUTH_URL`

### Database URL

- Format: `postgresql://user:pass@hostname:port/database`
- Location: Render Dashboard > PostgreSQL > postgres-db > "Info" tab > "Internal Connection String"
- **Note**: This is auto-configured via `render.yaml` - no manual setup needed

## Step 3: Configure Environment Variables

The `render.yaml` file defines environment variables with placeholder values that must be updated.

### 3a. Update BETTER_AUTH_URL

This must match your actual Render API server URL.

**Via Render Dashboard**:

1. Navigate to: Services > api-server > "Environment" tab
2. Find `BETTER_AUTH_URL`
3. Update value: `https://api-server-xxxx.onrender.com` (your actual URL from Step 2)
4. Click "Save Changes"

**Via CLI** (if you have the service ID):

```bash
pnpm --filter @repo/scripts render env set \
  --service srv-xxxx \
  --key BETTER_AUTH_URL \
  --value "https://api-server-xxxx.onrender.com"
```

### 3b. Update CORS_ORIGIN

This must match your Next.js frontend URL on Vercel.

**Via Render Dashboard**:

1. Navigate to: Services > api-server > "Environment" tab
2. Find `CORS_ORIGIN`
3. Update value: `https://your-domain.vercel.app` (your Vercel deployment URL)
4. Click "Save Changes"

**Via CLI**:

```bash
pnpm --filter @repo/scripts render env set \
  --service srv-xxxx \
  --key CORS_ORIGIN \
  --value "https://your-domain.vercel.app"
```

**Important**:

- Include the protocol (`https://`)
- Do NOT include a trailing slash
- For production, use your custom domain (e.g., `https://pragmatic.tools`)
- For staging, use the Vercel preview URL

## Step 4: Sync BETTER_AUTH_SECRET

The `BETTER_AUTH_SECRET` must be **identical** between Vercel (Next.js) and Render (api-server) for authentication to work.

### Option A: Render Generates, Sync to Vercel (Recommended)

Render auto-generates `BETTER_AUTH_SECRET` when the Blueprint is created.

1. **Get Secret from Render**:
   - Navigate to: Services > api-server > "Environment" tab
   - Find `BETTER_AUTH_SECRET`
   - Click "Show" to reveal the value
   - Copy the entire secret value

2. **Set in Vercel**:

   ```bash
   # From repository root
   pnpm web:env:set BETTER_AUTH_SECRET "paste-render-secret-here" --target production
   pnpm web:env:set BETTER_AUTH_SECRET "paste-render-secret-here" --target preview
   ```

3. **Redeploy Vercel**:
   - Trigger a new Vercel deployment to pick up the updated secret
   - Vercel Dashboard > Deployments > Redeploy

### Option B: Vercel Source, Sync to Render

If you already have `BETTER_AUTH_SECRET` set in Vercel:

1. **Get Secret from Vercel**:

   ```bash
   pnpm web:env:list --target production | grep BETTER_AUTH_SECRET
   ```

2. **Set in Render** (via Dashboard):
   - Navigate to: Services > api-server > "Environment" tab
   - Find `BETTER_AUTH_SECRET`
   - Click "Edit"
   - Paste the Vercel secret value
   - Click "Save Changes"

3. **Redeploy Render**:
   - Render automatically triggers a redeploy when environment variables change

## Step 5: Verify Deployment

After environment variables are configured, verify the deployment succeeded.

### 5a. Check Deploy Status

**Via Render Dashboard**:

- Navigate to: Services > api-server > "Events" tab
- Latest deploy should show "Deploy live" status
- If failed, check "Logs" tab for error messages

**Via CLI**:

```bash
# List recent deploys
pnpm --filter @repo/scripts render deploys list --service srv-xxxx

# Get detailed deploy info
pnpm --filter @repo/scripts render deploys get \
  --service srv-xxxx \
  --deploy dep-xxxx
```

### 5b. Test Health Endpoint

```bash
curl https://api-server-xxxx.onrender.com/health
# Expected: OK (200 status)
```

If health check fails:

- Verify `HOST=0.0.0.0` (not `127.0.0.1`)
- Check Render logs for startup errors
- Ensure port `4000` is exposed in Dockerfile

### 5c. Check Render Logs

**Via Dashboard**:

- Navigate to: Services > api-server > "Logs" tab
- Look for successful startup message:

  ```text
  [api-server] Server listening at http://0.0.0.0:4000
  ```

**Via CLI** (if available):

```bash
# Real-time logs
render logs --service api-server --follow
```

## Step 6: Test Integration

Verify the api-server integrates correctly with the Next.js frontend.

### 6a. Test WebSocket Connection

From your Next.js app (in browser console or test file):

```javascript
// Get auth token from Better Auth session
const token = session.token;

// Connect to WebSocket
const ws = new WebSocket('wss://api-server-xxxx.onrender.com/ws');

ws.addEventListener('open', () => {
  console.log('✓ WebSocket connected');
  // Send authentication
  ws.send(JSON.stringify({
    type: 'auth',
    token
  }));
});

ws.addEventListener('message', (event) => {
  console.log('Message received:', event.data);
});

ws.addEventListener('error', (error) => {
  console.error('WebSocket error:', error);
});
```

**Expected**:

- Connection opens successfully
- No CORS errors in browser console
- Authentication succeeds

**Troubleshooting**:

- CORS errors → Verify `CORS_ORIGIN` matches frontend URL exactly
- Auth errors → Verify `BETTER_AUTH_SECRET` matches between Vercel and Render
- Connection refused → Check Render logs for startup errors

### 6b. Test oRPC Endpoints

If you have oRPC endpoints configured:

```typescript
// Example oRPC call to api-server
import { client } from '@/lib/api-client';

const result = await client.someEndpoint.query();
console.log('oRPC response:', result);
```

### 6c. Test CORS Configuration

```bash
# Test CORS preflight request
curl -X OPTIONS \
  -H "Origin: https://your-domain.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://api-server-xxxx.onrender.com/api/example

# Check for CORS headers in response:
# Access-Control-Allow-Origin: https://your-domain.vercel.app
# Access-Control-Allow-Methods: GET, POST, ...
```

## Environment Variables Reference

Complete list of environment variables configured in `render.yaml`:

| Variable             | Source                  | Description                                    | Example                              |
| -------------------- | ----------------------- | ---------------------------------------------- | ------------------------------------ |
| `NODE_ENV`           | Static (render.yaml)    | Node environment                               | `production`                         |
| `PORT`               | Static (render.yaml)    | Server port                                    | `4000`                               |
| `HOST`               | Static (render.yaml)    | Bind address                                   | `0.0.0.0`                            |
| `DATABASE_URL`       | Auto (from postgres-db) | PostgreSQL connection string                   | `postgresql://user:pass@host/db`     |
| `BETTER_AUTH_SECRET` | Generated (Render)      | Session secret (must match Vercel)             | Auto-generated 32-char string        |
| `BETTER_AUTH_URL`    | **Manual (Step 3a)**    | API server public URL                          | `https://api-server.onrender.com`    |
| `CORS_ORIGIN`        | **Manual (Step 3b)**    | Frontend origin (Next.js URL)                  | `https://your-domain.vercel.app`     |
| `LOG_LEVEL`          | Static (render.yaml)    | Logging level                                  | `info`                               |

**Manual Configuration Required**:

- ✅ `BETTER_AUTH_URL` - Update with actual Render URL (Step 3a)
- ✅ `CORS_ORIGIN` - Update with actual Vercel URL (Step 3b)
- ✅ `BETTER_AUTH_SECRET` - Sync between Render and Vercel (Step 4)

## Troubleshooting

### Service Won't Start

**Symptoms**: Deploy fails, service shows "Deploy failed" status

**Solutions**:

1. Check environment variables are set correctly
2. Verify `DATABASE_URL` is accessible from Render
3. Check build logs: Render Dashboard > Logs tab
4. Ensure Dockerfile builds successfully locally:

   ```bash
   cd apps/api-server
   docker build -t api-server .
   docker run -p 4000:4000 api-server
   ```

### Health Check Failing

**Symptoms**: Render shows "Service Unhealthy" status

**Solutions**:

1. Verify `HOST=0.0.0.0` (not `127.0.0.1`)
2. Ensure port `4000` is exposed in Dockerfile
3. Check health endpoint responds locally:

   ```bash
   pnpm --filter @repo/api-server dev
   curl http://localhost:4000/health
   ```

4. Review Render logs for startup errors

### CORS Errors in Browser

**Symptoms**:

```text
Access to XMLHttpRequest at 'https://api-server.onrender.com' from origin
'https://your-domain.vercel.app' has been blocked by CORS policy
```

**Solutions**:

1. Verify `CORS_ORIGIN` matches frontend URL **exactly**:
   - Include protocol (`https://`)
   - No trailing slash
   - Match subdomain exactly
2. For multiple allowed origins, update `apps/api-server/src/lib/server.ts`:

   ```typescript
   fastify.register(fastifyCors, {
     origin: [
       'https://domain1.com',
       'https://domain2.com'
     ],
     credentials: true
   });
   ```

3. Redeploy after changes

### WebSocket Connection Fails

**Symptoms**: WebSocket fails to connect or immediately closes

**Solutions**:

1. Check `BETTER_AUTH_SECRET` matches between Vercel and Render
2. Verify authentication token is being sent in WebSocket connection
3. Check Render logs for WebSocket connection attempts
4. Test WebSocket locally:

   ```bash
   pnpm --filter @repo/api-server dev
   # Use a WebSocket client to connect to ws://localhost:4000/ws
   ```

### Database Connection Errors

**Symptoms**:

```text
Error: connect ECONNREFUSED
```

**Solutions**:

1. Verify `DATABASE_URL` is set and accessible
2. Check postgres-db is running: Render Dashboard > PostgreSQL > postgres-db
3. Ensure database region matches service region (both should be "oregon")
4. Test connection manually:

   ```bash
   psql $DATABASE_URL -c "SELECT version();"
   ```

### Auto-Deploy Not Triggering

**Symptoms**: Pushing to main doesn't trigger a new deploy

**Solutions**:

1. Verify `autoDeploy: true` in `render.yaml`
2. Check branch setting: Services > api-server > Settings > "Branch" should be `main`
3. Manually trigger deploy:

   ```bash
   pnpm --filter @repo/scripts render deploys trigger --service srv-xxxx
   ```

## CLI Commands Reference

### Service Management

```bash
# List all services
pnpm --filter @repo/scripts render services list

# Get service details
pnpm --filter @repo/scripts render services get --service srv-xxxx
```

### Deploy Management

```bash
# List deploys
pnpm --filter @repo/scripts render deploys list --service srv-xxxx

# Trigger new deploy
pnpm --filter @repo/scripts render deploys trigger --service srv-xxxx

# Trigger deploy with cache clear
pnpm --filter @repo/scripts render deploys trigger --service srv-xxxx --clear-cache

# Cancel running deploy
pnpm --filter @repo/scripts render deploys cancel --service srv-xxxx --deploy dep-xxxx
```

### Environment Variable Management

```bash
# List all environment variables
pnpm --filter @repo/scripts render env list --service srv-xxxx

# Get specific variable
pnpm --filter @repo/scripts render env get --service srv-xxxx --key CORS_ORIGIN

# Set variable
pnpm --filter @repo/scripts render env set \
  --service srv-xxxx \
  --key NEW_VAR \
  --value "value"

# Delete variable
pnpm --filter @repo/scripts render env delete --service srv-xxxx --key OLD_VAR
```

## Related Documentation

- **Render Skill**: `.claude/skills/render/SKILL.md` - Complete Render CLI and API reference
- **render.yaml**: `render.yaml` - Infrastructure-as-code configuration
- **API Server**: `apps/api-server/README.md` - Local development and architecture
- **Better Auth**: `.claude/skills/better-auth/SKILL.md` - Authentication configuration

## Next Steps

After successful deployment:

1. **Configure Custom Domain** (optional):
   - Render Dashboard > Services > api-server > Settings > "Custom Domain"
   - Add your domain (e.g., `api.pragmatic.tools`)
   - Update DNS records as instructed
   - Update `BETTER_AUTH_URL` to use custom domain

2. **Set Up Monitoring**:
   - Configure alerts: Render Dashboard > Services > api-server > "Notifications"
   - Set up uptime monitoring (e.g., UptimeRobot, Pingdom)

3. **Review Performance**:
   - Monitor response times in Render Dashboard
   - Check for resource usage (CPU, memory)
   - Consider upgrading plan if needed

4. **Update Frontend Configuration**:
   - Set `NEXT_PUBLIC_API_SERVER_URL` in Vercel to point to Render:

     ```bash
     pnpm web:env:set NEXT_PUBLIC_API_SERVER_URL "https://api-server-xxxx.onrender.com" --target production
     ```

5. **Test Production Flows**:
   - Complete user authentication flow
   - Test WebSocket connections under load
   - Verify long-running operations work correctly
