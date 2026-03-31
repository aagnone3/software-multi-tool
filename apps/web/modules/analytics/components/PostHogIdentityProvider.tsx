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

		if (organizationId) {
			posthog.group("organization", organizationId, {
				...(planId && { plan: planId }),
			});
		}

		previousUserIdRef.current = userId;

		return () => {
			if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
				posthog.reset();
			}
		};
	}, [userId, email, name, organizationId, planId]);

	return null;
}
