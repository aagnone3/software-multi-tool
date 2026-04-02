"use client";

import { useCookieConsent } from "@shared/hooks/cookie-consent";
import posthog from "posthog-js";
import { useEffect } from "react";

export function AnalyticsScript() {
	const { userHasConsented } = useCookieConsent();

	useEffect(() => {
		const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY as string;
		if (!posthogKey) {
			return;
		}

		if (!posthog.__loaded) {
			posthog.init(posthogKey, {
				api_host:
					process.env.NEXT_PUBLIC_POSTHOG_HOST ||
					"https://us.i.posthog.com",
				person_profiles: "always",
				opt_out_capturing_by_default: true,
				capture_pageview: true,
				capture_pageleave: true,
				loaded: (ph) => {
					if (process.env.NODE_ENV === "development") {
						ph.debug();
					}
				},
			});
		}

		if (userHasConsented) {
			posthog.opt_in_capturing();
		} else {
			posthog.opt_out_capturing();
		}
	}, [userHasConsented]);

	return null;
}

export function useAnalytics() {
	const trackEvent = (event: string, data?: Record<string, unknown>) => {
		const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY as string;
		if (!posthogKey) {
			return;
		}
		posthog.capture(event, data);
	};

	return { trackEvent };
}

export type {
	FeatureFlagMap,
	FeatureFlagProviderProps,
	FeatureFlagValue,
} from "./feature-flags";
export {
	FeatureFlagProvider,
	useFeatureFlag,
	useFeatureFlagContext,
	useFeatureFlags,
	useIsFeatureEnabled,
} from "./feature-flags";
