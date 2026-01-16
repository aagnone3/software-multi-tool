import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

	// Adjust sample rate for production to control volume
	tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

	// Setting this option to true will print useful information to the console while you're setting up Sentry.
	debug: false,

	// Configure environment
	environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,

	// Configure release tracking
	release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

	// Configure data scrubbing
	beforeSend(event, _hint) {
		// Scrub sensitive environment variables
		if (event.contexts?.app?.environment) {
			const env = event.contexts.app.environment as Record<
				string,
				unknown
			>;
			const sensitiveKeys = [
				"DATABASE_URL",
				"BETTER_AUTH_SECRET",
				"GITHUB_CLIENT_SECRET",
				"GOOGLE_CLIENT_SECRET",
				"STRIPE_SECRET_KEY",
				"STRIPE_WEBHOOK_SECRET",
				"OPENAI_API_KEY",
				"ANTHROPIC_API_KEY",
				"S3_ACCESS_KEY_ID",
				"S3_SECRET_ACCESS_KEY",
			];

			for (const key of sensitiveKeys) {
				if (env[key]) {
					env[key] = "[Filtered]";
				}
			}
		}

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
				"x-stripe-signature",
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
