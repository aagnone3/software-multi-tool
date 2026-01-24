"use client";

import posthog from "posthog-js";
import * as React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

/**
 * Client-side feature flag hooks for PostHog.
 *
 * This module provides React hooks for consuming feature flags on the client:
 * - `useFeatureFlag` - Get a single feature flag value
 * - `useFeatureFlags` - Get all feature flags
 * - `FeatureFlagProvider` - Context provider for bootstrapped flags
 *
 * Features:
 * - Bootstrapping support to prevent UI flicker
 * - Automatic updates when flags change
 * - Type-safe flag values
 *
 * @example
 * ```tsx
 * // In layout.tsx (Server Component)
 * const flags = await getAllFeatureFlags(userId);
 *
 * // In client component
 * function MyComponent() {
 *   const isEnabled = useFeatureFlag("new-feature");
 *   return isEnabled ? <NewFeature /> : <OldFeature />;
 * }
 * ```
 */

/**
 * Feature flag value types
 */
export type FeatureFlagValue = boolean | string | undefined;

/**
 * Map of feature flag keys to their values
 */
export type FeatureFlagMap = Record<string, FeatureFlagValue>;

/**
 * Context for bootstrapped feature flags
 */
interface FeatureFlagContextValue {
	/** Bootstrapped flags from server */
	bootstrappedFlags: FeatureFlagMap;
	/** Whether PostHog has loaded and fetched fresh flags */
	isLoaded: boolean;
	/** Get a feature flag value */
	getFlag: (key: string, defaultValue?: FeatureFlagValue) => FeatureFlagValue;
	/** Check if a feature flag is enabled */
	isFlagEnabled: (key: string, defaultValue?: boolean) => boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

/**
 * Props for the FeatureFlagProvider
 */
export interface FeatureFlagProviderProps {
	/** Child components */
	children: React.ReactNode;
	/** Bootstrapped flags from server-side evaluation */
	bootstrappedFlags?: FeatureFlagMap;
	/** Distinct ID for the user (for PostHog identification) */
	distinctId?: string;
}

/**
 * Provider component for feature flags.
 *
 * Wraps the application with feature flag context, enabling bootstrapping
 * from server-side evaluated flags to prevent UI flicker.
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * export default async function Layout({ children }) {
 *   const user = await getCurrentUser();
 *   const flags = user ? await getAllFeatureFlags(user.id) : {};
 *
 *   return (
 *     <FeatureFlagProvider bootstrappedFlags={flags} distinctId={user?.id}>
 *       {children}
 *     </FeatureFlagProvider>
 *   );
 * }
 * ```
 */
export function FeatureFlagProvider({
	children,
	bootstrappedFlags = {},
	distinctId,
}: FeatureFlagProviderProps) {
	const [isLoaded, setIsLoaded] = useState(false);
	const [clientFlags, setClientFlags] = useState<FeatureFlagMap>({});

	// Initialize PostHog with bootstrapped flags
	useEffect(() => {
		const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
		if (!posthogKey) {
			setIsLoaded(true);
			return;
		}

		// Bootstrap PostHog with server-evaluated flags
		if (
			Object.keys(bootstrappedFlags).length > 0 &&
			typeof posthog.init === "function"
		) {
			// If PostHog is already initialized, just set the flags
			if (posthog._isIdentified?.() || posthog.get_distinct_id?.()) {
				// PostHog is already running, register for flag updates
				const handleFlagsLoaded = () => {
					const flags =
						posthog.featureFlags?.getFlagVariants?.() ?? {};
					setClientFlags(flags as FeatureFlagMap);
					setIsLoaded(true);
				};

				posthog.onFeatureFlags?.(handleFlagsLoaded);

				// If flags are already loaded, call immediately
				if (posthog.featureFlags?.hasLoadedFlags) {
					handleFlagsLoaded();
				}
			}
		} else {
			// No bootstrapped flags, wait for PostHog to load
			const handleFlagsLoaded = () => {
				const flags = posthog.featureFlags?.getFlagVariants?.() ?? {};
				setClientFlags(flags as FeatureFlagMap);
				setIsLoaded(true);
			};

			if (typeof posthog.onFeatureFlags === "function") {
				posthog.onFeatureFlags(handleFlagsLoaded);
			}

			// Check if already loaded
			if (posthog.featureFlags?.hasLoadedFlags) {
				handleFlagsLoaded();
			}
		}

		// Timeout fallback - consider loaded after 3 seconds even if PostHog hasn't responded
		const timeout = setTimeout(() => {
			if (!isLoaded) {
				setIsLoaded(true);
			}
		}, 3000);

		return () => clearTimeout(timeout);
	}, [bootstrappedFlags, isLoaded]);

	// Identify user if distinctId is provided
	useEffect(() => {
		if (distinctId && typeof posthog.identify === "function") {
			posthog.identify(distinctId);
		}
	}, [distinctId]);

	// Merge bootstrapped flags with client flags (client takes precedence)
	const mergedFlags = useMemo(() => {
		return { ...bootstrappedFlags, ...clientFlags };
	}, [bootstrappedFlags, clientFlags]);

	const getFlag = useCallback(
		(key: string, defaultValue?: FeatureFlagValue): FeatureFlagValue => {
			// First check merged flags
			if (key in mergedFlags) {
				return mergedFlags[key];
			}

			// Fall back to direct PostHog call if available
			if (typeof posthog.getFeatureFlag === "function") {
				const value = posthog.getFeatureFlag(key);
				if (value !== undefined && value !== null) {
					return value as FeatureFlagValue;
				}
			}

			return defaultValue;
		},
		[mergedFlags],
	);

	const isFlagEnabled = useCallback(
		(key: string, defaultValue = false): boolean => {
			const value = getFlag(key, defaultValue);

			if (typeof value === "boolean") {
				return value;
			}

			// String values: "true" or any non-empty string is truthy
			if (typeof value === "string") {
				return value.toLowerCase() !== "false" && value !== "";
			}

			return defaultValue;
		},
		[getFlag],
	);

	const contextValue = useMemo(
		() => ({
			bootstrappedFlags,
			isLoaded,
			getFlag,
			isFlagEnabled,
		}),
		[bootstrappedFlags, isLoaded, getFlag, isFlagEnabled],
	);

	return (
		<FeatureFlagContext.Provider value={contextValue}>
			{children}
		</FeatureFlagContext.Provider>
	);
}

/**
 * Hook to access the feature flag context
 */
export function useFeatureFlagContext(): FeatureFlagContextValue {
	const context = useContext(FeatureFlagContext);

	if (!context) {
		// Return a fallback context if provider is not present
		// This allows components to work without the provider (graceful degradation)
		return {
			bootstrappedFlags: {},
			isLoaded: true,
			getFlag: (_key, defaultValue) => defaultValue,
			isFlagEnabled: (_key, defaultValue = false) => defaultValue,
		};
	}

	return context;
}

/**
 * Hook to get a single feature flag value.
 *
 * Returns the flag value from bootstrapped flags immediately,
 * then updates when PostHog loads fresh flags.
 *
 * @param flagKey - The feature flag key
 * @param defaultValue - Default value if flag is not found
 * @returns The flag value
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const variant = useFeatureFlag("experiment-variant", "control");
 *   return <div>Variant: {variant}</div>;
 * }
 * ```
 */
export function useFeatureFlag(
	flagKey: string,
	defaultValue?: FeatureFlagValue,
): FeatureFlagValue {
	const { getFlag } = useFeatureFlagContext();
	return getFlag(flagKey, defaultValue);
}

/**
 * Hook to check if a feature flag is enabled.
 *
 * This is a convenience wrapper around `useFeatureFlag` that
 * returns a boolean value.
 *
 * @param flagKey - The feature flag key
 * @param defaultValue - Default value if flag is not found (default: false)
 * @returns True if the flag is enabled
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const showNewFeature = useIsFeatureEnabled("new-feature");
 *   return showNewFeature ? <NewFeature /> : <OldFeature />;
 * }
 * ```
 */
export function useIsFeatureEnabled(
	flagKey: string,
	defaultValue = false,
): boolean {
	const { isFlagEnabled } = useFeatureFlagContext();
	return isFlagEnabled(flagKey, defaultValue);
}

/**
 * Hook to get all feature flags.
 *
 * Returns the complete map of feature flags, merged from
 * bootstrapped and client-loaded flags.
 *
 * @returns Map of flag keys to values and loading state
 *
 * @example
 * ```tsx
 * function DebugPanel() {
 *   const { flags, isLoaded } = useFeatureFlags();
 *   return (
 *     <div>
 *       <p>Loaded: {isLoaded ? "Yes" : "No"}</p>
 *       <pre>{JSON.stringify(flags, null, 2)}</pre>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFeatureFlags(): {
	flags: FeatureFlagMap;
	isLoaded: boolean;
} {
	const { bootstrappedFlags, isLoaded } = useFeatureFlagContext();
	const [flags, setFlags] = useState<FeatureFlagMap>(bootstrappedFlags);

	useEffect(() => {
		// Get all flags from PostHog if available
		if (typeof posthog.featureFlags?.getFlagVariants === "function") {
			const posthogFlags = posthog.featureFlags.getFlagVariants() ?? {};
			setFlags({ ...bootstrappedFlags, ...posthogFlags });
		} else {
			setFlags(bootstrappedFlags);
		}
	}, [bootstrappedFlags, isLoaded]);

	return { flags, isLoaded };
}
