import type { z } from "zod";
import { db } from "../client";
import type { OrganizationSchema } from "../zod";

export async function getOrganizations({
	limit,
	offset,
	query,
}: {
	limit: number;
	offset: number;
	query?: string;
}) {
	return db.organization
		.findMany({
			where: {
				name: { contains: query, mode: "insensitive" },
			},
			include: {
				_count: {
					select: {
						members: true,
					},
				},
			},
			take: limit,
			skip: offset,
		})
		.then((res) =>
			res.map((org) => ({
				...org,
				membersCount: org._count.members,
			})),
		);
}

export async function countAllOrganizations() {
	return db.organization.count();
}

export async function getOrganizationById(id: string) {
	return db.organization.findUnique({
		where: { id },
		include: {
			members: true,
			invitations: true,
		},
	});
}

export async function getInvitationById(id: string) {
	return db.invitation.findUnique({
		where: { id },
		include: {
			organization: true,
		},
	});
}

export async function getOrganizationBySlug(slug: string) {
	return db.organization.findUnique({
		where: { slug },
	});
}

export async function getOrganizationMembership(
	organizationId: string,
	userId: string,
) {
	return db.member.findUnique({
		where: {
			organizationId_userId: {
				organizationId,
				userId,
			},
		},
		include: {
			organization: true,
		},
	});
}

export async function getOrganizationWithPurchasesAndMembersCount(
	organizationId: string,
) {
	const organization = await db.organization.findUnique({
		where: {
			id: organizationId,
		},
		include: {
			purchases: true,
			_count: {
				select: {
					members: true,
				},
			},
		},
	});

	return organization
		? {
				...organization,
				membersCount: organization._count.members,
			}
		: null;
}

export async function getPendingInvitationByEmail(email: string) {
	return db.invitation.findFirst({
		where: {
			email,
			status: "pending",
		},
	});
}

export async function updateOrganization(
	organization: Partial<z.infer<typeof OrganizationSchema>> & { id: string },
) {
	return db.organization.update({
		where: {
			id: organization.id,
		},
		data: organization,
	});
}

/**
 * Get an organization by its payments customer ID (e.g., Stripe customer ID).
 * Used to look up organization from webhook events.
 */
export async function getOrganizationByPaymentsCustomerId(
	paymentsCustomerId: string,
) {
	return db.organization.findFirst({
		where: { paymentsCustomerId },
	});
}

/**
 * Get the first organization for a user based on their membership.
 * Used by Better Auth databaseHooks to set initial activeOrganizationId at session creation.
 *
 * Returns the oldest organization the user is a member of (by membership createdAt),
 * providing deterministic behavior for first-login scenarios.
 *
 * @param userId - The user ID to find organizations for
 * @returns The first organization or null if user has no organizations
 */
export async function getFirstOrganizationForUser(userId: string) {
	const membership = await db.member.findFirst({
		where: { userId },
		orderBy: { createdAt: "asc" },
		include: { organization: true },
	});

	return membership?.organization ?? null;
}
