---
name: api-proxy
description: Use this skill when working with preview environment authentication, cross-origin cookie issues, or API proxying in preview deployments. Covers the Next.js API proxy route, environment detection, and oRPC client configuration.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# API Proxy Skill

This skill provides guidance for the API proxy system used in preview environments to enable session-based authentication across different domains.

## Quick Reference

| Component                | Location                                    |
| ------------------------ | ------------------------------------------- |
| Proxy Route Handler      | `apps/web/app/api/proxy/[...path]/route.ts` |
| Proxy Utilities          | `apps/web/app/api/proxy/lib.ts`             |
| Environment Detection    | `packages/utils/lib/api-url.ts`             |
| oRPC Client              | `apps/web/modules/shared/lib/orpc-client.ts`|
| Proxy Tests              | `apps/web/app/api/proxy/lib.test.ts`        |
| Environment Tests        | `packages/utils/lib/api-url.test.ts`        |

## Problem Statement

### Why Do We Need a Proxy?

**Production** (same root domain):

- Web: `app.yourdomain.com`
- API: `api.yourdomain.com`
- Cookies work with `domain=.yourdomain.com`

**Preview environments** (different domains):

- Vercel preview: `feature-abc.vercel.app`
- Render preview: `feature-abc-api.onrender.com`
- Cookies **don't work** (different TLDs, no shared domain)

This breaks session-based authentication (Better Auth) in preview environments because browsers won't send cookies cross-origin.

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION ENVIRONMENT                        │
│                                                                  │
│  Browser ──────────────────────────────> api.yourdomain.com      │
│           (Direct requests, cookies work)                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    PREVIEW ENVIRONMENT                           │
│                                                                  │
│  Browser ──────> Vercel Preview ──────> Render Preview           │
│                  /api/proxy/*           /api/*                   │
│           (Same-origin)          (Proxy forwards cookies)        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Next.js API Proxy Route                     │    │
│  │                                                          │    │
│  │  1. Browser calls /api/proxy/rpc/users/getProfile       │    │
│  │  2. Proxy receives request (cookies included!)          │    │
│  │  3. Proxy forwards to Render: /api/rpc/users/getProfile │    │
│  │  4. Render processes with session from forwarded cookie │    │
│  │  5. Proxy returns response to browser                   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Environment Variables

| Variable                     | Required | Where Used   | Purpose                              |
| ---------------------------- | -------- | ------------ | ------------------------------------ |
| `API_SERVER_URL`             | Preview  | Server-side  | Target api-server URL for proxy      |
| `NEXT_PUBLIC_API_SERVER_URL` | Preview  | Client-side  | Fallback API URL (SSR detection)     |
| `NEXT_PUBLIC_VERCEL_ENV`     | Auto     | Client-side  | Environment detection (preview/prod) |

### Configuration Examples

**Local Development** (`.env.local`):

```env
# Not needed - uses localhost:3501 fallback
```

**Preview Environment** (auto-synced by CI):

```env
API_SERVER_URL=https://feature-abc-api.onrender.com
NEXT_PUBLIC_API_SERVER_URL=https://feature-abc-api.onrender.com
NEXT_PUBLIC_VERCEL_ENV=preview
```

**Production**:

```env
# No proxy needed - direct browser-to-API communication
NEXT_PUBLIC_VERCEL_ENV=production
```

## Proxy Route Details

### Supported HTTP Methods

The proxy handles all standard HTTP methods:

- `GET` - Read operations
- `POST` - Create operations
- `PUT` - Full update operations
- `DELETE` - Delete operations
- `PATCH` - Partial update operations
- `OPTIONS` - CORS preflight

### Request Forwarding

The proxy forwards:

- **URL path**: `/api/proxy/rpc/users/getProfile` → `/api/rpc/users/getProfile`
- **Query parameters**: Preserved exactly
- **Request body**: Streamed for file uploads
- **Headers**: All except hop-by-hop headers
- **Cookies**: Forwarded via cookie header

### Hop-by-Hop Headers (Filtered)

These headers are NOT forwarded (HTTP/1.1 spec):

- `connection`
- `keep-alive`
- `proxy-authenticate`
- `proxy-authorization`
- `te`
- `trailers`
- `transfer-encoding`
- `upgrade`
- `host` (replaced with target host)

### X-Forwarded Headers (Added)

The proxy adds these headers for proper client identification:

- `x-forwarded-host`: Original request host
- `x-forwarded-proto`: Always `https`

### Streaming Response Support

The proxy detects and handles SSE (Server-Sent Events):

```typescript
// Detection: content-type includes "text/event-stream"
if (isStreamingResponse(response.headers)) {
  // Set appropriate headers for SSE passthrough
  responseHeaders.set("content-type", "text/event-stream");
  responseHeaders.set("cache-control", "no-cache");
  responseHeaders.set("connection", "keep-alive");
}
```

### File Upload Support

File uploads work via request body streaming:

```typescript
// Request body is streamed directly (not buffered)
fetchOptions.body = request.body;
// @ts-expect-error - duplex required for Node.js
fetchOptions.duplex = "half";
```

## Environment Detection Utilities

### `isPreviewEnvironment()`

Returns `true` when running in Vercel preview environment:

```typescript
export function isPreviewEnvironment(): boolean {
  return process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";
}
```

### `shouldUseProxy(isClientSide)`

Determines if the proxy should be used:

```typescript
export function shouldUseProxy(isClientSide: boolean): boolean {
  // Only use proxy for client-side requests in preview
  return isClientSide && isPreviewEnvironment();
}
```

### `getApiBaseUrl()`

Returns the appropriate API base URL:

| Environment     | Client-Side       | Server-Side                   |
| --------------- | ----------------- | ----------------------------- |
| Preview         | `/api/proxy`      | `API_SERVER_URL/api`          |
| Production      | `{baseUrl}/api`   | `{baseUrl}/api`               |
| Local           | `{baseUrl}/api`   | `{baseUrl}/api`               |

### `getOrpcUrl()`

Returns the appropriate oRPC endpoint URL:

| Environment | Client-Side         | Server-Side                |
| ----------- | ------------------- | -------------------------- |
| Preview     | `/api/proxy/rpc`    | `API_SERVER_URL/api/rpc`   |
| Production  | `{baseUrl}/api/rpc` | `{baseUrl}/api/rpc`        |
| Local       | `{baseUrl}/api/rpc` | `{baseUrl}/api/rpc`        |

## oRPC Client Integration

The oRPC client (`apps/web/modules/shared/lib/orpc-client.ts`) uses `getOrpcUrl()`:

```typescript
import { getOrpcUrl } from "@repo/utils";

const link = new RPCLink({
  url: getOrpcUrl(),
  // ... other options
});
```

This ensures:

- **Production**: Direct API calls (no proxy overhead)
- **Preview**: Calls through proxy (session cookies work)

## Testing

### Unit Tests

Run proxy utility tests:

```bash
pnpm --filter web test app/api/proxy/lib.test.ts
```

Run environment detection tests:

```bash
pnpm --filter @repo/utils test lib/api-url.test.ts
```

### Manual Testing in Preview

1. Create a PR to trigger preview deployment
2. Wait for CI to sync environment variables
3. Open Vercel preview URL
4. Sign in and verify session persists
5. Make authenticated API calls (should work through proxy)

### Debugging

Enable debug logging in the proxy:

```typescript
// apps/web/app/api/proxy/[...path]/route.ts
console.log("[API Proxy] Forwarding to:", targetUrl.toString());
console.log("[API Proxy] Request headers:", Object.keys(forwardHeaders));
```

Check browser Network tab:

- Requests to `/api/proxy/*` should return 200
- Response should contain expected data
- Cookies should be present in request headers

## Error Handling

### 502 Bad Gateway

Returned when the proxy cannot reach the api-server:

```json
{ "error": "Failed to connect to API server" }
```

**Common causes:**

- `API_SERVER_URL` not set or incorrect
- Render preview not yet deployed
- Network connectivity issues

**Resolution:**

1. Check environment variables are synced
2. Verify Render preview is running
3. Check Render logs for errors

## Workflow Integration

### CI/CD Pipeline

The `sync-preview-environments` workflow automatically:

1. Detects PR and waits for all services
2. Syncs `API_SERVER_URL` from Render preview URL
3. Triggers Vercel redeploy if values changed

### Adding New Proxy Features

1. Add utility function to `apps/web/app/api/proxy/lib.ts`
2. Write tests in `apps/web/app/api/proxy/lib.test.ts`
3. Update route handler if needed
4. Update this skill documentation

## Related Skills

- **cicd**: Preview environment synchronization
- **architecture**: Overall system architecture
- **better-auth**: Authentication system details
- **render**: Render deployment configuration

## Troubleshooting

### Session Not Persisting in Preview

1. **Check proxy is being used:**
   - Open browser DevTools → Network
   - API calls should go to `/api/proxy/*`

2. **Verify environment variables:**
   - Check `NEXT_PUBLIC_VERCEL_ENV` is `preview`
   - Check `API_SERVER_URL` points to Render preview

3. **Check cookie is forwarded:**
   - Request headers should include `cookie`
   - Response should include `set-cookie` (on login)

### Streaming Not Working

1. **Check content-type detection:**
   - Response must have `content-type: text/event-stream`

2. **Check headers are set:**
   - `cache-control: no-cache`
   - `connection: keep-alive`

### File Upload Failing

1. **Check request streaming:**
   - Body should be `ReadableStream`
   - `duplex: "half"` must be set

2. **Check content-type:**
   - Should be `multipart/form-data`
   - Boundary must be preserved
