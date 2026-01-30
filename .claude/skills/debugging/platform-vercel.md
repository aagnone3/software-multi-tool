# Vercel Platform Debugging

Detailed debugging guide for Vercel deployments.

## Vercel Log Commands

```bash
# Runtime logs
vercel logs <deployment-url>
vercel logs <deployment-url> --follow
vercel logs <deployment-url> --filter "api/proxy"

# Build logs
vercel inspect <deployment-url>
# Or: Dashboard → Deployments → Build Logs
```

## Vercel Environment Variables

```bash
pnpm web:env:list                    # List all
pnpm web:env:list --target preview   # Preview only
pnpm web:env:pull                    # Pull to local
vercel env ls | grep DATABASE_URL    # Check specific var
```

**Note**: Vercel bakes env vars at build time. Changes require redeploy.

## Common Vercel Errors

| Error | Cause | Fix |
| ----- | ----- | --- |
| `FUNCTION_INVOCATION_TIMEOUT` | Function >60s | Use Inngest for long-running jobs |
| `EDGE_FUNCTION_INVOCATION_FAILED` | Edge crash | Check for Node.js-only APIs |
| `MODULE_NOT_FOUND` | Missing dep | Check `package.json` |
| `504 Gateway Timeout` | Upstream timeout | Check external service health |
