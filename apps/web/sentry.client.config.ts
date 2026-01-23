import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

	// Only enable Sentry in production to reduce usage
	enabled: process.env.NEXT_PUBLIC_VERCEL_ENV === "production",

	// Adjust sample rate for production to control volume
	tracesSampleRate: 0.1,

	// Setting this option to true will print useful information to the console while you're setting up Sentry.
	debug: false,

	// Replay configuration for session recordings (reduced to control budget)
	replaysOnErrorSampleRate: 0.1, // Capture 10% of errors with replay
	replaysSessionSampleRate: 0.01, // Capture 1% of sessions

	integrations: [
		Sentry.replayIntegration({
			// Mask all text and input content for privacy
			maskAllText: true,
			blockAllMedia: true,
		}),
	],

	// Configure environment
	environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,

	// Configure release tracking
	release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

	// Configure data scrubbing
	beforeSend(event, _hint) {
		// Scrub sensitive data from breadcrumbs
		if (event.breadcrumbs) {
			event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
				// Remove query parameters that might contain sensitive data
				if (breadcrumb.data?.url) {
					try {
						const url = new URL(breadcrumb.data.url);
						// Remove all query params
						url.search = "";
						breadcrumb.data.url = url.toString();
					} catch {
						// Invalid URL, leave as is
					}
				}
				return breadcrumb;
			});
		}

		// Scrub sensitive headers
		if (event.request?.headers) {
			const sensitiveHeaders = [
				"authorization",
				"cookie",
				"x-api-key",
				"x-auth-token",
			];
			for (const header of sensitiveHeaders) {
				if (event.request.headers[header]) {
					event.request.headers[header] = "[Filtered]";
				}
			}
		}

		return event;
	},
});
