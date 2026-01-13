import { os } from "@orpc/server";
import type { Locale } from "@repo/mail";

/** Default locale (English only - i18n removed) */
const DEFAULT_LOCALE: Locale = "en";

export const localeMiddleware = os
	.$context<{
		headers: Headers;
	}>()
	.middleware(async ({ next }) => {
		// Always use English (i18n removed)
		const locale: Locale = DEFAULT_LOCALE;

		return await next({
			context: {
				locale,
			},
		});
	});
