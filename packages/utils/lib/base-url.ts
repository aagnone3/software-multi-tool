/**
 * Get the base URL for the current environment.
 *
 * Priority:
 * 1. BETTER_AUTH_URL - explicit auth URL (used by Better Auth)
 * 2. NEXT_PUBLIC_SITE_URL - production site URL
 * 3. VERCEL_URL - Vercel runtime URL (available at runtime, not build)
 * 4. NEXT_PUBLIC_VERCEL_URL - Vercel URL exposed to client
 * 5. localhost fallback
 *
 * Note: VERCEL_URL is automatically set by Vercel at runtime for all deployments,
 * while NEXT_PUBLIC_VERCEL_URL is only available if explicitly exposed.
 * In preview environments, VERCEL_URL gives us the deployment-specific URL.
 */
export function getBaseUrl() {
	// Explicit Better Auth URL takes precedence
	if (process.env.BETTER_AUTH_URL) {
		return process.env.BETTER_AUTH_URL;
	}

	// Production site URL
	if (process.env.NEXT_PUBLIC_SITE_URL) {
		// In production Vercel, use the site URL
		// But in preview deployments, prefer the deployment-specific URL
		if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
			return `https://${process.env.VERCEL_URL}`;
		}
		return process.env.NEXT_PUBLIC_SITE_URL;
	}

	// Vercel runtime URL (available at runtime, not build time)
	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`;
	}

	// Client-exposed Vercel URL
	if (process.env.NEXT_PUBLIC_VERCEL_URL) {
		return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
	}

	// Local development fallback
	return `http://localhost:${process.env.PORT ?? 3500}`;
}
