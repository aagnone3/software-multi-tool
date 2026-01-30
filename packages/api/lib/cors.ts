import { getBaseUrl } from "@repo/utils";

/**
 * Build list of trusted origins for CORS validation
 *
 * Matches the pattern used in Better Auth for consistency
 */
export function getTrustedOrigins(): string[] {
	const appUrl = getBaseUrl();
	const trustedOrigins = [appUrl];

	// Add Vercel wildcard for preview environments
	if (process.env.VERCEL) {
		trustedOrigins.push("https://*.vercel.app");
	}

	return trustedOrigins;
}

/**
 * Check if an origin matches a pattern (supports wildcards)
 *
 * Examples:
 * - "https://example.com" matches exactly "https://example.com"
 * - "https://*.vercel.app" matches "https://my-app-pr-123.vercel.app"
 * - "https://*.vercel.app" does NOT match "https://vercel.app" (subdomain required)
 * - "https://*.vercel.app" does NOT match "https://evil.com"
 *
 * @param origin - The origin to test (e.g., "https://my-app-pr-123.vercel.app")
 * @param pattern - The pattern to match against (e.g., "https://*.vercel.app")
 * @returns True if origin matches pattern
 */
export function matchesOriginPattern(origin: string, pattern: string): boolean {
	// Exact match (no wildcard)
	if (pattern === origin) {
		return true;
	}

	// Wildcard match
	if (pattern.includes("*")) {
		// Convert wildcard pattern to regex
		// Escape special regex characters except *
		const regexPattern = pattern
			.replace(/[.+?^${}()|[\]\\]/g, "\\$&") // Escape special chars
			.replace(/\*/g, "([a-zA-Z0-9-]+)"); // Replace * with subdomain pattern

		const regex = new RegExp(`^${regexPattern}$`);
		return regex.test(origin);
	}

	return false;
}

/**
 * CORS origin validator for Hono middleware
 *
 * Validates incoming requests against trusted origins list.
 * Supports wildcard patterns for Vercel preview deployments.
 *
 * @param requestOrigin - The Origin header from the request
 * @returns The origin if valid, undefined if invalid
 */
export function validateCorsOrigin(requestOrigin: string): string | undefined {
	// No origin header = invalid
	if (!requestOrigin) {
		return undefined;
	}

	const trustedOrigins = getTrustedOrigins();

	// Check if request origin matches any trusted origin pattern
	for (const pattern of trustedOrigins) {
		if (matchesOriginPattern(requestOrigin, pattern)) {
			// Return the actual origin (not the wildcard pattern)
			return requestOrigin;
		}
	}

	// Origin not trusted
	return undefined;
}
