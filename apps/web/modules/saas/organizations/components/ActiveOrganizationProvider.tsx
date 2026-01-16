"use client";

import { authClient } from "@repo/auth/client";
import { isOrganizationAdmin } from "@repo/auth/lib/helper";
import { config } from "@repo/config";
import { useSession } from "@saas/auth/hooks/use-session";
import { sessionQueryKey } from "@saas/auth/lib/api";
import {
	activeOrganizationQueryKey,
	useActiveOrganizationQuery,
	useOrganizationListQuery,
} from "@saas/organizations/lib/api";
import { useRouter } from "@shared/hooks/router";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import nProgress from "nprogress";
import { type ReactNode, useEffect, useState } from "react";
import { ActiveOrganizationContext } from "../lib/active-organization-context";

export function ActiveOrganizationProvider({
	children,
}: {
	children: ReactNode;
}) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { session, user } = useSession();
	const params = useParams();

	const activeOrganizationSlug = params.organizationSlug as string;

	const { data: activeOrganization } = useActiveOrganizationQuery(
		activeOrganizationSlug,
		{
			enabled: !!activeOrganizationSlug,
		},
	);

	const refetchActiveOrganization = async () => {
		await queryClient.refetchQueries({
			queryKey: activeOrganizationQueryKey(activeOrganizationSlug),
		});
	};

	const setActiveOrganization = async (organizationSlug: string | null) => {
		nProgress.start();
		const { data: newActiveOrganization } =
			await authClient.organization.setActive(
				organizationSlug
					? {
							organizationSlug,
						}
					: {
							organizationId: null,
						},
			);

		if (!newActiveOrganization) {
			nProgress.done();
			return;
		}

		await refetchActiveOrganization();

		if (config.organizations.enableBilling) {
			await queryClient.prefetchQuery(
				orpc.payments.listPurchases.queryOptions({
					input: {
						organizationId: newActiveOrganization.id,
					},
				}),
			);
		}

		await queryClient.setQueryData(sessionQueryKey, (data: any) => {
			return {
				...data,
				session: {
					...data?.session,
					activeOrganizationId: newActiveOrganization.id,
				},
			};
		});

		router.push(`/app/${newActiveOrganization.slug}`);
	};

	const [loaded, setLoaded] = useState(activeOrganization !== undefined);

	useEffect(() => {
		if (!loaded && activeOrganization !== undefined) {
			setLoaded(true);
		}
	}, [activeOrganization]);

	// Defensive fallback: For sessions created before databaseHooks deployment,
	// the session may have activeOrganizationId = null even though the user has orgs.
	// This fetches the user's orgs and sets the first one as active if needed.
	// This can be removed once all legacy sessions have expired.
	const { data: organizations } = useOrganizationListQuery();
	const [hasAttemptedFallback, setHasAttemptedFallback] = useState(false);

	useEffect(() => {
		// Skip if we've already attempted the fallback
		if (hasAttemptedFallback) {
			return;
		}

		// Skip if session doesn't have activeOrganizationId info yet (still loading)
		if (session === undefined) {
			return;
		}

		// Skip if session already has an active organization
		if (session?.activeOrganizationId) {
			return;
		}

		// Skip if organizations haven't loaded yet or user has no organizations
		if (!organizations || organizations.length === 0) {
			return;
		}

		// Session has no active org but user has orgs - apply fallback
		// Defensive fallback for sessions created before databaseHooks deployment
		setHasAttemptedFallback(true);
		const firstOrg = organizations[0];
		if (firstOrg?.slug) {
			// Use async IIFE to properly await the setActive call and update session cache
			(async () => {
				const { data: updatedOrg } =
					await authClient.organization.setActive({
						organizationSlug: firstOrg.slug,
					});

				if (updatedOrg) {
					// Update the session cache so subsequent API calls see the activeOrganizationId
					queryClient.setQueryData(sessionQueryKey, (data: any) => ({
						...data,
						session: {
							...data?.session,
							activeOrganizationId: updatedOrg.id,
						},
					}));
				}
			})();
		}
	}, [session, organizations, hasAttemptedFallback, queryClient]);

	const activeOrganizationUserRole = activeOrganization?.members.find(
		(member) => member.userId === session?.userId,
	)?.role;

	return (
		<ActiveOrganizationContext.Provider
			value={{
				loaded,
				activeOrganization: activeOrganization ?? null,
				activeOrganizationUserRole: activeOrganizationUserRole ?? null,
				isOrganizationAdmin:
					!!activeOrganization &&
					!!user &&
					isOrganizationAdmin(activeOrganization, user),
				setActiveOrganization,
				refetchActiveOrganization,
			}}
		>
			{children}
		</ActiveOrganizationContext.Provider>
	);
}
