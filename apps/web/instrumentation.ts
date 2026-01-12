/**
 * Next.js instrumentation file for global setup.
 * This file is loaded once when the Next.js server starts.
 *
 * Used for:
 * - Initializing Sentry
 * - Setting up global error handlers
 * - Configuring observability tools
 */

export async function register() {
	// Skip instrumentation during build to avoid conflicts with static generation
	if (process.env.NEXT_PHASE === "phase-production-build") {
		return;
	}

	// Only run on server-side
	if (process.env.NEXT_RUNTIME === "nodejs") {
		await import("./sentry.server.config");
	}

	// Only run on edge runtime
	if (process.env.NEXT_RUNTIME === "edge") {
		await import("./sentry.edge.config");
	}
}

// This is called on the client-side (browser)
export const onRequestError = async (
	err: Error,
	request: {
		path: string;
		method: string;
		headers: { [key: string]: string };
	},
) => {
	// Sentry is automatically initialized on the client via sentry.client.config.ts
	// This hook provides additional context for request errors
	const Sentry = await import("@sentry/nextjs");

	Sentry.captureException(err, {
		tags: {
			path: request.path,
			method: request.method,
		},
	});
};
