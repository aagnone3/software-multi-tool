/**
 * Check if the current environment is a development/preview environment.
 * This is used to conditionally show development-only features like the quick login button.
 *
 * Returns true in these cases:
 * - NODE_ENV is not "production" (local development)
 * - NEXT_PUBLIC_VERCEL_ENV is "preview" (Vercel preview deployments)
 *
 * Returns false only when:
 * - NODE_ENV is "production" AND NEXT_PUBLIC_VERCEL_ENV is "production" (or not set)
 *
 * @param nodeEnv - The NODE_ENV value (defaults to process.env.NODE_ENV)
 * @param vercelEnv - The NEXT_PUBLIC_VERCEL_ENV value (defaults to process.env.NEXT_PUBLIC_VERCEL_ENV)
 * @returns true if in development/preview environment, false in production
 */
export function isDevEnvironment(
	nodeEnv?: string,
	vercelEnv?: string,
): boolean {
	const env = nodeEnv ?? process.env.NODE_ENV;
	const vercel = vercelEnv ?? process.env.NEXT_PUBLIC_VERCEL_ENV;

	// Local development (NODE_ENV !== "production")
	if (env !== "production") {
		return true;
	}

	// Vercel preview deployment (NODE_ENV is "production" but it's a preview branch)
	if (vercel === "preview") {
		return true;
	}

	// Production environment
	return false;
}
