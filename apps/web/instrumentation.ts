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
	// Skip instrumentation during build
	// instrumentation.ts runs during Next.js build which conflicts with static page generation
	// Sentry is still initialized via:
	// - Client: sentry.client.config.ts (imported automatically)
	// - Server: withSentryConfig in next.config.ts
	// - Runtime: Sentry SDK auto-instruments on first request
	if (typeof window === "undefined") {
		// Only run on server runtime (not during build)
		if (process.env.NEXT_RUNTIME === "nodejs") {
			await import("./sentry.server.config");
		}

		if (process.env.NEXT_RUNTIME === "edge") {
			await import("./sentry.edge.config");
		}
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
