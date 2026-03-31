"use client";

import { useSession } from "@saas/auth/hooks/use-session";
import { usePurchases } from "@saas/payments/hooks/purchases";
import { PostHogIdentityProvider } from "./PostHogIdentityProvider";

/**
 * Client component that reads session + plan from context/hooks
 * and syncs identity to PostHog. Render inside SessionProvider.
 */
export function PostHogIdentitySync() {
	const { user, session } = useSession();
	const { activePlan } = usePurchases();

	if (!user) {
		return null;
	}

	return (
		<PostHogIdentityProvider
			userId={user.id}
			email={user.email}
			name={user.name}
			organizationId={session?.activeOrganizationId ?? null}
			planId={activePlan?.id ?? "free"}
		/>
	);
}
