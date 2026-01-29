# Async Jobs Troubleshooting

## Jobs Not Being Processed

1. **Check api-server is running**:
   - Run `pnpm dev` at the project root (starts both web and api-server)
   - Or run `pnpm --filter api-server dev` separately
   - Verify `USE_PGBOSS_WORKERS=true` is set
   - Check logs for "pg-boss started successfully"
   - **Note**: The api-server auto-switches to Node.js v22 if needed (v24+ is incompatible with Zod v4)

2. **Check pg-boss queue**:

   ```sql
   SELECT * FROM pgboss.job WHERE name = 'my-tool' AND state = 'created';
   ```

3. **Check ToolJob status**:

   ```sql
   SELECT * FROM tool_job WHERE "toolSlug" = 'my-tool' AND status = 'PENDING';
   ```

## Stuck Jobs

Jobs stuck in PROCESSING status for > 30 minutes:

1. **Cron will mark them failed** automatically
2. **Check reconciliation ran**:

   ```sql
   -- Jobs that should have been reconciled
   SELECT tj.id, tj.status, tj."pgBossJobId", pj.state
   FROM tool_job tj
   LEFT JOIN pgboss.job pj ON tj."pgBossJobId" = pj.id::text
   WHERE tj.status = 'PROCESSING';
   ```

3. **Manual fix**:

   ```sql
   UPDATE tool_job
   SET status = 'FAILED', error = 'Manually marked as failed'
   WHERE status = 'PROCESSING'
   AND "startedAt" < NOW() - INTERVAL '30 minutes';
   ```

## State Divergence

If pg-boss shows job as completed but ToolJob is still PROCESSING:

1. **Check if onExpire handler ran** - look for logs with `[onExpire:]`
2. **Force reconciliation**:

   ```typescript
   import { reconcileJobStates } from "@repo/api/modules/jobs/lib/job-runner";
   await reconcileJobStates();
   ```

3. **Check archive table** - completed jobs may have been archived:

   ```sql
   SELECT * FROM pgboss.archive WHERE id = 'your-job-uuid';
   ```

## pg-boss Queue Issues

If pg-boss queue is corrupted or jobs are stuck:

```sql
-- Check queue status
SELECT name, COUNT(*), state
FROM pgboss.job
GROUP BY name, state;

-- Archive stuck jobs
UPDATE pgboss.job
SET state = 'cancelled'
WHERE state = 'active'
AND started_on < NOW() - INTERVAL '1 hour';
```

## Preview Environment Jobs Not Working

**Symptom:** Jobs submitted in preview environment return success but never appear in the database or get processed.

**Common causes:**

1. **Wrong database**: Render service pointing to wrong Supabase preview branch
2. **Wrong Render service**: Vercel proxy forwarding to a different PR's Render
3. **Stale deployment**: Vercel env vars changed but deployment not redeployed

**Diagnosis checklist:**

1. **Verify Render's DATABASE_URL points to correct Supabase branch:**

   ```bash
   pnpm --filter @repo/scripts render env list --service <service-id> | grep DATABASE
   ```

   - The URL should contain the correct Supabase preview project_ref

2. **Verify Vercel proxy is using correct Render URL:**

   ```bash
   vercel env ls preview | grep API_SERVER
   ```

   - Look for branch-specific entry matching your PR

3. **Check which database the job landed in:**

   ```sql
   -- Query each Supabase preview branch to find the job
   SELECT id, status, "createdAt" FROM tool_job WHERE id = '<job-id>';
   ```

**Resolution:**

1. **Re-run preview-sync** to ensure all env vars are correctly set:

   ```bash
   node tooling/scripts/src/preview-sync/index.mjs sync \
     --branch <branch-name> \
     --pr <pr-number>
   ```

2. **Trigger Vercel redeploy** to pick up new env vars:

   ```bash
   git commit --allow-empty -m "chore: trigger redeploy" && git push
   ```

3. **Verify all three services are aligned:**
   - Supabase preview branch → correct DATABASE_URL on Render
   - Render preview URL → correct NEXT_PUBLIC_API_SERVER_URL on Vercel
   - All env vars picked up by current deployment

See also: `api-proxy` skill for detailed proxy troubleshooting.

## Anonymous Job Ownership

Jobs can be created by anonymous users (not logged in). To verify ownership when polling:

### How It Works

1. **Job Creation**: Frontend generates a `sessionId` and stores in localStorage
2. **Job Create Request**: `sessionId` is passed in the request body
3. **Job Polling**: `x-session-id` header must be included for ownership verification

### Frontend Implementation

```typescript
// apps/web/modules/shared/lib/orpc-client.ts
const link = new RPCLink({
  url: getOrpcUrl(),
  headers: async () => {
    if (typeof window !== "undefined") {
      // Include x-session-id for anonymous job ownership
      const sessionId = localStorage.getItem("news-analyzer-session-id");
      if (sessionId) {
        return { "x-session-id": sessionId };
      }
      return {};
    }
    // Server-side: forward all headers
    const { headers } = await import("next/headers");
    return Object.fromEntries(await headers());
  },
});
```

### Backend Verification

```typescript
// packages/api/modules/jobs/procedures/get-job.ts
const requestSessionId = context.headers.get("x-session-id");

const isOwner =
  (userId && job.userId === userId) ||  // Authenticated user owns job
  (requestSessionId && job.sessionId === requestSessionId);  // Anonymous session match

if (!isOwner) {
  throw new ORPCError("FORBIDDEN", {
    message: "You do not have access to this job",
  });
}
```

**WARNING**: If `x-session-id` header is missing, anonymous users get 403 Forbidden
when polling their job status.

## Seed Data Warning

**CRITICAL**: Seeded jobs in `supabase/seed.sql` must ONLY use terminal states:

- `COMPLETED`
- `FAILED`

**Never seed PENDING or PROCESSING jobs** because:

1. They are not submitted to pg-boss queue
2. Workers will never process them
3. Frontend polling will hang indefinitely

```sql
-- CORRECT: Terminal state
INSERT INTO tool_job (id, status, ...) VALUES ('preview_job_001', 'COMPLETED', ...);

-- WRONG: Non-terminal state (will appear stuck)
INSERT INTO tool_job (id, status, ...) VALUES ('preview_job_002', 'PENDING', ...);
```
