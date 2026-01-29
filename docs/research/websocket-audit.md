# WebSocket Audit: api-server

This document audits all WebSocket functionality in `apps/api-server/` and recommends a migration approach to Supabase Realtime.

## Executive Summary

The api-server has a **minimal WebSocket implementation** with basic echo/heartbeat functionality. No production features currently depend on WebSocket communication. The migration to Supabase Realtime is straightforward and low-risk.

## WebSocket Handlers Inventory

### Single Handler: `/ws` Endpoint

**Location:** `apps/api-server/src/lib/server.ts:89-152`

**Implementation Details:**

| Aspect | Description |
| ------ | ----------- |
| Endpoint | `WS /ws` |
| Plugin | `@fastify/websocket` |
| Max Payload | 1MB (`maxPayload: 1048576`) |
| Client Tracking | Enabled |

### Message Types Supported

The WebSocket server handles three message types:

#### 1. Connection Welcome

Sent automatically when a client connects.

```json
{
  "type": "connected",
  "message": "Welcome to API Server WebSocket",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 2. Echo Response

Echoes any valid JSON message back to the client.

```json
// Client sends:
{ "test": "hello", "data": 123 }

// Server responds:
{
  "type": "echo",
  "data": { "test": "hello", "data": 123 },
  "timestamp": "2024-01-15T10:30:01.000Z"
}
```

#### 3. Error Response

Sent when the server receives invalid JSON.

```json
{
  "type": "error",
  "message": "Invalid message format"
}
```

### Heartbeat Mechanism

The server implements a ping/pong heartbeat to detect stale connections.

**Server-initiated ping:** Every 30 seconds to all connected clients.

**Pong handling:** Logged at debug level for monitoring connection health.

### Connection Lifecycle

1. Client connects to `ws://<host>/ws`
2. Server sends welcome message
3. Server starts 30-second heartbeat interval
4. Client sends messages, server echoes them back
5. On disconnect, heartbeat interval is cleared
6. Error events also clear the heartbeat interval

## Client Code Analysis

### Frontend WebSocket Usage

No active client connections were found. A search of `apps/web/` reveals no WebSocket client implementations. The codebase does not contain:

- `new WebSocket()` instantiations
- `onmessage` or `onopen` event handlers
- Any imports from WebSocket-related packages

### Documentation References

The only WebSocket client code exists in documentation:

**`apps/api-server/README.md`:** Example code showing how to connect (not implemented in production).

**`.claude/skills/render/SKILL.md`:** Integration examples referencing potential future use.

## Purpose and Usage Assessment

Based on the code analysis, the WebSocket functionality serves as:

| Purpose | Current State |
| ------- | ------------- |
| Development Testing | Echo server for testing WebSocket connectivity |
| Infrastructure Validation | Heartbeat confirms connection stability |
| Future Foundation | Placeholder for planned features (Slack/Discord bots) |

**Conclusion:** The WebSocket implementation is **not used in production**. It exists as infrastructure scaffolding for planned features that were never implemented.

## Supabase Realtime Migration Approach

### Why Migrate?

Eliminating the api-server means WebSocket functionality must move to a managed service. Supabase Realtime is already integrated for storage and provides:

- Native Next.js/Vercel compatibility
- No additional infrastructure to manage
- Built-in scaling and connection management
- Channel-based pub/sub architecture

### Migration Strategy

Since no production features use WebSockets, the migration is essentially a **clean replacement** rather than a port.

#### Phase 1: Delete Dead Code

Remove the unused WebSocket infrastructure from api-server.

**Files to delete/modify:**

- `apps/api-server/src/lib/server.ts`: Remove WebSocket plugin registration and `/ws` endpoint
- `apps/api-server/src/lib/websocket.test.ts`: Delete entire file (tests skipped anyway)
- `apps/api-server/README.md`: Remove WebSocket documentation
- `.claude/skills/render/SKILL.md`: Update integration examples

#### Phase 2: Implement Supabase Realtime (When Needed)

When WebSocket functionality is actually required, implement using Supabase Realtime channels.

**Recommended file structure:**

```text
apps/web/modules/realtime/
  client.ts        # Supabase client with realtime config
  channels/
    index.ts       # Channel exports
    types.ts       # TypeScript interfaces for messages
```

**Example implementation:**

```typescript
// apps/web/modules/realtime/client.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function subscribeToChannel(
  channelName: string,
  onMessage: (payload: unknown) => void
) {
  const channel = supabase
    .channel(channelName)
    .on("broadcast", { event: "message" }, ({ payload }) => {
      onMessage(payload);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function broadcastMessage(
  channelName: string,
  event: string,
  payload: unknown
) {
  return supabase.channel(channelName).send({
    type: "broadcast",
    event,
    payload,
  });
}
```

#### Phase 3: Feature Implementation Examples

When implementing actual features, use appropriate Supabase Realtime patterns.

**Presence (who's online):**

```typescript
const channel = supabase.channel("room-1", {
  config: { presence: { key: "user-id" } },
});

channel
  .on("presence", { event: "sync" }, () => {
    const state = channel.presenceState();
    console.log("Online users:", Object.keys(state));
  })
  .subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({ user_id: "user-1", online_at: new Date() });
    }
  });
```

**Database changes (realtime triggers):**

```typescript
supabase
  .channel("db-changes")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "notifications" },
    (payload) => {
      console.log("Database change:", payload);
    }
  )
  .subscribe();
```

### Environment Variables

No new environment variables needed. Supabase credentials already exist:

| Variable | Already Configured |
| -------- | ------------------ |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (in `.env.local.example`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server-side) |

### Testing Strategy

Since no production features depend on WebSockets, testing focuses on the new Supabase Realtime implementation when it's built.

**Recommended test approach:**

1. Unit tests with mocked Supabase client
2. Integration tests against Supabase local (via `supabase start`)
3. E2E tests verifying real-time updates in browser

### Cost Implications

Supabase Realtime is included in the free tier with limits.

**Free tier limits:**

| Metric | Limit |
| ------ | ----- |
| Concurrent connections | 200 |
| Messages per second | 100 |
| Payload size | 250KB |

**Growth considerations:**

- Pro plan ($25/mo) increases to 500 concurrent connections
- Scale beyond that requires custom pricing

For current usage (zero WebSocket features), free tier is more than sufficient.

## Recommendations

### Immediate Actions

1. **Do not migrate WebSocket code** - Delete it instead (no features depend on it)
2. **Remove api-server WebSocket dependencies** during the broader api-server deletion (US-016)
3. **Keep Supabase Realtime in mind** for future feature planning

### Future Considerations

When WebSocket-like features are needed, evaluate whether Supabase Realtime is the right choice.

**Good fit for:**

- User presence indicators
- Live activity feeds
- Collaborative editing
- Real-time notifications

**May need alternatives for:**

- High-frequency trading data (consider dedicated WebSocket service)
- Gaming (consider purpose-built solutions like Ably, Pusher)
- Video/audio streaming (use dedicated media servers)

## Appendix: Test Coverage

The WebSocket test file (`apps/api-server/src/lib/websocket.test.ts`) is **skipped in CI** with the comment:

> Skip WebSocket tests in CI - requires running server instance

Tests cover:

- Connection establishment
- Welcome message format
- Echo functionality
- Invalid JSON handling
- Ping/pong heartbeat
- Multiple concurrent connections

Since the feature is unused and will be deleted, these tests will be removed along with the implementation.
