# Supabase Platform Debugging

Detailed debugging guide for Supabase database and services.

## Supabase Log Commands

```bash
# Via MCP
mcp__plugin_supabase_supabase__get_logs --project_id <id> --service "postgres"
mcp__plugin_supabase_supabase__get_logs --project_id <id> --service "auth"

# Via Dashboard: Project → Settings → Logs
```

**Log services**: `postgres`, `auth`, `api`, `edge-function`, `storage`, `realtime`

## Supabase Health Checks

```bash
# Performance advisors
mcp__plugin_supabase_supabase__get_advisors --project_id <id> --type "performance"

# Security advisors
mcp__plugin_supabase_supabase__get_advisors --project_id <id> --type "security"

# Database health (local MCP)
mcp__postgres-ro-local-dev__analyze_db_health --health_type "all"
```

## Supabase Useful Queries

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

## Supabase Branch Databases (Preview)

```bash
# List branches
mcp__plugin_supabase_supabase__list_branches --project_id <id>

# Branch DB URL: Dashboard → Database → Branches → Select branch → Settings
```

## Common Supabase Errors

| Error | Cause | Fix |
| ----- | ----- | --- |
| `connection refused` | DB paused/wrong URL | Resume project, check URL |
| `password authentication failed` | Wrong credentials | Check Dashboard |
| `too many connections` | Pool exhausted | Use pooled URL, check leaks |
| `relation does not exist` | Missing migration | Run migrations |
| `permission denied` | RLS blocking | Check RLS policies |
