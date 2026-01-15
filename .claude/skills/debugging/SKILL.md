---
name: debugging
description: Use this skill when debugging applications across platforms (Vercel, Supabase, Render) and environments (local, preview, production). Covers log access, error patterns, connection troubleshooting, and performance monitoring.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebFetch
---

# Debugging Skill

This skill provides comprehensive guidance for debugging applications across all deployment platforms (Vercel, Supabase, Render) and environments (local, preview, production).

## Quick Reference

| Platform | Log Access Command | Dashboard URL |
| -------- | ----------------- | ------------- |
| Vercel | `vercel logs <deployment-url>` | https://vercel.com/dashboard |
| Supabase | Supabase MCP or Dashboard | https://supabase.com/dashboard |
| Render | `pnpm --filter @repo/scripts render deploys list` | https://dashboard.render.com |

| Environment | Database | API Server | Frontend |
| ----------- | -------- | ---------- | -------- |
| Local | `localhost:5432` | `localhost:4000` | `localhost:3500` |
| Preview | Supabase branch DB | Render preview | Vercel preview |
| Production | Supabase prod DB | Render prod | Vercel prod |

## Platform-Specific Debugging

### Vercel (Next.js Frontend)

#### Accessing Logs

**Runtime Logs (Serverless Functions)**:

```bash
# View recent logs for production
vercel logs <project-name>.vercel.app

# View logs for specific deployment
vercel logs <deployment-url>

# Stream logs in real-time
vercel logs <deployment-url> --follow

# Filter by function
vercel logs <deployment-url> --filter "api/proxy"
```

**Build Logs**:

```bash
# View build output for latest deployment
vercel inspect <deployment-url>

# Or use Vercel Dashboard:
# Project -> Deployments -> Select deployment -> Build Logs
```

**Using Supabase MCP for Vercel Logs** (Alternative):

```bash
# Get logs via Supabase MCP (if configured)
mcp__plugin_supabase_supabase__get_logs --project_id <id> --service "api"
```

#### Common Error Patterns

| Error | Cause | Solution |
| ----- | ----- | -------- |
| `FUNCTION_INVOCATION_TIMEOUT` | Function exceeded 60s limit | Move to Render api-server for long operations |
| `EDGE_FUNCTION_INVOCATION_FAILED` | Edge function crash | Check for Node.js-only APIs in edge routes |
| `MODULE_NOT_FOUND` | Missing dependency | Check `package.json` and Turbo dependencies |
| `504 Gateway Timeout` | Upstream timeout | Check API server health, increase timeout |
| `500 Internal Server Error` | Unhandled exception | Check function logs for stack trace |

#### Environment Variable Debugging

```bash
# List all environment variables
pnpm web:env:list

# List for specific target (preview/production)
pnpm web:env:list --target preview
pnpm web:env:list --target production

# Verify a specific variable
vercel env ls | grep DATABASE_URL

# Pull env vars to local
pnpm web:env:pull
```

**Common Issues**:

- Variable set but not taking effect: **Redeploy required** (Vercel bakes env vars at build time)
- Branch-specific vs generic: Branch-specific env vars take precedence
- Missing `NEXT_PUBLIC_` prefix: Client-side code cannot access server-only vars

#### Connection Troubleshooting

**API Proxy Issues (Preview)**:

```bash
# Check if proxy route is being hit
# Browser DevTools -> Network -> Filter "api/proxy"

# Verify proxy environment variables
vercel env ls preview | grep API_SERVER_URL
```

**Database Connection**:

```bash
# Verify DATABASE_URL is set
vercel env ls | grep POSTGRES

# Test connection from Vercel function (add debug endpoint temporarily)
```

### Supabase (PostgreSQL Database)

#### Accessing Supabase Logs

**Via Supabase MCP**:

```bash
# Get postgres logs
mcp__plugin_supabase_supabase__get_logs --project_id <project-id> --service "postgres"

# Get auth logs
mcp__plugin_supabase_supabase__get_logs --project_id <project-id> --service "auth"

# Get API gateway logs
mcp__plugin_supabase_supabase__get_logs --project_id <project-id> --service "api"

# Get edge function logs
mcp__plugin_supabase_supabase__get_logs --project_id <project-id> --service "edge-function"
```

**Via Supabase Dashboard**:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to: Project Settings -> Logs
4. Select log type: Postgres, Auth, API, etc.

**Via SQL**:

```sql
-- Check recent Postgres logs (requires pg_stat_statements)
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;

-- Check active connections
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Check for blocking queries
SELECT blocked_locks.pid AS blocked_pid,
       blocking_locks.pid AS blocking_pid,
       blocked_activity.query AS blocked_query,
       blocking_activity.query AS blocking_query
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

#### Supabase Error Patterns

| Error | Cause | Solution |
| ----- | ----- | -------- |
| `connection refused` | Database paused or wrong URL | Resume project, verify `DATABASE_URL` |
| `password authentication failed` | Wrong credentials | Check Supabase Dashboard for correct password |
| `too many connections` | Connection pool exhausted | Use pooled connection string, check for leaks |
| `relation does not exist` | Missing table/migration | Run `pnpm --filter @repo/database migrate` |
| `permission denied` | RLS policy blocking | Check Row Level Security policies |
| `duplicate key value` | Unique constraint violation | Handle in code or check data |

#### Database Health Checks

```bash
# Using Supabase MCP
mcp__plugin_supabase_supabase__get_advisors --project_id <id> --type "performance"
mcp__plugin_supabase_supabase__get_advisors --project_id <id> --type "security"

# Using local postgres MCP
mcp__postgres-ro-local-dev__analyze_db_health --health_type "all"
```

#### Supabase Connection Troubleshooting

**Pooled vs Direct Connections**:

| Use Case | Connection String Variable |
| -------- | -------------------------- |
| Application runtime | `POSTGRES_PRISMA_URL` (pooled) |
| Migrations | `POSTGRES_URL_NON_POOLING` (direct) |
| Local development | `DATABASE_URL` |

**Testing Connection**:

```bash
# Test from command line
PGPASSWORD=<password> psql -h <host> -U postgres -d postgres -c "SELECT 1;"

# Check connection count
mcp__postgres-ro-local-dev__execute_sql --sql "SELECT count(*) FROM pg_stat_activity;"
```

### Render (API Server)

#### Accessing Render Logs

**Via Render CLI**:

```bash
# List services to get service ID
pnpm --filter @repo/scripts render services list

# List recent deploys
pnpm --filter @repo/scripts render deploys list --service <service-id>

# Get deploy details (includes status)
pnpm --filter @repo/scripts render deploys get --service <service-id> --deploy <deploy-id>
```

**Via Render Dashboard**:

1. Go to https://dashboard.render.com
2. Select your service
3. Click "Logs" tab
4. Filter by: Build, Deploy, or Runtime

**Streaming Logs** (via Dashboard):

- Click "Live Tail" to stream logs in real-time
- Use search to filter specific patterns

#### Render Error Patterns

| Error | Cause | Solution |
| ----- | ----- | -------- |
| `Build failed` | Dependency/compilation error | Check build logs, fix code errors |
| `Health check failed` | App not responding on `/health` | Verify `HOST=0.0.0.0`, check startup logs |
| `502 Bad Gateway` | App crashed or not running | Check runtime logs, verify environment vars |
| `Dynamic require of X is not supported` | ESM/CJS mismatch | Use `--format=cjs` in esbuild |
| `CORS error` | `CORS_ORIGIN` mismatch | Update `CORS_ORIGIN` to match frontend URL |

#### Render Environment Variable Debugging

```bash
# List environment variables
pnpm --filter @repo/scripts render env list --service <service-id>

# Get specific variable
pnpm --filter @repo/scripts render env get --service <service-id> --key DATABASE_URL

# Set/update variable (triggers redeploy)
pnpm --filter @repo/scripts render env set --service <service-id> --key CORS_ORIGIN --value "https://example.com"
```

#### Render Connection Troubleshooting

**Health Check**:

```bash
# Check health endpoint
curl https://<service-url>/health
# Expected: OK

# Check WebSocket
wscat -c wss://<service-url>/ws -H "Authorization: Bearer <token>"
```

**Database Connection**:

```bash
# Verify DATABASE_URL is accessible from Render
# Add debug endpoint or check logs for connection errors
```

## Environment-Specific Debugging

### Local Development

#### Quick Health Check

```bash
# Check if services are running
lsof -i :3500  # Next.js frontend
lsof -i :4000  # API server
lsof -i :5432  # PostgreSQL

# Check database
PGPASSWORD=postgres psql -h localhost -U postgres -d local_softwaremultitool -c "SELECT 1;"
```

#### Local Development Issues

**Port Conflicts**:

```bash
# Find what's using a port
lsof -i :<port>

# Kill process
kill -9 <PID>

# Or use different port in worktree
echo "PORT=3501" >> apps/web/.env.local
```

**Database Not Running**:

```bash
# macOS (Homebrew)
brew services start postgresql@17

# Check if running
brew services list | grep postgres

# Create database if missing
PGPASSWORD=postgres psql -h localhost -U postgres -d template1 -c "CREATE DATABASE local_softwaremultitool;"
```

**Missing Environment Variables**:

```bash
# Copy example file
cp apps/web/.env.local.example apps/web/.env.local

# Pull from Vercel (if configured)
pnpm web:env:pull
```

**Prisma Client Out of Sync**:

```bash
# Regenerate Prisma client
pnpm --filter @repo/database generate

# If schema changed, run migrations
pnpm --filter @repo/database migrate
```

#### Debug Tools

**Browser DevTools**:

- Network tab: Inspect API requests/responses
- Console: Check for JavaScript errors
- Application tab: Inspect cookies, localStorage

**VS Code Debugging**:

```json
// .vscode/launch.json
{
  "configurations": [
    {
      "name": "Next.js: debug",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev"
    }
  ]
}
```

**Console Logging**:

```typescript
// Structured logging with consola (from @repo/logs)
import { logger } from "@repo/logs";

logger.info("Operation started", { userId, action });
logger.error("Operation failed", { error, context });
```

### Preview Environments

#### Architecture Overview

```text
PR Branch
    ↓
┌─────────────────────────────────────────────────────────┐
│                   Preview Stack                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Vercel    │  │   Render    │  │    Supabase     │  │
│  │   Preview   │→→│   Preview   │→→│   Branch DB     │  │
│  │             │  │             │  │                 │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### Finding Preview URLs

**Vercel**:

```bash
# From PR, find deployment URL in GitHub checks
# Or from Vercel Dashboard: Project -> Deployments

# Pattern: <project>-git-<branch>.vercel.app
```

**Render**:

```bash
# List services (includes preview services)
pnpm --filter @repo/scripts render services list

# Preview service name pattern: <service>-<branch>
```

**Supabase**:

```bash
# List branches
mcp__plugin_supabase_supabase__list_branches --project_id <id>

# Branch database URL from Supabase Dashboard:
# Project -> Database -> Branches -> Select branch -> Settings
```

#### Common Preview Issues

**Session Not Persisting**:

1. Check requests go through `/api/proxy/*` (Network tab)
2. Verify `NEXT_PUBLIC_VERCEL_ENV=preview`
3. Verify `API_SERVER_URL` points to Render preview
4. Check cookies are being forwarded

**Wrong Database**:

1. Verify `POSTGRES_PRISMA_URL` points to branch DB
2. Check if env vars were synced after branch creation
3. Trigger Vercel redeploy if env vars changed

**CORS Errors**:

1. Verify `CORS_ORIGIN` on Render matches Vercel preview URL
2. Check for trailing slashes (must match exactly)
3. Update and redeploy if needed

#### Preview Debug Commands

```bash
# Check preview environment sync status
gh pr checks <pr-number>

# Manually trigger sync (if workflow available)
gh workflow run sync-preview-environments.yml -f pr_number=<number>

# Verify Vercel env vars for branch
vercel env ls preview | grep -E "API_SERVER|DATABASE"
```

### Production Environment

#### Safe Debugging Practices

**DO**:

- Use read-only queries
- Check logs before making changes
- Test fixes in preview first
- Use feature flags for rollouts
- Monitor metrics after changes

**DON'T**:

- Run write queries without backup
- Deploy untested code
- Modify env vars without testing
- Restart services during peak hours

#### Accessing Production Logs

**Vercel**:

```bash
vercel logs <production-url> --follow
```

**Supabase**:

```bash
mcp__plugin_supabase_supabase__get_logs --project_id <prod-id> --service "postgres"
```

**Render**:

```bash
pnpm --filter @repo/scripts render deploys list --service <prod-service-id>
# Then check logs in Render Dashboard
```

#### Production Health Checks

```bash
# Check frontend
curl -I https://your-domain.com/

# Check API health
curl https://api.your-domain.com/health

# Check database (read-only)
mcp__postgres-ro-local-dev__analyze_db_health
```

#### Incident Response

1. **Identify**: Check error rates in logs/monitoring
2. **Assess**: Determine scope and impact
3. **Mitigate**: Roll back if needed, communicate status
4. **Fix**: Develop fix in preview, verify
5. **Deploy**: Deploy fix with monitoring
6. **Review**: Post-incident analysis

## Cross-Cutting Concerns

### Database Connection Issues

#### Diagnosis Flow

```text
Connection Error
    ↓
Is DATABASE_URL set? ─No→ Set environment variable
    ↓ Yes
Is host reachable? ─No→ Check firewall/network
    ↓ Yes
Are credentials correct? ─No→ Update credentials
    ↓ Yes
Is database running? ─No→ Start/resume database
    ↓ Yes
Connection pool exhausted? ─Yes→ Increase pool size or fix leaks
    ↓ No
Check Prisma client version
```

#### Common Fixes

```bash
# Test raw connection
PGPASSWORD=<pass> psql -h <host> -U postgres -d postgres -c "SELECT 1;"

# Check connection count
mcp__postgres-ro-local-dev__execute_sql --sql "SELECT count(*) FROM pg_stat_activity;"

# Check for blocked queries
mcp__postgres-ro-local-dev__execute_sql --sql "SELECT * FROM pg_stat_activity WHERE wait_event_type = 'Lock';"
```

### Authentication/Session Debugging

#### Session Flow

```text
Login Request
    ↓
Better Auth validates credentials
    ↓
Session created in database
    ↓
Cookie set (secure, httpOnly, sameSite)
    ↓
Subsequent requests include cookie
    ↓
Better Auth validates session
```

#### Auth Session Issues

| Issue | Diagnosis | Solution |
| ----- | --------- | -------- |
| Session not persisting | Check cookie in DevTools | Verify `BETTER_AUTH_SECRET` matches |
| Cross-origin session fails | Different domains in preview | Use API proxy (see api-proxy skill) |
| Session expires too quickly | Check session duration config | Adjust `session.expiresIn` in auth config |
| "Invalid origin" error | `BETTER_AUTH_URL` mismatch | Update to match actual URL |

#### Auth Debug Commands

```bash
# Check session in database
mcp__postgres-ro-local-dev__execute_sql --sql "SELECT * FROM session ORDER BY created_at DESC LIMIT 5;"

# Check user exists
mcp__postgres-ro-local-dev__execute_sql --sql "SELECT id, email FROM \"user\" WHERE email = 'test@example.com';"
```

### API Request Tracing

#### Adding Trace Headers

```typescript
// Add request ID for tracing
const requestId = crypto.randomUUID();
headers.set("x-request-id", requestId);
logger.info("Request started", { requestId, path, method });
```

#### Tracing Through Proxy

```text
Browser Request
    ↓
x-request-id: abc123
    ↓
Vercel API Proxy (logs: [abc123] forwarding...)
    ↓
Render API Server (logs: [abc123] processing...)
    ↓
Database Query (logs: [abc123] SELECT...)
    ↓
Response (logs: [abc123] completed 200)
```

#### Log Search

```bash
# Search for specific request ID
vercel logs <url> | grep "abc123"

# In Render Dashboard, use search: "abc123"
```

### Error Tracking Integration

#### Structured Error Logging

```typescript
import { logger } from "@repo/logs";

try {
  // operation
} catch (error) {
  logger.error("Operation failed", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context: { userId, action, timestamp: new Date().toISOString() },
  });
  throw error;
}
```

#### Error Categories

| Category | Example | Action |
| -------- | ------- | ------ |
| User Error | Invalid input | Return 400, log info level |
| Auth Error | Invalid session | Return 401, log warn level |
| Not Found | Missing resource | Return 404, log info level |
| Server Error | Unhandled exception | Return 500, log error level, alert |
| External Error | API timeout | Return 502/503, log error level, retry |

### Log Aggregation Patterns

#### Structured Log Format

```typescript
// Consistent log structure
{
  timestamp: "2024-01-15T10:30:00.000Z",
  level: "error",
  message: "Database connection failed",
  service: "api-server",
  environment: "production",
  requestId: "abc123",
  userId: "user_001",
  error: {
    name: "ConnectionError",
    message: "Connection refused",
    stack: "..."
  }
}
```

#### Searching Logs

```bash
# By time range (Vercel)
vercel logs <url> --since 1h

# By error level (grep pattern)
vercel logs <url> | grep '"level":"error"'

# By request ID
vercel logs <url> | grep "abc123"
```

### Performance Monitoring

#### Database Query Performance

```bash
# Get slow queries
mcp__postgres-ro-local-dev__get_top_queries --sort_by "mean_time" --limit 10

# Explain specific query
mcp__postgres-ro-local-dev__explain_query --sql "SELECT * FROM users WHERE email = 'test@example.com'" --analyze true

# Get index recommendations
mcp__postgres-ro-local-dev__analyze_workload_indexes
```

#### API Response Times

```typescript
// Measure and log response time
const start = performance.now();
// ... operation
const duration = performance.now() - start;
logger.info("Request completed", { duration, path });
```

## Troubleshooting Checklists

### "App Not Loading" Checklist

- [ ] Is the deployment successful? (Check Vercel/Render status)
- [ ] Are environment variables set? (Check dashboard or CLI)
- [ ] Is the database accessible? (Test connection)
- [ ] Are there build errors? (Check build logs)
- [ ] Is there a runtime error? (Check function/runtime logs)

### "API Not Responding" Checklist

- [ ] Is the API server running? (Check health endpoint)
- [ ] Is CORS configured correctly? (Check `CORS_ORIGIN`)
- [ ] Is authentication working? (Check session/cookies)
- [ ] Is the database connected? (Check connection logs)
- [ ] Are there timeout issues? (Check for long-running operations)

### "Database Error" Checklist

- [ ] Is `DATABASE_URL` correct? (Check environment)
- [ ] Is the database running? (Check Supabase status)
- [ ] Are migrations applied? (Run `prisma migrate status`)
- [ ] Is connection pool healthy? (Check active connections)
- [ ] Are RLS policies blocking? (Check Row Level Security)

### "Preview Environment Issues" Checklist

- [ ] Did all services deploy? (Check GitHub PR checks)
- [ ] Were env vars synced? (Check Vercel/Render env vars)
- [ ] Is the proxy routing correctly? (Check Network tab)
- [ ] Is the correct database being used? (Verify branch DB URL)
- [ ] Was a redeploy triggered after env changes?

## Related Skills

- **api-proxy**: Preview environment authentication proxy details
- **cicd**: CI/CD pipeline and preview environment setup
- **architecture**: Overall system architecture and request flow
- **render**: Render deployment and API server details
- **better-auth**: Authentication system configuration
- **prisma-migrate**: Database migration workflows

## When to Use This Skill

Invoke this skill when:

- Application is returning errors or not responding
- Logs need to be accessed for any platform
- Environment variables need debugging
- Database connections are failing
- Preview environments are not working correctly
- Performance issues need investigation
- Session/authentication is not working
- Cross-origin issues occur in preview
- Production incidents require investigation
