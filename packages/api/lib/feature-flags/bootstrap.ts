import { logger } from "@repo/logs";
import type {
	FeatureFlagMap,
	FeatureFlagOptions,
} from "./server-feature-flags";
import { serverFeatureFlags } from "./server-feature-flags";

/**
 * Default feature flag values.
 *
 * These values are used as fallbacks when:
 * - PostHog is unavailable or unreachable
 * - The PostHog API key is not configured
 * - There's an error fetching flags
 *
 * These should match the default behavior you want in your application
 * when feature flags cannot be evaluated remotely.
 */
export const DEFAULT_FEATURE_FLAGS: FeatureFlagMap = {
	// Add your default flag values here
	// Example:
	// "new-feature": false,
	// "experiment-variant": "control",
};

/**
 * Options for bootstrapping feature flags
 */
export interface BootstrapOptions
	extends Omit<FeatureFlagOptions, "defaultValue"> {
	/** Custom default flags to use as fallback */
	defaults?: FeatureFlagMap;
	/** Whether to log fallback usage */
	logFallback?: boolean;
}

/**
 * Get feature flags for bootstrapping with fallback support.
 *
 * This function is designed for server-side use in layouts or pages
 * to fetch flags that can be passed to the client for bootstrapping.
 *
 * If PostHog is unavailable, it falls back to configured defaults.
 *
 * @param distinctId - User's distinct ID (or anonymous session ID)
 * @param options - Bootstrap options including custom defaults
 * @returns Feature flags map with fallback values merged
 *
 * @example
 * ```tsx
 * // In a Next.js layout or page (Server Component)
 * import { getBootstrapFlags } from "@repo/api/lib/feature-flags";
 *
 * export default async function Layout({ children }) {
 *   const user = await getCurrentUser();
 *   const flags = await getBootstrapFlags(user?.id ?? "anonymous", {
 *     defaults: {
 *       "new-dashboard": false,
 *       "show-beta-features": false,
 *     },
 *   });
 *
 *   return (
 *     <FeatureFlagProvider bootstrappedFlags={flags} distinctId={user?.id}>
 *       {children}
 *     </FeatureFlagProvider>
 *   );
 * }
 * ```
 */
export async function getBootstrapFlags(
	distinctId: string,
	options?: BootstrapOptions,
): Promise<FeatureFlagMap> {
	const defaults = { ...DEFAULT_FEATURE_FLAGS, ...options?.defaults };
	const logFallback = options?.logFallback ?? true;

	// Check if service is enabled
	if (!serverFeatureFlags.isEnabled()) {
		if (logFallback && process.env.NODE_ENV !== "test") {
			logger.debug(
				"[getBootstrapFlags] Feature flag service disabled, using defaults",
			);
		}
		return defaults;
	}

	try {
		// Attempt to fetch flags from PostHog
		const flags = await serverFeatureFlags.getAllFeatureFlags(distinctId, {
			properties: options?.properties,
			groups: options?.groups,
		});

		// If we got flags, merge with defaults (PostHog flags take precedence)
		if (Object.keys(flags).length > 0) {
			return { ...defaults, ...flags };
		}

		// No flags returned, use defaults
		if (logFallback) {
			logger.debug(
				"[getBootstrapFlags] No flags returned from PostHog, using defaults",
			);
		}
		return defaults;
	} catch (error) {
		// Error fetching flags, fall back to defaults
		if (logFallback) {
			logger.warn(
				`[getBootstrapFlags] Error fetching flags, using defaults: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
			);
		}
		return defaults;
	}
}

/**
 * Get a single feature flag with fallback support.
 *
 * Similar to `getBootstrapFlags` but for a single flag.
 * Useful when you only need one flag and don't want to fetch all.
 *
 * @param flagKey - The feature flag key
 * @param distinctId - User's distinct ID
 * @param defaultValue - Default value if flag is not found or error occurs
 * @param options - Additional evaluation options
 * @returns The flag value
 *
 * @example
 * ```tsx
 * // Check if a feature is enabled for a user
 * const showNewFeature = await getBootstrapFlag(
 *   "new-feature",
 *   userId,
 *   false
 * );
 * ```
 */
export async function getBootstrapFlag<T extends boolean | string | undefined>(
	flagKey: string,
	distinctId: string,
	defaultValue: T,
	options?: Omit<BootstrapOptions, "defaults">,
): Promise<T> {
	// Check if service is enabled
	if (!serverFeatureFlags.isEnabled()) {
		return defaultValue;
	}

	try {
		const value = await serverFeatureFlags.getFeatureFlag(
			flagKey,
			distinctId,
			{
				properties: options?.properties,
				groups: options?.groups,
				defaultValue,
			},
		);

		// Return the value if it matches the expected type
		if (value !== undefined && value !== null) {
			return value as T;
		}

		return defaultValue;
	} catch (error) {
		if (options?.logFallback ?? true) {
			logger.warn(
				`[getBootstrapFlag] Error fetching flag "${flagKey}", using default: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
			);
		}
		return defaultValue;
	}
}

/**
 * Check if a feature is enabled with fallback support.
 *
 * Convenience function that returns a boolean.
 *
 * @param flagKey - The feature flag key
 * @param distinctId - User's distinct ID
 * @param defaultValue - Default value if flag is not found (default: false)
 * @param options - Additional evaluation options
 * @returns True if the feature is enabled
 *
 * @example
 * ```tsx
 * // In middleware
 * if (await isBootstrapFeatureEnabled("maintenance-mode", userId)) {
 *   return NextResponse.redirect("/maintenance");
 * }
 * ```
 */
export async function isBootstrapFeatureEnabled(
	flagKey: string,
	distinctId: string,
	defaultValue = false,
	options?: Omit<BootstrapOptions, "defaults">,
): Promise<boolean> {
	// Check if service is enabled
	if (!serverFeatureFlags.isEnabled()) {
		return defaultValue;
	}

	try {
		const isEnabled = await serverFeatureFlags.isFeatureEnabled(
			flagKey,
			distinctId,
			{
				properties: options?.properties,
				groups: options?.groups,
				defaultValue,
			},
		);

		return isEnabled;
	} catch (error) {
		if (options?.logFallback ?? true) {
			logger.warn(
				`[isBootstrapFeatureEnabled] Error checking flag "${flagKey}", using default: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
			);
		}
		return defaultValue;
	}
}
