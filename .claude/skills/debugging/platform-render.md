# Render Platform Debugging

Detailed debugging guide for Render api-server deployments.

## Render Log Commands

```bash
# List services
pnpm --filter @repo/scripts render services list

# List deploys
pnpm --filter @repo/scripts render deploys list --service <service-id>

# Dashboard: Service → Logs tab → "Live Tail" for streaming
```

## Render Environment Variables

```bash
pnpm --filter @repo/scripts render env list --service <service-id>
pnpm --filter @repo/scripts render env get --service <service-id> --key DATABASE_URL
pnpm --filter @repo/scripts render env set --service <service-id> --key CORS_ORIGIN --value "https://..."
```

## Render Health Check

```bash
curl https://<service-url>/health
# Expected: OK
```

## Common Render Errors

| Error | Cause | Fix |
| ----- | ----- | --- |
| `Build failed` | Compile error | Check build logs |
| `Health check failed` | App not responding | Verify `HOST=0.0.0.0` |
| `502 Bad Gateway` | App crashed | Check runtime logs |
| `CORS error` | Origin mismatch | Update `CORS_ORIGIN` |
