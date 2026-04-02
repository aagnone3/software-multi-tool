"use client";

import posthog from "posthog-js";
import { useEffect, useRef } from "react";

interface PostHogIdentityProviderProps {
	userId: string;
	email?: string | null;
	name?: string | null;
	organizationId?: string | null;
	planId?: string | null;
}

export function PostHogIdentityProvider({
	userId,
	email,
	name,
	organizationId,
	planId,
}: PostHogIdentityProviderProps) {
	const previousUserIdRef = useRef<string | null>(null);

	useEffect(() => {
		if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
			return;
		}

		// Reset if user changed
		if (previousUserIdRef.current && previousUserIdRef.current !== userId) {
			posthog.reset();
		}

		posthog.identify(userId, {
			...(email && { email }),
			...(name && { name }),
		});

		// Authenticated users implicitly consent to analytics by creating an account.
		// Opt in unconditionally — cookie banner consent is only for anonymous visitors.
		posthog.opt_in_capturing();

		if (organizationId) {
			posthog.group("organization", organizationId, {
				...(planId && { plan: planId }),
			});
		}

		previousUserIdRef.current = userId;

		return () => {
			if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
				// On logout, revert to requiring explicit consent for anonymous sessions.
				posthog.opt_out_capturing();
				posthog.reset();
			}
		};
	}, [userId, email, name, organizationId, planId]);

	return null;
}
