import { getBaseUrl } from "./base-url";

/**
 * Environment detection and API URL configuration.
 *
 * All API routes are served from the same Next.js application on Vercel.
 * This utility provides:
 * 1. Detection of preview vs production environments
 * 2. Consistent API URL resolution across client and server
 *
 * Environment Variables:
 * - NEXT_PUBLIC_VERCEL_ENV: Set by Vercel ('production', 'preview', 'development')
 */

/**
 * Determines if the current environment is a Vercel preview deployment.
 *
 * @returns true if running in a Vercel preview environment
 */
export function isPreviewEnvironment(): boolean {
	return process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";
}

/**
 * @deprecated No longer needed - API is always same-origin on Vercel.
 * Kept for backwards compatibility but always returns false.
 */
export function shouldUseProxy(_isClientSide: boolean): boolean {
	return false;
}

/**
 * Gets the current origin for client-side requests.
 * Uses window.location.origin to ensure same-origin requests.
 *
 * This is critical for Vercel deployments where NEXT_PUBLIC_VERCEL_URL
 * may differ from the actual URL the user is accessing.
 */
function getClientOrigin(): string {
	if (typeof window !== "undefined") {
		return window.location.origin;
	}
	return getBaseUrl();
}

/**
 * Gets the API base URL for making requests.
 *
 * All requests use the same-origin /api route since the API is served
 * from the same Next.js application on Vercel.
 *
 * @returns The base URL for API requests (without trailing slash)
 */
export function getApiBaseUrl(): string {
	const isClientSide = typeof window !== "undefined";

	// Client-side: use window.location.origin for same-origin requests
	if (isClientSide) {
		return `${getClientOrigin()}/api`;
	}

	// Server-side: use base URL
	return `${getBaseUrl()}/api`;
}

/**
 * Gets the full URL for the oRPC endpoint.
 *
 * @returns The full URL for oRPC requests (always absolute)
 */
export function getOrpcUrl(): string {
	const isClientSide = typeof window !== "undefined";

	// Client-side: use window.location.origin for same-origin requests
	if (isClientSide) {
		return `${getClientOrigin()}/api/rpc`;
	}

	// Server-side: use base URL
	return `${getBaseUrl()}/api/rpc`;
}
