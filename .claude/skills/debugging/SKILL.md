---
name: debugging-applications
description: Debugs applications across platforms (Vercel, Neon) and environments (local, preview, production) with log access, error patterns, connection troubleshooting, and performance monitoring. Use when the app is broken, database queries fail, auth issues arise, preview environments are misconfigured, or investigating performance problems.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebFetch
---

# Debugging Skill

Debug applications across Vercel and the database (local Postgres container, Neon preview branches, Neon production) in local, preview, and production environments.

## Quick Fixes

**Most common issues and their one-liner solutions.**

| Symptom | Fix |
| ------- | --- |
| App not loading | `vercel logs <url>` to check for errors |
| Database connection refused | Run `pnpm db:start` (local) or check `DATABASE_URL` (preview/prod) |
| Session not persisting (preview) | Verify requests go through `/api/proxy/*` |
| Prisma client errors | `pnpm --filter @repo/database generate` |
| Port already in use | `lsof -i :<port>` then `kill -9 <PID>` |
| Env var not taking effect | Redeploy (Vercel bakes env vars at build time) |

---

## Prerequisites

**MCP Tools**: Commands prefixed with `mcp__postgres-ro-local-dev__` require the `postgres-ro-local-dev` MCP server to be configured. Without it, use `psql` directly:

```bash
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c "YOUR SQL HERE"
```

**Available MCP database commands:**

| MCP Tool | Purpose |
| -------- | ------- |
| `mcp__postgres-ro-local-dev__execute_sql` | Run read-only SQL against the local Postgres container |

---

## Common Scenarios

### "The app is broken - where do I start?"

```bash
# 1. Check deployment status
gh pr checks <pr-number>  # For PRs
vercel ls                 # For production

# 2. Check logs for errors
vercel logs <deployment-url> --follow
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
vercel env ls preview | grep DATABASE

# Force redeploy after env changes
git commit --allow-empty -m "chore: trigger redeploy" && git push
```

---

## Log Access Quick Reference

| Platform | Command |
| -------- | ------- |
| **Vercel** | `vercel logs <url>` or `vercel logs <url> --follow` |
| **Neon (preview/prod DB)** | Neon Console → Project → Logs |
| **Local DB** | `docker compose logs db` (or `pnpm db:status`) |
| **Local app** | Check terminal output, or `pnpm dev` logs |

---

## Error Pattern Reference

### Vercel Errors

| Error | Cause | Fix |
| ----- | ----- | --- |
| `FUNCTION_INVOCATION_TIMEOUT` | Function >60s | Use Inngest for long-running jobs |
| `EDGE_FUNCTION_INVOCATION_FAILED` | Edge crash | Check for Node.js-only APIs |
| `MODULE_NOT_FOUND` | Missing dep | Check `package.json` |
| `504 Gateway Timeout` | Upstream timeout | Check external service health |

### Postgres / Neon Errors

| Error | Cause | Fix |
| ----- | ----- | --- |
| `connection refused` | Container stopped (local) or wrong URL | `pnpm db:start` locally; verify `DATABASE_URL` for preview/prod |
| `password authentication failed` | Wrong credentials | Check `DATABASE_URL` in `.env.local` or Vercel env |
| `too many connections` | Pool exhausted | Use pooled `DATABASE_URL`, keep `DATABASE_URL_UNPOOLED` for migrations only |
| `relation does not exist` | Missing migration | `pnpm --filter @repo/database exec prisma migrate deploy` (or `pnpm db:reset` locally) |

---

## Environment Reference

### Service URLs by Environment

| Environment | Frontend | Database |
| ----------- | -------- | -------- |
| Local | `localhost:3500` | Postgres via Docker Compose (port 54322) |
| Preview | `<branch>.vercel.app` | Neon database branch |
| Production | `your-domain.com` | Neon (main) |

### Connection Strings

| Use Case | Variable |
| -------- | -------- |
| App runtime | `DATABASE_URL` (pooled) |
| Migrations | `DATABASE_URL_UNPOOLED` (direct) |
| Local dev | `DATABASE_URL` → `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

---

## Platform-Specific Details

For detailed platform-specific debugging guides, see:

- [Vercel debugging](platform-vercel.md) - Logs, environment variables, API proxy

### Quick Platform Reference

| Platform | Logs | Health Check |
| -------- | ---- | ------------ |
| Vercel | `vercel logs <url>` | Dashboard → Deployments |
| Neon (preview/prod DB) | Neon Console → Logs | Neon Console → Monitoring |
| Local Postgres | `docker compose logs db` | `pnpm db:status` |

---

## Local Development Details

### Local Quick Health Check

```bash
# Check services running
lsof -i :3500  # Frontend
lsof -i :54322 # Local Postgres container

# Test database
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT 1;"
```

### Local Common Fixes

```bash
# Port conflict
lsof -i :<port>
kill -9 <PID>

# Local Postgres container not running
pnpm db:start

# Reset local database (destroys volume, re-applies migrations, re-seeds)
pnpm db:reset

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
Browser → Vercel API Routes [abc123] → Database [abc123] → Response
```

### Searching Traced Logs

```bash
vercel logs <url> | grep "abc123"
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

- [ ] Auth working? (Check session/cookies)
- [ ] Database connected? (Check logs)
- [ ] Timeouts? (Long-running operations should use Inngest)

### Checklist: Database Error

- [ ] `DATABASE_URL` correct?
- [ ] Database running? (`pnpm db:status` for local, Neon Console for preview/prod)
- [ ] Migrations applied? (`prisma migrate status`)
- [ ] Connection pool healthy? (Check active connections)

### Checklist: Preview Environment Issues

- [ ] All services deployed? (`gh pr checks`)
- [ ] Env vars synced? (Check Vercel)
- [ ] Proxy routing correctly? (Network tab)
- [ ] Correct database? (Verify branch DB URL)
- [ ] Redeployed after env changes?

---

## When to Use This Skill

Invoke this skill when:

- App not loading or returning errors
- Database connection issues
- Authentication/session problems
- Preview environment misconfiguration
- Performance investigation
- Tracing requests across services

**Activation keywords**: broken, error, not loading, connection refused, auth failing, preview broken, slow, 404, 500, timeout, migration error, database query, prisma error, database failing, TypeScript error, type error, build error, build failure, runtime error, deployment failed

## Related Skills

- **cicd**: CI/CD pipeline, preview environment setup
- **architecture**: System architecture, request flow
- **better-auth**: Authentication configuration
- **prisma-migrate**: Database migration workflows
- **application-environments**: Environment setup and configuration
- **github-cli**: GitHub operations for debugging PRs
- **stripe-webhooks**: Payment webhook troubleshooting
