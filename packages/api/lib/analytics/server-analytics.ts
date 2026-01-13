import { logger } from "@repo/logs";

/**
 * Server-side analytics for tracking tool usage events.
 *
 * This module provides a lightweight server-side analytics client that sends
 * events directly to PostHog's capture API. It's designed for:
 * - Tracking anonymous user actions without requiring client-side JavaScript
 * - Server-side events that shouldn't rely on client instrumentation
 * - Privacy-compliant tracking (no PII, server-side session management)
 *
 * @example
 * ```ts
 * import { serverAnalytics } from "./analytics/server-analytics";
 *
 * // Track a tool processing event
 * await serverAnalytics.capture({
 *   distinctId: sessionId, // or userId if authenticated
 *   event: "tool_processing_completed",
 *   properties: {
 *     tool_name: "news-analyzer",
 *     processing_duration_ms: 5000,
 *     job_id: "job_123",
 *   },
 * });
 * ```
 */

const POSTHOG_API_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
	process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

interface CaptureOptions {
	/** Unique identifier for the user (userId for authenticated, sessionId for anonymous) */
	distinctId: string;
	/** Event name */
	event: string;
	/** Event properties */
	properties?: Record<string, unknown>;
	/** Timestamp (defaults to now) */
	timestamp?: Date;
	/** Set user properties */
	$set?: Record<string, unknown>;
	/** Set user properties only if not already set */
	$set_once?: Record<string, unknown>;
}

interface IdentifyOptions {
	/** User ID */
	distinctId: string;
	/** User properties to set */
	properties?: Record<string, unknown>;
}

interface AliasOptions {
	/** The ID of the user after they signed up (authenticated ID) */
	distinctId: string;
	/** The anonymous ID used before signup */
	alias: string;
}

/**
 * Server-side analytics client for PostHog
 */
class ServerAnalytics {
	private apiKey: string | undefined;
	private host: string;
	private enabled: boolean;

	constructor() {
		this.apiKey = POSTHOG_API_KEY;
		this.host = POSTHOG_HOST;
		this.enabled = !!this.apiKey && process.env.NODE_ENV !== "test";

		if (!this.enabled && process.env.NODE_ENV !== "test") {
			logger.debug(
				"[ServerAnalytics] PostHog API key not configured - analytics disabled",
			);
		}
	}

	/**
	 * Capture an analytics event
	 */
	async capture(options: CaptureOptions): Promise<void> {
		if (!this.enabled) {
			return;
		}

		const {
			distinctId,
			event,
			properties = {},
			timestamp,
			$set,
			$set_once,
		} = options;

		const payload = {
			api_key: this.apiKey,
			event,
			distinct_id: distinctId,
			properties: {
				...properties,
				$lib: "server-analytics",
				$lib_version: "1.0.0",
			},
			timestamp: (timestamp ?? new Date()).toISOString(),
			...(($set || $set_once) && {
				$set,
				$set_once,
			}),
		};

		try {
			const response = await fetch(`${this.host}/capture/`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				logger.warn(
					`[ServerAnalytics] Failed to capture event: ${response.status} ${response.statusText}`,
					{ event, distinctId },
				);
			}
		} catch (error) {
			// Non-blocking - log and continue
			logger.warn(
				`[ServerAnalytics] Error capturing event: ${error instanceof Error ? error.message : "Unknown error"}`,
				{ event, distinctId },
			);
		}
	}

	/**
	 * Identify a user with properties
	 */
	async identify(options: IdentifyOptions): Promise<void> {
		if (!this.enabled) {
			return;
		}

		await this.capture({
			distinctId: options.distinctId,
			event: "$identify",
			$set: options.properties,
		});
	}

	/**
	 * Create an alias between two IDs (e.g., anonymous -> authenticated)
	 * Use this when an anonymous user signs up to link their pre-signup activity
	 */
	async alias(options: AliasOptions): Promise<void> {
		if (!this.enabled) {
			return;
		}

		const { distinctId, alias } = options;

		const payload = {
			api_key: this.apiKey,
			event: "$create_alias",
			distinct_id: distinctId,
			properties: {
				alias,
				$lib: "server-analytics",
			},
		};

		try {
			const response = await fetch(`${this.host}/capture/`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				logger.warn(
					`[ServerAnalytics] Failed to create alias: ${response.status} ${response.statusText}`,
					{ distinctId, alias },
				);
			}
		} catch (error) {
			logger.warn(
				`[ServerAnalytics] Error creating alias: ${error instanceof Error ? error.message : "Unknown error"}`,
				{ distinctId, alias },
			);
		}
	}

	/**
	 * Check if analytics is enabled
	 */
	isEnabled(): boolean {
		return this.enabled;
	}
}

/**
 * Singleton instance of the server analytics client
 */
export const serverAnalytics = new ServerAnalytics();

/**
 * Tool-specific event types for type safety
 */
export type ToolServerEvent =
	| "tool_job_created"
	| "tool_processing_started"
	| "tool_processing_completed"
	| "tool_processing_failed"
	| "tool_cache_hit";

/**
 * Common properties for all tool events
 */
export interface ToolServerEventProperties {
	tool_name: string;
	job_id: string;
	is_authenticated?: boolean;
	session_id?: string;
	user_id?: string;
}

/**
 * Helper function to track tool events with consistent properties
 */
export async function trackToolServerEvent(
	event: ToolServerEvent,
	properties: ToolServerEventProperties & Record<string, unknown>,
): Promise<void> {
	const distinctId = properties.user_id || properties.session_id;

	if (!distinctId) {
		logger.warn("[ServerAnalytics] No distinctId available for event", {
			event,
			tool_name: properties.tool_name,
		});
		return;
	}

	await serverAnalytics.capture({
		distinctId,
		event,
		properties: {
			...properties,
			// Track user type for segmentation
			user_type: properties.is_authenticated
				? "authenticated"
				: "anonymous",
		},
	});
}
