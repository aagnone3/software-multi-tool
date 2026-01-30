"use client";

/**
 * React hooks for Supabase Realtime functionality.
 *
 * These hooks provide easy-to-use patterns for common realtime use cases:
 * - Echo testing (useRealtimeEcho)
 * - Broadcast messaging (useRealtimeBroadcast)
 * - Presence tracking (useRealtimePresence)
 *
 * @example
 * ```typescript
 * import { useRealtimeEcho } from "@realtime";
 *
 * function TestConnection() {
 *   const { isConnected, lastEcho, sendEcho } = useRealtimeEcho("test-channel");
 *
 *   return (
 *     <div>
 *       <p>Status: {isConnected ? "Connected" : "Disconnected"}</p>
 *       <button onClick={() => sendEcho({ message: "Hello!" })}>
 *         Send Echo
 *       </button>
 *       {lastEcho && <p>Last echo: {JSON.stringify(lastEcho)}</p>}
 *     </div>
 *   );
 * }
 * ```
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
	type EchoMessage,
	type HeartbeatSubscription,
	sendEchoMessage,
	startHeartbeat,
	subscribeToEcho,
} from "./echo";
import type { ChannelSubscription } from "./types";

// ============================================================================
// useRealtimeEcho Hook
// ============================================================================

export interface UseRealtimeEchoOptions {
	/** Enable automatic heartbeat monitoring (default: false) */
	enableHeartbeat?: boolean;
	/** Heartbeat interval in milliseconds (default: 30000) */
	heartbeatIntervalMs?: number;
}

export interface UseRealtimeEchoResult<T = unknown> {
	/** Whether the channel is connected */
	isConnected: boolean;
	/** The last echo message received */
	lastEcho: EchoMessage<T> | null;
	/** Send an echo message */
	sendEcho: (payload: T) => Promise<void>;
	/** Whether the connection is healthy (based on heartbeat) */
	isHealthy: boolean;
}

/**
 * Hook for echo functionality on a Supabase Realtime channel.
 *
 * This replaces the WebSocket echo pattern from api-server. Messages sent
 * via sendEcho are broadcast to all subscribers on the channel, including
 * the sender, providing a round-trip test of connectivity.
 *
 * @example
 * ```typescript
 * function ConnectionTest() {
 *   const { isConnected, lastEcho, sendEcho, isHealthy } = useRealtimeEcho(
 *     "test-channel",
 *     { enableHeartbeat: true }
 *   );
 *
 *   useEffect(() => {
 *     if (lastEcho) {
 *       console.log("Received echo:", lastEcho.data);
 *     }
 *   }, [lastEcho]);
 *
 *   return (
 *     <div>
 *       <p>Connected: {isConnected ? "Yes" : "No"}</p>
 *       <p>Healthy: {isHealthy ? "Yes" : "No"}</p>
 *       <button onClick={() => sendEcho({ test: "hello" })}>
 *         Send Test
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRealtimeEcho<T = unknown>(
	channelName: string,
	options: UseRealtimeEchoOptions = {},
): UseRealtimeEchoResult<T> {
	const { enableHeartbeat = false, heartbeatIntervalMs = 30000 } = options;

	const [isConnected, setIsConnected] = useState(false);
	const [lastEcho, setLastEcho] = useState<EchoMessage<T> | null>(null);
	const [isHealthy, setIsHealthy] = useState(true);

	const subscriptionRef = useRef<ChannelSubscription | null>(null);
	const heartbeatRef = useRef<HeartbeatSubscription | null>(null);

	// Subscribe to echo messages
	useEffect(() => {
		subscriptionRef.current = subscribeToEcho<T>({
			channelName,
			onEcho: (message) => {
				setLastEcho(message);
			},
			onStatusChange: (status) => {
				setIsConnected(status === "SUBSCRIBED");
				if (status !== "SUBSCRIBED") {
					setIsHealthy(false);
				}
			},
		});

		return () => {
			subscriptionRef.current?.unsubscribe();
		};
	}, [channelName]);

	// Start heartbeat if enabled
	useEffect(() => {
		if (!enableHeartbeat || !isConnected) {
			return;
		}

		heartbeatRef.current = startHeartbeat({
			channelName,
			intervalMs: heartbeatIntervalMs,
			onPong: () => {
				setIsHealthy(true);
			},
			onTimeout: () => {
				setIsHealthy(false);
			},
		});

		return () => {
			heartbeatRef.current?.stop();
		};
	}, [channelName, enableHeartbeat, heartbeatIntervalMs, isConnected]);

	// Send echo message
	const sendEcho = useCallback(
		async (payload: T) => {
			await sendEchoMessage({ channelName, payload });
		},
		[channelName],
	);

	return {
		isConnected,
		lastEcho,
		sendEcho,
		isHealthy,
	};
}

// ============================================================================
// useRealtimeBroadcast Hook
// ============================================================================

export interface UseRealtimeBroadcastResult<T = unknown> {
	/** Whether the channel is connected */
	isConnected: boolean;
	/** The last message received */
	lastMessage: T | null;
	/** Send a broadcast message */
	send: (payload: T) => void;
}

/**
 * Hook for broadcast messaging on a Supabase Realtime channel.
 *
 * Provides a simple pub/sub pattern where messages are sent to all
 * subscribers on the channel.
 *
 * @example
 * ```typescript
 * function ChatRoom() {
 *   const { isConnected, lastMessage, send } = useRealtimeBroadcast<ChatMessage>(
 *     "chat-room-123",
 *     "message"
 *   );
 *
 *   const handleSend = (text: string) => {
 *     send({ text, userId: currentUser.id, timestamp: Date.now() });
 *   };
 *
 *   return (
 *     <div>
 *       {lastMessage && <p>{lastMessage.text}</p>}
 *       <input onKeyDown={(e) => e.key === "Enter" && handleSend(e.target.value)} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useRealtimeBroadcast<T = unknown>(
	channelName: string,
	event: string,
): UseRealtimeBroadcastResult<T> {
	const [isConnected, setIsConnected] = useState(false);
	const [lastMessage, setLastMessage] = useState<T | null>(null);

	useEffect(() => {
		// Dynamic import to access the client
		const setupChannel = async () => {
			const { subscribeToBroadcast } = await import("./client");

			const subscription = subscribeToBroadcast<T>({
				channelName,
				event,
				onMessage: (payload) => {
					setLastMessage(payload);
				},
			});

			setIsConnected(true);

			return () => {
				subscription.unsubscribe();
				setIsConnected(false);
			};
		};

		const cleanup = setupChannel();

		return () => {
			cleanup.then((fn) => fn?.());
		};
	}, [channelName, event]);

	const send = useCallback(
		async (payload: T) => {
			const { broadcastMessage } = await import("./client");
			await broadcastMessage({ channelName, event, payload });
		},
		[channelName, event],
	);

	return {
		isConnected,
		lastMessage,
		send,
	};
}
