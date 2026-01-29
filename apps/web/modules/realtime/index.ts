/**
 * Supabase Realtime module for WebSocket-like functionality.
 *
 * Provides channel subscription functions for:
 * - Broadcast (pub/sub messaging)
 * - Presence (who's online tracking)
 *
 * @example
 * ```typescript
 * import {
 *   subscribeToBroadcast,
 *   broadcastMessage,
 *   subscribeToPresence,
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
