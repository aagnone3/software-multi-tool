/**
 * Supabase Realtime module for WebSocket-like functionality.
 *
 * Provides channel subscription functions for:
 * - Broadcast (pub/sub messaging)
 * - Presence (who's online tracking)
 * - Echo/heartbeat (connection testing, replaces WebSocket echo server)
 *
 * @example
 * ```typescript
 * import {
 *   subscribeToBroadcast,
 *   broadcastMessage,
 *   subscribeToPresence,
 *   useRealtimeEcho,
 * } from "@realtime";
 * ```
 *
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

// Client functions
export {
	broadcastMessage,
	getPresenceState,
	removeAllChannels,
	removeChannel,
	subscribeToBroadcast,
	subscribeToPresence,
} from "./client";
export type {
	EchoMessage,
	EchoSubscriptionOptions,
	HeartbeatOptions,
	HeartbeatSubscription,
	SendEchoOptions,
} from "./echo";
// Echo/heartbeat functions (replaces WebSocket echo server)
export {
	sendEchoMessage,
	startHeartbeat,
	subscribeToEcho,
} from "./echo";
export type {
	UseRealtimeBroadcastResult,
	UseRealtimeEchoOptions,
	UseRealtimeEchoResult,
} from "./hooks";
// React hooks
export { useRealtimeBroadcast, useRealtimeEcho } from "./hooks";
// Types
export type {
	BroadcastHandler,
	BroadcastMessageOptions,
	BroadcastSubscriptionOptions,
	ChannelSubscription,
	PresenceHandler,
	PresenceJoinHandler,
	PresenceLeaveHandler,
	PresenceSubscription,
	PresenceSubscriptionOptions,
} from "./types";
