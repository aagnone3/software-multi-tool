import { getBaseUrl } from "./base-url";

/**
 * Environment detection and API URL configuration for preview environments.
 *
 * In preview environments (Vercel preview deploys), the frontend and backend
 * are on different domains, which breaks same-site cookie authentication.
 *
 * This utility provides:
 * 1. Detection of preview vs production environments
 * 2. Automatic selection of proxy vs direct API routes
 * 3. Server-side URL resolution for direct API calls
 *
 * Environment Variables:
 * - NEXT_PUBLIC_VERCEL_ENV: Set by Vercel ('production', 'preview', 'development')
 * - NEXT_PUBLIC_API_SERVER_URL: External API server URL (for server-side in preview)
 * - API_SERVER_URL: Internal API server URL (for proxy route, server-only)
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
 * Determines if we should use the API proxy for requests.
 *
 * Proxy is used in preview environments for client-side requests to maintain
 * same-origin for cookies. Server-side requests can go direct.
 *
 * @param isClientSide - Whether this is a client-side request
 * @returns true if requests should be routed through the proxy
 */
export function shouldUseProxy(isClientSide: boolean): boolean {
	// Only client-side requests in preview environments need the proxy
	// Server-side can make direct calls to the API server
	return isClientSide && isPreviewEnvironment();
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
 * For client-side in preview environments:
 *   Returns absolute URL to proxy route using window.location.origin
 *   (ensures same-origin to avoid CORS issues)
 *
 * For server-side or production:
 *   Returns the appropriate direct URL
 *
 * @returns The base URL for API requests (without trailing slash)
 */
export function getApiBaseUrl(): string {
	const isClientSide = typeof window !== "undefined";

	// Client-side in preview: use proxy route with window.location.origin
	// This ensures same-origin requests even when NEXT_PUBLIC_VERCEL_URL differs
	if (shouldUseProxy(isClientSide)) {
		return `${getClientOrigin()}/api/proxy`;
	}

	// Server-side in preview: use direct API server URL if available
	if (!isClientSide && isPreviewEnvironment()) {
		const apiServerUrl =
			process.env.NEXT_PUBLIC_API_SERVER_URL ||
			process.env.API_SERVER_URL;
		if (apiServerUrl) {
			return `${apiServerUrl}/api`;
		}
	}

	// Default: use same-origin API route (production or development)
	return `${getBaseUrl()}/api`;
}

/**
 * Gets the full URL for the oRPC endpoint.
 *
 * @returns The full URL for oRPC requests (always absolute)
 */
export function getOrpcUrl(): string {
	const isClientSide = typeof window !== "undefined";

	// Client-side in preview: use proxy route with window.location.origin
	// This ensures same-origin requests even when NEXT_PUBLIC_VERCEL_URL differs
	if (shouldUseProxy(isClientSide)) {
		return `${getClientOrigin()}/api/proxy/rpc`;
	}

	// Server-side in preview: use direct API server URL if available
	if (!isClientSide && isPreviewEnvironment()) {
		const apiServerUrl =
			process.env.NEXT_PUBLIC_API_SERVER_URL ||
			process.env.API_SERVER_URL;
		if (apiServerUrl) {
			return `${apiServerUrl}/api/rpc`;
		}
	}

	// Default: use same-origin API route
	return `${getBaseUrl()}/api/rpc`;
}
