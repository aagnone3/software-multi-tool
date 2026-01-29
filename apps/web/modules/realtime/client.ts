"use client";

/**
 * Supabase Realtime client for WebSocket-like functionality.
 *
 * This module provides typed channel subscription functions for:
 * - Broadcast messages (pub/sub between clients)
 * - Presence (who's online tracking)
 * - Database changes (postgres_changes) - use sparingly
 *
 * @example
 * ```typescript
 * import { subscribeToBroadcast, broadcastMessage } from "@realtime";
 *
 * // Subscribe to messages
 * const { unsubscribe } = subscribeToBroadcast({
 *   channelName: "room-1",
 *   event: "message",
 *   onMessage: (payload) => console.log("Received:", payload),
 * });
 *
 * // Send a message
 * await broadcastMessage({
 *   channelName: "room-1",
 *   event: "message",
 *   payload: { text: "Hello!" },
 * });
 *
 * // Clean up
 * unsubscribe();
 * ```
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
	BroadcastMessageOptions,
	BroadcastSubscriptionOptions,
	ChannelSubscription,
	PresenceSubscription,
	PresenceSubscriptionOptions,
} from "./types";

// ============================================================================
// Supabase Client Singleton
// ============================================================================

let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create the Supabase client for realtime subscriptions.
 * Uses browser-safe public credentials (anon key).
 *
 * @throws Error if NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set
 */
function getSupabaseClient(): SupabaseClient {
	if (supabaseClient) {
		return supabaseClient;
	}

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl) {
		throw new Error(
			"Missing environment variable NEXT_PUBLIC_SUPABASE_URL. " +
				"Set this in your .env.local file for realtime functionality.",
		);
	}

	if (!supabaseAnonKey) {
		throw new Error(
			"Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
				"Set this in your .env.local file for realtime functionality.",
		);
	}

	supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
		realtime: {
			params: {
				eventsPerSecond: 10,
			},
		},
	});

	return supabaseClient;
}

// ============================================================================
// Broadcast Channel Functions
// ============================================================================

/**
 * Subscribe to broadcast messages on a channel.
 *
 * Broadcast is the simplest form of realtime - pure pub/sub between clients.
 * Messages are not persisted and only received by currently connected clients.
 *
 * @example
 * ```typescript
 * const { unsubscribe } = subscribeToBroadcast({
 *   channelName: "chat-room-123",
 *   event: "new-message",
 *   onMessage: (payload) => {
 *     console.log("New message:", payload);
 *   },
 * });
 *
 * // Later, clean up
 * unsubscribe();
 * ```
 */
export function subscribeToBroadcast<T = unknown>(
	options: BroadcastSubscriptionOptions<T>,
): ChannelSubscription {
	const client = getSupabaseClient();
	const { channelName, event, onMessage } = options;

	const channel = client
		.channel(channelName)
		.on("broadcast", { event }, ({ payload }) => {
			onMessage(payload as T);
		})
		.subscribe();

	return {
		unsubscribe: () => {
			client.removeChannel(channel);
		},
	};
}

/**
 * Send a broadcast message to a channel.
 *
 * Note: The channel must already have at least one subscriber for messages
 * to be received. This is a fire-and-forget operation.
 *
 * @example
 * ```typescript
 * await broadcastMessage({
 *   channelName: "chat-room-123",
 *   event: "new-message",
 *   payload: { text: "Hello everyone!", userId: "user-1" },
 * });
 * ```
 */
export async function broadcastMessage<T = unknown>(
	options: BroadcastMessageOptions<T>,
): Promise<void> {
	const client = getSupabaseClient();
	const { channelName, event, payload } = options;

	// Get or create channel (subscribe briefly to send)
	const channel = client.channel(channelName);

	await channel.subscribe((status) => {
		if (status === "SUBSCRIBED") {
			channel.send({
				type: "broadcast",
				event,
				payload,
			});
		}
	});

	// Clean up after a brief delay to ensure message is sent
	setTimeout(() => {
		client.removeChannel(channel);
	}, 100);
}

// ============================================================================
// Presence Channel Functions
// ============================================================================

/**
 * Subscribe to presence on a channel.
 *
 * Presence tracks which users are currently connected to a channel.
 * Useful for "who's online" indicators, typing indicators, etc.
 *
 * @example
 * ```typescript
 * const { track, untrack, unsubscribe } = subscribeToPresence({
 *   channelName: "document-123",
 *   presenceKey: currentUserId,
 *   onSync: (state) => {
 *     const onlineUsers = Object.keys(state);
 *     console.log("Online users:", onlineUsers);
 *   },
 *   onJoin: (key, current, newPresences) => {
 *     console.log(`${key} joined`);
 *   },
 *   onLeave: (key, current, leftPresences) => {
 *     console.log(`${key} left`);
 *   },
 * });
 *
 * // Track your presence state
 * await track({ status: "active", cursor: { x: 100, y: 200 } });
 *
 * // Update presence (e.g., cursor moved)
 * await track({ status: "active", cursor: { x: 150, y: 250 } });
 *
 * // Clean up when done
 * await untrack();
 * unsubscribe();
 * ```
 */
export function subscribeToPresence<T extends Record<string, unknown>>(
	options: PresenceSubscriptionOptions<T>,
): PresenceSubscription {
	const client = getSupabaseClient();
	const { channelName, presenceKey, onSync, onJoin, onLeave } = options;

	const channel = client.channel(channelName, {
		config: {
			presence: {
				key: presenceKey,
			},
		},
	});

	if (onSync) {
		channel.on("presence", { event: "sync" }, () => {
			const state = channel.presenceState<T>();
			onSync(state);
		});
	}

	if (onJoin) {
		channel.on(
			"presence",
			{ event: "join" },
			({ key, currentPresences, newPresences }) => {
				onJoin(
					key,
					currentPresences as unknown as T[],
					newPresences as unknown as T[],
				);
			},
		);
	}

	if (onLeave) {
		channel.on(
			"presence",
			{ event: "leave" },
			({ key, currentPresences, leftPresences }) => {
				onLeave(
					key,
					currentPresences as unknown as T[],
					leftPresences as unknown as T[],
				);
			},
		);
	}

	channel.subscribe();

	return {
		track: async <S extends Record<string, unknown>>(state: S) => {
			await channel.track(state);
		},
		untrack: async () => {
			await channel.untrack();
		},
		unsubscribe: () => {
			client.removeChannel(channel);
		},
	};
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the current presence state for a channel.
 *
 * Returns the last known state - you must be subscribed to the channel
 * for this to return meaningful data.
 */
export function getPresenceState<T extends Record<string, unknown>>(
	channelName: string,
): Record<string, T[]> {
	const client = getSupabaseClient();
	const channel = client.channel(channelName);
	return channel.presenceState<T>();
}

/**
 * Remove all subscriptions for a specific channel.
 */
export function removeChannel(channelName: string): void {
	const client = getSupabaseClient();
	const channels = client.getChannels();
	const channel = channels.find((c) => c.topic === `realtime:${channelName}`);
	if (channel) {
		client.removeChannel(channel);
	}
}

/**
 * Remove all realtime channel subscriptions.
 * Call this when unmounting the app or during cleanup.
 */
export function removeAllChannels(): void {
	const client = getSupabaseClient();
	client.removeAllChannels();
}
