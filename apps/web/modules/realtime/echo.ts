"use client";

/**
 * Echo/heartbeat functionality via Supabase Realtime broadcast.
 *
 * This module provides echo and heartbeat patterns that replace the
 * api-server WebSocket functionality. Use these for:
 * - Testing realtime connectivity
 * - Keeping connections alive with heartbeat
 * - Simple message round-trips
 *
 * @example
 * ```typescript
 * import { subscribeToEcho, sendEchoMessage, startHeartbeat } from "@realtime";
 *
 * // Subscribe to echoed messages
 * const { unsubscribe } = subscribeToEcho({
 *   channelName: "my-channel",
 *   onEcho: (message) => console.log("Echo received:", message),
 * });
 *
 * // Send a message that will be echoed back
 * await sendEchoMessage({
 *   channelName: "my-channel",
 *   payload: { test: "hello" },
 * });
 *
 * // Start heartbeat (auto-ping every 30s)
 * const { stop } = startHeartbeat({
 *   channelName: "my-channel",
 *   intervalMs: 30000,
 *   onPong: () => console.log("Connection alive"),
 * });
 * ```
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ChannelSubscription } from "./types";

// Event names for echo/heartbeat
const ECHO_EVENT = "echo";
const HEARTBEAT_EVENT = "heartbeat";

// ============================================================================
// Supabase Client (shared with main client.ts)
// ============================================================================

let supabaseClient: SupabaseClient | null = null;

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
// Types
// ============================================================================

/**
 * Message structure for echo responses.
 */
export interface EchoMessage<T = unknown> {
	/** Type identifier, always "echo" */
	type: "echo";
	/** The original data that was sent */
	data: T;
	/** Server timestamp when message was echoed */
	timestamp: string;
}

/**
 * Options for subscribing to echo messages.
 */
export interface EchoSubscriptionOptions<T = unknown> {
	/** Channel name to subscribe to */
	channelName: string;
	/** Handler called when an echo message is received */
	onEcho: (message: EchoMessage<T>) => void;
	/** Optional handler for connection status changes */
	onStatusChange?: (
		status: "SUBSCRIBED" | "CLOSED" | "CHANNEL_ERROR",
	) => void;
}

/**
 * Options for sending an echo message.
 */
export interface SendEchoOptions<T = unknown> {
	/** Channel name to send to */
	channelName: string;
	/** Payload to echo back */
	payload: T;
}

/**
 * Options for heartbeat monitoring.
 */
export interface HeartbeatOptions {
	/** Channel name for heartbeat */
	channelName: string;
	/** Interval between heartbeats in milliseconds (default: 30000) */
	intervalMs?: number;
	/** Handler called when heartbeat is acknowledged */
	onPong?: () => void;
	/** Handler called if heartbeat times out */
	onTimeout?: () => void;
	/** Timeout in milliseconds to wait for pong (default: 5000) */
	timeoutMs?: number;
}

/**
 * Result of starting heartbeat monitoring.
 */
export interface HeartbeatSubscription {
	/** Stop the heartbeat monitoring */
	stop: () => void;
}

// ============================================================================
// Echo Functions
// ============================================================================

/**
 * Subscribe to echo messages on a channel.
 *
 * Echo messages are broadcast messages that have been round-tripped through
 * the channel. This is useful for testing connectivity and message delivery.
 *
 * @example
 * ```typescript
 * const { unsubscribe } = subscribeToEcho({
 *   channelName: "test-channel",
 *   onEcho: (message) => {
 *     console.log("Received echo:", message.data);
 *     console.log("Timestamp:", message.timestamp);
 *   },
 * });
 *
 * // Later, clean up
 * unsubscribe();
 * ```
 */
export function subscribeToEcho<T = unknown>(
	options: EchoSubscriptionOptions<T>,
): ChannelSubscription {
	const client = getSupabaseClient();
	const { channelName, onEcho, onStatusChange } = options;

	const channel = client
		.channel(channelName)
		.on("broadcast", { event: ECHO_EVENT }, ({ payload }) => {
			onEcho(payload as EchoMessage<T>);
		})
		.subscribe((status) => {
			if (onStatusChange) {
				onStatusChange(
					status as "SUBSCRIBED" | "CLOSED" | "CHANNEL_ERROR",
				);
			}
		});

	return {
		unsubscribe: () => {
			client.removeChannel(channel);
		},
	};
}

/**
 * Send a message that will be echoed back to all subscribers on the channel.
 *
 * The message is broadcast with type "echo", including the original payload
 * and a timestamp. All subscribers to the channel will receive the echoed message.
 *
 * @example
 * ```typescript
 * await sendEchoMessage({
 *   channelName: "test-channel",
 *   payload: { test: "hello", data: 123 },
 * });
 * // All subscribers will receive:
 * // { type: "echo", data: { test: "hello", data: 123 }, timestamp: "..." }
 * ```
 */
export async function sendEchoMessage<T = unknown>(
	options: SendEchoOptions<T>,
): Promise<void> {
	const client = getSupabaseClient();
	const { channelName, payload } = options;

	const echoMessage: EchoMessage<T> = {
		type: "echo",
		data: payload,
		timestamp: new Date().toISOString(),
	};

	const channel = client.channel(channelName);

	return new Promise((resolve) => {
		channel.subscribe((status) => {
			if (status === "SUBSCRIBED") {
				channel.send({
					type: "broadcast",
					event: ECHO_EVENT,
					payload: echoMessage,
				});
				// Clean up after a brief delay to ensure message is sent
				setTimeout(() => {
					client.removeChannel(channel);
					resolve();
				}, 100);
			}
		});
	});
}

// ============================================================================
// Heartbeat Functions
// ============================================================================

/**
 * Start heartbeat monitoring on a channel.
 *
 * Heartbeat sends periodic ping messages and listens for pong responses.
 * This replaces the WebSocket server's 30-second ping interval for detecting
 * stale connections.
 *
 * Note: Supabase Realtime handles connection health internally, so this is
 * primarily useful for application-level "are you there" checks.
 *
 * @example
 * ```typescript
 * const { stop } = startHeartbeat({
 *   channelName: "my-channel",
 *   intervalMs: 30000, // 30 seconds
 *   onPong: () => console.log("Connection is alive"),
 *   onTimeout: () => console.log("Connection may be stale"),
 * });
 *
 * // Stop heartbeat when done
 * stop();
 * ```
 */
export function startHeartbeat(
	options: HeartbeatOptions,
): HeartbeatSubscription {
	const client = getSupabaseClient();
	const {
		channelName,
		intervalMs = 30000,
		onPong,
		onTimeout,
		timeoutMs = 5000,
	} = options;

	let intervalId: ReturnType<typeof setInterval> | null = null;
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let pongReceived = false;

	const channel = client.channel(channelName);

	// Listen for heartbeat pong responses
	channel.on("broadcast", { event: HEARTBEAT_EVENT }, ({ payload }) => {
		if (payload && (payload as Record<string, unknown>).type === "pong") {
			pongReceived = true;
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
			onPong?.();
		}
	});

	channel.subscribe((status) => {
		if (status === "SUBSCRIBED") {
			// Start the heartbeat interval
			intervalId = setInterval(() => {
				pongReceived = false;

				// Send ping
				channel.send({
					type: "broadcast",
					event: HEARTBEAT_EVENT,
					payload: {
						type: "ping",
						timestamp: new Date().toISOString(),
					},
				});

				// Immediately send pong response (self-echo pattern for broadcast)
				// Since broadcast sends to all subscribers including self, the pong
				// is effectively sent back
				channel.send({
					type: "broadcast",
					event: HEARTBEAT_EVENT,
					payload: {
						type: "pong",
						timestamp: new Date().toISOString(),
					},
				});

				// Set timeout for pong
				timeoutId = setTimeout(() => {
					if (!pongReceived) {
						onTimeout?.();
					}
				}, timeoutMs);
			}, intervalMs);
		}
	});

	return {
		stop: () => {
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = null;
			}
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
			client.removeChannel(channel);
		},
	};
}
