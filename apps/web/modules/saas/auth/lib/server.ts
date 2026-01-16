import "server-only";
import { auth } from "@repo/auth";
import { getInvitationById } from "@repo/database";
import { headers } from "next/headers";
import { cache } from "react";

export const getSession = cache(async () => {
	const session = await auth.api.getSession({
		headers: await headers(),
		query: {
			disableCookieCache: true,
		},
	});

	return session;
});

export const getActiveOrganization = cache(async (slug: string) => {
	try {
		const activeOrganization = await auth.api.getFullOrganization({
			query: {
				organizationSlug: slug,
			},
			headers: await headers(),
		});

		return activeOrganization;
	} catch {
		return null;
	}
});

export const getOrganizationList = cache(async () => {
	try {
		const organizationList = await auth.api.listOrganizations({
			headers: await headers(),
		});

		return organizationList;
	} catch {
		return [];
	}
});

export const getUserAccounts = cache(async () => {
	try {
		const userAccounts = await auth.api.listUserAccounts({
			headers: await headers(),
		});

		return userAccounts;
	} catch {
		return [];
	}
});

export const getUserPasskeys = cache(async () => {
	try {
		const userPasskeys = await auth.api.listPasskeys({
			headers: await headers(),
		});

		return userPasskeys;
	} catch {
		return [];
	}
});

export const getInvitation = cache(async (id: string) => {
	try {
		return await getInvitationById(id);
	} catch {
		return null;
	}
});

/**
 * Syncs the session's activeOrganizationId with the target organization.
 * Only makes a database call if there's a mismatch.
 *
 * Call this in organization layouts before prefetching queries to ensure
 * API procedures that rely on session.activeOrganizationId work correctly.
 *
 * @param currentActiveOrgId - The session's current activeOrganizationId
 * @param targetOrgId - The organization ID from the URL
 */
export async function syncActiveOrganization(
	currentActiveOrgId: string | null | undefined,
	targetOrgId: string,
): Promise<void> {
	if (currentActiveOrgId === targetOrgId) {
		return; // Already in sync
	}

	await auth.api.setActiveOrganization({
		body: { organizationId: targetOrgId },
		headers: await headers(),
	});
}
