/**
 * Types for Supabase Realtime channel subscriptions.
 *
 * This module provides typed interfaces for broadcast messages,
 * presence state, and channel subscription options.
 */

/**
 * Callback function for handling broadcast messages.
 */
export type BroadcastHandler<T = unknown> = (payload: T) => void;

/**
 * Callback function for handling presence state changes.
 */
export type PresenceHandler<T = Record<string, unknown>> = (
	state: Record<string, T[]>,
) => void;

/**
 * Callback function for handling presence join events.
 */
export type PresenceJoinHandler<T = Record<string, unknown>> = (
	key: string,
	currentPresences: T[],
	newPresences: T[],
) => void;

/**
 * Callback function for handling presence leave events.
 */
export type PresenceLeaveHandler<T = Record<string, unknown>> = (
	key: string,
	currentPresences: T[],
	leftPresences: T[],
) => void;

/**
 * Options for subscribing to a broadcast channel.
 */
export interface BroadcastSubscriptionOptions<T = unknown> {
	/** The channel name to subscribe to */
	channelName: string;
	/** The event name to listen for */
	event: string;
	/** Handler function called when a message is received */
	onMessage: BroadcastHandler<T>;
}

/**
 * Options for subscribing to a presence channel.
 */
export interface PresenceSubscriptionOptions<T = Record<string, unknown>> {
	/** The channel name to subscribe to */
	channelName: string;
	/** Unique key identifying this user in the channel */
	presenceKey: string;
	/** Handler called when presence state syncs */
	onSync?: PresenceHandler<T>;
	/** Handler called when a user joins */
	onJoin?: PresenceJoinHandler<T>;
	/** Handler called when a user leaves */
	onLeave?: PresenceLeaveHandler<T>;
}

/**
 * Result of a channel subscription, includes cleanup function.
 */
export interface ChannelSubscription {
	/** Unsubscribe and clean up the channel */
	unsubscribe: () => void;
}

/**
 * Result of a presence subscription, includes track and untrack functions.
 */
export interface PresenceSubscription extends ChannelSubscription {
	/** Update the presence state for this user */
	track: <T extends Record<string, unknown>>(state: T) => Promise<void>;
	/** Remove presence state for this user */
	untrack: () => Promise<void>;
}

/**
 * Options for sending a broadcast message.
 */
export interface BroadcastMessageOptions<T = unknown> {
	/** The channel name to broadcast to */
	channelName: string;
	/** The event name for the message */
	event: string;
	/** The payload to send */
	payload: T;
}
