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
	const hasOrgSlugInUrl = !!activeOrganizationSlug;

	const { data: activeOrganization, isFetched } = useActiveOrganizationQuery(
		activeOrganizationSlug,
		{
			enabled: hasOrgSlugInUrl,
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

	// Determine if we've loaded the organization state:
	// - If no org slug in URL: we're "loaded" immediately (there's nothing to load)
	// - If org slug in URL: we're loaded once the query has fetched
	// This prevents the race condition where navigating from /app/org to /app/settings
	// would leave `loaded: true` but `activeOrganization: null`, triggering warnings.
	const loaded = hasOrgSlugInUrl ? isFetched : true;

	// TODO(2026-02-15): Remove this fallback after all legacy sessions have expired.
	// Legacy fallback: For sessions created before databaseHooks deployment (2026-01-16),
	// the session may have activeOrganizationId = null even though the user has orgs.
	// This fetches the user's orgs and sets the first one as active if needed.
	// Sessions have a 30-day max age, so by 2026-02-15 all legacy sessions should be expired.
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
				isOrgRoute: hasOrgSlugInUrl,
				setActiveOrganization,
				refetchActiveOrganization,
			}}
		>
			{children}
		</ActiveOrganizationContext.Provider>
	);
}
