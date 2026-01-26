import { logger } from "@repo/logs";
import { PostHog } from "posthog-node";

/**
 * Server-side feature flag service for PostHog.
 *
 * This module provides server-side feature flag evaluation for use in:
 * - Next.js middleware
 * - React Server Components
 * - API routes
 *
 * Features:
 * - Single PostHog client instance with in-memory caching
 * - Configurable flush behavior for serverless environments
 * - Fallback to config defaults when PostHog is unreachable
 * - Type-safe flag definitions
 *
 * @example
 * ```ts
 * import { getFeatureFlag, getAllFeatureFlags } from "@repo/api/lib/feature-flags";
 *
 * // Get a single flag
 * const isEnabled = await getFeatureFlag("new-feature", userId);
 *
 * // Get all flags for bootstrapping
 * const flags = await getAllFeatureFlags(userId);
 * ```
 */

const POSTHOG_API_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
	process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

/**
 * Feature flag value types supported by PostHog
 */
export type FeatureFlagValue = boolean | string | undefined;

/**
 * Map of feature flag keys to their values
 */
export type FeatureFlagMap = Record<string, FeatureFlagValue>;

/**
 * Configuration for the feature flag service
 */
export interface FeatureFlagServiceConfig {
	/** PostHog API key */
	apiKey?: string;
	/** PostHog host URL */
	host?: string;
	/** Whether the service is enabled */
	enabled?: boolean;
	/** Flush at this many events (1 for immediate flush in serverless) */
	flushAt?: number;
	/** Flush interval in milliseconds (0 for immediate in serverless) */
	flushInterval?: number;
	/** Request timeout in milliseconds */
	requestTimeout?: number;
}

/**
 * Options for feature flag evaluation
 */
export interface FeatureFlagOptions {
	/** User properties for flag evaluation */
	properties?: Record<string, unknown>;
	/** Group properties for flag evaluation */
	groups?: Record<string, string>;
	/** Default value to return if flag evaluation fails */
	defaultValue?: FeatureFlagValue;
}

/**
 * In-memory cache for feature flag values
 */
interface FlagCache {
	flags: FeatureFlagMap;
	timestamp: number;
}

/**
 * Server-side feature flag service
 */
export class ServerFeatureFlagService {
	private client: PostHog | null = null;
	private enabled: boolean;
	private config: FeatureFlagServiceConfig;
	private cache: Map<string, FlagCache> = new Map();
	private readonly cacheTtlMs: number = 60_000; // 1 minute cache TTL

	constructor(config?: FeatureFlagServiceConfig) {
		const apiKey = config?.apiKey ?? POSTHOG_API_KEY;
		this.enabled =
			config?.enabled ?? (!!apiKey && process.env.NODE_ENV !== "test");

		this.config = {
			apiKey,
			host: config?.host ?? POSTHOG_HOST,
			flushAt: config?.flushAt ?? 1, // Immediate flush for serverless
			flushInterval: config?.flushInterval ?? 0, // No interval in serverless
			requestTimeout: config?.requestTimeout ?? 10_000, // 10 second timeout
		};

		if (this.enabled && this.config.apiKey) {
			this.initClient();
		} else if (process.env.NODE_ENV !== "test") {
			logger.debug(
				"[ServerFeatureFlagService] PostHog API key not configured - feature flags disabled",
			);
		}
	}

	/**
	 * Initialize the PostHog client
	 */
	private initClient(): void {
		if (!this.config.apiKey) {
			return;
		}

		try {
			this.client = new PostHog(this.config.apiKey, {
				host: this.config.host,
				flushAt: this.config.flushAt,
				flushInterval: this.config.flushInterval,
				requestTimeout: this.config.requestTimeout,
			});

			logger.debug(
				"[ServerFeatureFlagService] PostHog client initialized",
			);
		} catch (error) {
			logger.warn(
				`[ServerFeatureFlagService] Failed to initialize PostHog client: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
			);
			this.enabled = false;
		}
	}

	/**
	 * Get a single feature flag value
	 *
	 * @param flagKey - The feature flag key
	 * @param distinctId - User's distinct ID
	 * @param options - Additional options for flag evaluation
	 * @returns The flag value, or undefined if not found/error
	 */
	async getFeatureFlag(
		flagKey: string,
		distinctId: string,
		options?: FeatureFlagOptions,
	): Promise<FeatureFlagValue> {
		if (!this.enabled || !this.client) {
			logger.debug(
				`[ServerFeatureFlagService] Service disabled, returning default for flag: ${flagKey}`,
			);
			return options?.defaultValue;
		}

		try {
			const result = await this.client.getFeatureFlag(
				flagKey,
				distinctId,
				{
					personProperties: options?.properties,
					groups: options?.groups,
				},
			);

			// PostHog returns false for non-existent flags, null for errors
			if (result === null || result === undefined) {
				logger.debug(
					`[ServerFeatureFlagService] Flag not found or error: ${flagKey}`,
				);
				return options?.defaultValue;
			}

			return result;
		} catch (error) {
			logger.warn(
				`[ServerFeatureFlagService] Error fetching flag "${flagKey}": ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
			);
			return options?.defaultValue;
		}
	}

	/**
	 * Check if a feature flag is enabled (boolean check)
	 *
	 * @param flagKey - The feature flag key
	 * @param distinctId - User's distinct ID
	 * @param options - Additional options for flag evaluation
	 * @returns True if the flag is enabled, false otherwise
	 */
	async isFeatureEnabled(
		flagKey: string,
		distinctId: string,
		options?: Omit<FeatureFlagOptions, "defaultValue"> & {
			defaultValue?: boolean;
		},
	): Promise<boolean> {
		if (!this.enabled || !this.client) {
			return options?.defaultValue ?? false;
		}

		try {
			const result = await this.client.isFeatureEnabled(
				flagKey,
				distinctId,
				{
					personProperties: options?.properties,
					groups: options?.groups,
				},
			);

			return result ?? options?.defaultValue ?? false;
		} catch (error) {
			logger.warn(
				`[ServerFeatureFlagService] Error checking flag "${flagKey}": ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
			);
			return options?.defaultValue ?? false;
		}
	}

	/**
	 * Get all feature flags for a user
	 *
	 * This is optimized for bootstrapping - it fetches all flags in a single request.
	 * Results are cached in memory for performance.
	 *
	 * @param distinctId - User's distinct ID
	 * @param options - Additional options for flag evaluation
	 * @returns Map of flag keys to values
	 */
	async getAllFeatureFlags(
		distinctId: string,
		options?: Omit<FeatureFlagOptions, "defaultValue">,
	): Promise<FeatureFlagMap> {
		if (!this.enabled || !this.client) {
			logger.debug(
				"[ServerFeatureFlagService] Service disabled, returning empty flags",
			);
			return {};
		}

		// Check cache first
		const cached = this.getCachedFlags(distinctId);
		if (cached) {
			logger.debug(
				`[ServerFeatureFlagService] Returning cached flags for: ${distinctId}`,
			);
			return cached;
		}

		try {
			const flags = await this.client.getAllFlags(distinctId, {
				personProperties: options?.properties,
				groups: options?.groups,
			});

			// Normalize the flags map (PostHog may return various types)
			const normalizedFlags: FeatureFlagMap = {};
			for (const [key, value] of Object.entries(flags)) {
				if (typeof value === "boolean" || typeof value === "string") {
					normalizedFlags[key] = value;
				} else if (value !== null && value !== undefined) {
					normalizedFlags[key] = String(value);
				}
			}

			// Cache the results
			this.setCachedFlags(distinctId, normalizedFlags);

			return normalizedFlags;
		} catch (error) {
			logger.warn(
				`[ServerFeatureFlagService] Error fetching all flags: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
			);
			return {};
		}
	}

	/**
	 * Get cached flags for a user
	 */
	private getCachedFlags(distinctId: string): FeatureFlagMap | null {
		const cached = this.cache.get(distinctId);
		if (!cached) {
			return null;
		}

		const now = Date.now();
		if (now - cached.timestamp > this.cacheTtlMs) {
			this.cache.delete(distinctId);
			return null;
		}

		return cached.flags;
	}

	/**
	 * Set cached flags for a user
	 */
	private setCachedFlags(distinctId: string, flags: FeatureFlagMap): void {
		// Limit cache size to prevent memory issues
		if (this.cache.size >= 1000) {
			// Remove oldest entries
			const entries = Array.from(this.cache.entries());
			entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
			for (let i = 0; i < 100; i++) {
				this.cache.delete(entries[i][0]);
			}
		}

		this.cache.set(distinctId, {
			flags,
			timestamp: Date.now(),
		});
	}

	/**
	 * Clear the cache for a specific user or all users
	 */
	clearCache(distinctId?: string): void {
		if (distinctId) {
			this.cache.delete(distinctId);
		} else {
			this.cache.clear();
		}
	}

	/**
	 * Check if the service is enabled
	 */
	isEnabled(): boolean {
		return this.enabled;
	}

	/**
	 * Shutdown the PostHog client
	 *
	 * Call this in serverless environments to ensure events are flushed.
	 */
	async shutdown(): Promise<void> {
		if (this.client) {
			try {
				await this.client.shutdown();
			} catch (error) {
				logger.warn(
					`[ServerFeatureFlagService] Error during shutdown: ${
						error instanceof Error ? error.message : "Unknown error"
					}`,
				);
			}
		}
	}
}

/**
 * Singleton instance of the server feature flag service
 */
export const serverFeatureFlags = new ServerFeatureFlagService();

/**
 * Convenience function to get a single feature flag
 */
export async function getFeatureFlag(
	flagKey: string,
	distinctId: string,
	options?: FeatureFlagOptions,
): Promise<FeatureFlagValue> {
	return serverFeatureFlags.getFeatureFlag(flagKey, distinctId, options);
}

/**
 * Convenience function to check if a feature flag is enabled
 */
export async function isFeatureEnabled(
	flagKey: string,
	distinctId: string,
	options?: Omit<FeatureFlagOptions, "defaultValue"> & {
		defaultValue?: boolean;
	},
): Promise<boolean> {
	return serverFeatureFlags.isFeatureEnabled(flagKey, distinctId, options);
}

/**
 * Convenience function to get all feature flags for bootstrapping
 */
export async function getAllFeatureFlags(
	distinctId: string,
	options?: Omit<FeatureFlagOptions, "defaultValue">,
): Promise<FeatureFlagMap> {
	return serverFeatureFlags.getAllFeatureFlags(distinctId, options);
}
