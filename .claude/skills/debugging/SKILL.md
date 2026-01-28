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

Debug applications across Vercel, Supabase, and Render in local, preview, and production environments.

---

## Quick Fixes

**Most common issues and their one-liner solutions.**

| Symptom | Fix |
| ------- | --- |
| App not loading | `vercel logs <url>` to check for errors |
| Database connection refused | Resume Supabase project or check `DATABASE_URL` |
| API returning 502 | `curl https://<api-url>/health` - check if Render is running |
| Session not persisting (preview) | Verify requests go through `/api/proxy/*` |
| CORS error | Update `CORS_ORIGIN` on Render to match frontend URL |
| Prisma client errors | `pnpm --filter @repo/database generate` |
| Port already in use | `lsof -i :<port>` then `kill -9 <PID>` |
| Env var not taking effect | Redeploy (Vercel bakes env vars at build time) |

---

## Common Scenarios

### "The app is broken - where do I start?"

```bash
# 1. Check deployment status
gh pr checks <pr-number>  # For PRs
vercel ls                 # For production

# 2. Check logs for errors
vercel logs <deployment-url> --follow

# 3. Check API health
curl https://<api-url>/health
```

### "Database queries are failing"

```bash
# Test connection directly
PGPASSWORD=<pass> psql -h <host> -U postgres -d postgres -c "SELECT 1;"

# Check connection count (too many = pool exhausted)
mcp__postgres-ro-local-dev__execute_sql --sql "SELECT count(*) FROM pg_stat_activity;"

# Verify DATABASE_URL is set
vercel env ls | grep POSTGRES
```

### "Authentication isn't working"

```bash
# Check session exists (note: columns use camelCase)
mcp__postgres-ro-local-dev__execute_sql --sql "SELECT * FROM session ORDER BY \"createdAt\" DESC LIMIT 5;"

# In preview: verify proxy is used
# Browser DevTools -> Network -> requests should go to /api/proxy/*

# Check BETTER_AUTH_SECRET matches across services
```

### "Preview environment is misconfigured"

```bash
# Check all services deployed
gh pr checks <pr-number>

# Verify env vars synced
vercel env ls preview | grep -E "API_SERVER|DATABASE"

# Force redeploy after env changes
git commit --allow-empty -m "chore: trigger redeploy" && git push
```

---

## Log Access Quick Reference

| Platform | Command |
| -------- | ------- |
| **Vercel** | `vercel logs <url>` or `vercel logs <url> --follow` |
| **Supabase** | `mcp__plugin_supabase_supabase__get_logs --project_id <id> --service "postgres"` |
| **Render** | Dashboard → Service → Logs tab, or `pnpm --filter @repo/scripts render deploys list` |
| **Local** | Check terminal output, or `pnpm dev` logs |

**Supabase log services**: `postgres`, `auth`, `api`, `edge-function`, `storage`, `realtime`

---

## Error Pattern Reference

### Vercel Errors

| Error | Cause | Fix |
| ----- | ----- | --- |
| `FUNCTION_INVOCATION_TIMEOUT` | Function >60s | Move to Render api-server |
| `EDGE_FUNCTION_INVOCATION_FAILED` | Edge crash | Check for Node.js-only APIs |
| `MODULE_NOT_FOUND` | Missing dep | Check `package.json` |
| `504 Gateway Timeout` | Upstream timeout | Check API server health |

### Supabase Errors

| Error | Cause | Fix |
| ----- | ----- | --- |
| `connection refused` | DB paused/wrong URL | Resume project, check URL |
| `password authentication failed` | Wrong credentials | Check Dashboard |
| `too many connections` | Pool exhausted | Use pooled URL, check leaks |
| `relation does not exist` | Missing migration | Run migrations |
| `permission denied` | RLS blocking | Check RLS policies |

### Render Errors

| Error | Cause | Fix |
| ----- | ----- | --- |
| `Build failed` | Compile error | Check build logs |
| `Health check failed` | App not responding | Verify `HOST=0.0.0.0` |
| `502 Bad Gateway` | App crashed | Check runtime logs |
| `CORS error` | Origin mismatch | Update `CORS_ORIGIN` |

---

## Environment Reference

### Service URLs by Environment

| Environment | Frontend | API Server | Database |
| ----------- | -------- | ---------- | -------- |
| Local | `localhost:3500` | `localhost:4000` | `localhost:5432` |
| Preview | `<branch>.vercel.app` | `<branch>-api.onrender.com` | Supabase branch DB |
| Production | `your-domain.com` | `api.your-domain.com` | Supabase prod DB |

### Connection Strings

| Use Case | Variable |
| -------- | -------- |
| App runtime | `POSTGRES_PRISMA_URL` (pooled) |
| Migrations | `POSTGRES_URL_NON_POOLING` (direct) |
| Local dev | `DATABASE_URL` |

---

## Vercel Platform Details

### Vercel Log Commands

```bash
# Runtime logs
vercel logs <deployment-url>
vercel logs <deployment-url> --follow
vercel logs <deployment-url> --filter "api/proxy"

# Build logs
vercel inspect <deployment-url>
# Or: Dashboard → Deployments → Build Logs
```

### Vercel Environment Variables

```bash
pnpm web:env:list                    # List all
pnpm web:env:list --target preview   # Preview only
pnpm web:env:pull                    # Pull to local
vercel env ls | grep DATABASE_URL    # Check specific var
```

**Note**: Vercel bakes env vars at build time. Changes require redeploy.

### Vercel API Proxy (Preview Only)

Preview environments use `/api/proxy/*` to forward requests to Render (different domains can't share cookies).

```bash
# Verify proxy env vars
vercel env ls preview | grep API_SERVER_URL

# Check requests in browser DevTools → Network → filter "api/proxy"
```

---

## Supabase Platform Details

### Supabase Log Commands

```bash
# Via MCP
mcp__plugin_supabase_supabase__get_logs --project_id <id> --service "postgres"
mcp__plugin_supabase_supabase__get_logs --project_id <id> --service "auth"

# Via Dashboard: Project → Settings → Logs
```

### Supabase Health Checks

```bash
# Performance advisors
mcp__plugin_supabase_supabase__get_advisors --project_id <id> --type "performance"

# Security advisors
mcp__plugin_supabase_supabase__get_advisors --project_id <id> --type "security"

# Database health (local MCP)
mcp__postgres-ro-local-dev__analyze_db_health --health_type "all"
```

### Supabase Useful Queries

```sql
-- Active connections
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Blocking queries
SELECT blocked_locks.pid AS blocked_pid,
       blocking_locks.pid AS blocking_pid,
       blocked_activity.query AS blocked_query
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity
  ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks
  ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity
  ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- Slow queries (requires pg_stat_statements)
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

### Supabase Branch Databases (Preview)

```bash
# List branches
mcp__plugin_supabase_supabase__list_branches --project_id <id>

# Branch DB URL: Dashboard → Database → Branches → Select branch → Settings
```

---

## Render Platform Details

### Render Log Commands

```bash
# List services
pnpm --filter @repo/scripts render services list

# List deploys
pnpm --filter @repo/scripts render deploys list --service <service-id>

# Dashboard: Service → Logs tab → "Live Tail" for streaming
```

### Render Environment Variables

```bash
pnpm --filter @repo/scripts render env list --service <service-id>
pnpm --filter @repo/scripts render env get --service <service-id> --key DATABASE_URL
pnpm --filter @repo/scripts render env set --service <service-id> --key CORS_ORIGIN --value "https://..."
```

### Render Health Check

```bash
curl https://<service-url>/health
# Expected: OK
```

---

## Local Development Details

### Local Quick Health Check

```bash
# Check services running
lsof -i :3500  # Frontend
lsof -i :4000  # API
lsof -i :5432  # Database

# Test database
PGPASSWORD=postgres psql -h localhost -U postgres -d local_aimultitool -c "SELECT 1;"
```

### Local Common Fixes

```bash
# Port conflict
lsof -i :<port>
kill -9 <PID>

# Database not running (macOS)
brew services start postgresql@17
brew services list | grep postgres

# Create database
PGPASSWORD=postgres psql -h localhost -U postgres -d template1 \
  -c "CREATE DATABASE local_aimultitool;"

# Missing env vars
cp apps/web/.env.local.example apps/web/.env.local
pnpm web:env:pull

# Prisma out of sync
pnpm --filter @repo/database generate
pnpm --filter @repo/database migrate
```

### Local Debug Tools

- **Browser DevTools**: Network (API), Console (JS errors), Application (cookies)
- **Structured logging**: `import { logger } from "@repo/logs"`

---

## Advanced: Database Connection Diagnosis

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

---

## Advanced: Authentication/Session Debugging

### Session Flow

```text
Login Request → Better Auth validates → Session in DB → Cookie set → Requests include cookie → Session validated
```

### Auth Session Issues

| Issue | Diagnosis | Fix |
| ----- | --------- | --- |
| Session not persisting | Check cookie in DevTools | Verify `BETTER_AUTH_SECRET` matches |
| Cross-origin fails (preview) | Different domains | Use API proxy |
| Session expires quickly | Check config | Adjust `session.expiresIn` |
| "Invalid origin" error | URL mismatch | Update `BETTER_AUTH_URL` |

### Auth Debug Commands

```bash
# Check sessions (note: columns use camelCase)
mcp__postgres-ro-local-dev__execute_sql --sql "SELECT id, \"userId\", \"createdAt\", \"expiresAt\" FROM session ORDER BY \"createdAt\" DESC LIMIT 5;"

# Check user
mcp__postgres-ro-local-dev__execute_sql --sql "SELECT id, email FROM \"user\" WHERE email = 'test@example.com';"
```

---

## Advanced: API Request Tracing

### Adding Trace Headers

```typescript
const requestId = crypto.randomUUID();
headers.set("x-request-id", requestId);
logger.info("Request started", { requestId, path, method });
```

### Trace Through System

```text
Browser → Vercel Proxy [abc123] → Render API [abc123] → Database [abc123] → Response
```

### Searching Traced Logs

```bash
vercel logs <url> | grep "abc123"
# Render: Dashboard search "abc123"
```

---

## Advanced: Performance Monitoring

### Database Query Performance

> **Note**: `get_top_queries` requires the `pg_stat_statements` extension. If not installed, run:
> `CREATE EXTENSION IF NOT EXISTS pg_stat_statements;`

```bash
# Slow queries (requires pg_stat_statements extension)
mcp__postgres-ro-local-dev__get_top_queries --sort_by "mean_time" --limit 10

# Query plan
mcp__postgres-ro-local-dev__explain_query --sql "SELECT * FROM users WHERE email = 'x'" --analyze true

# Index recommendations
mcp__postgres-ro-local-dev__analyze_workload_indexes
```

### API Response Timing

```typescript
const start = performance.now();
// ... operation
const duration = performance.now() - start;
logger.info("Request completed", { duration, path });
```

---

## Advanced: Structured Error Logging

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

### Error Categories

| Category | HTTP | Log Level | Action |
| -------- | ---- | --------- | ------ |
| User Error | 400 | info | Return message |
| Auth Error | 401 | warn | Check session |
| Not Found | 404 | info | - |
| Server Error | 500 | error | Alert |
| External Error | 502/503 | error | Retry |

---

## Advanced: Production Incident Response

### Safe Practices

**DO**: Read-only queries, check logs first, test in preview, use feature flags, monitor after changes

**DON'T**: Write queries without backup, deploy untested code, modify env vars without testing, restart during peak hours

### Response Steps

1. **Identify**: Check error rates in logs
2. **Assess**: Scope and impact
3. **Mitigate**: Roll back if needed, communicate
4. **Fix**: Develop in preview, verify
5. **Deploy**: With monitoring
6. **Review**: Post-incident analysis

---

## Troubleshooting Checklists

### Checklist: App Not Loading

- [ ] Deployment successful? (`vercel ls` or `gh pr checks`)
- [ ] Environment variables set? (Check dashboard/CLI)
- [ ] Database accessible? (Test connection)
- [ ] Build errors? (Check build logs)
- [ ] Runtime errors? (Check function logs)

### Checklist: API Not Responding

- [ ] API server running? (`curl <url>/health`)
- [ ] CORS configured? (Check `CORS_ORIGIN`)
- [ ] Auth working? (Check session/cookies)
- [ ] Database connected? (Check logs)
- [ ] Timeouts? (Long-running operations?)

### Checklist: Database Error

- [ ] `DATABASE_URL` correct?
- [ ] Database running? (Supabase status)
- [ ] Migrations applied? (`prisma migrate status`)
- [ ] Connection pool healthy? (Check active connections)
- [ ] RLS blocking? (Check policies)

### Checklist: Preview Environment Issues

- [ ] All services deployed? (`gh pr checks`)
- [ ] Env vars synced? (Check Vercel/Render)
- [ ] Proxy routing correctly? (Network tab)
- [ ] Correct database? (Verify branch DB URL)
- [ ] Redeployed after env changes?

---

## Related Skills

| Skill | Use For |
| ----- | ------- |
| **api-proxy** | Preview authentication proxy details |
| **cicd** | CI/CD pipeline, preview environment setup |
| **architecture** | System architecture, request flow |
| **render** | Render deployment details |
| **better-auth** | Authentication configuration |
| **prisma-migrate** | Database migration workflows |
