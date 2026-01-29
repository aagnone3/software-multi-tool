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

## Vercel API Proxy (Preview Only)

Preview environments use `/api/proxy/*` to forward requests to Render (different domains can't share cookies).

```bash
# Verify proxy env vars
vercel env ls preview | grep API_SERVER_URL

# Check requests in browser DevTools → Network → filter "api/proxy"
```

## Common Vercel Errors

| Error | Cause | Fix |
| ----- | ----- | --- |
| `FUNCTION_INVOCATION_TIMEOUT` | Function >60s | Move to Render api-server |
| `EDGE_FUNCTION_INVOCATION_FAILED` | Edge crash | Check for Node.js-only APIs |
| `MODULE_NOT_FOUND` | Missing dep | Check `package.json` |
| `504 Gateway Timeout` | Upstream timeout | Check API server health |
