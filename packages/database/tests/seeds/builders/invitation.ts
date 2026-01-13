import type { Prisma } from "@prisma/client";
import { daysFromNow, generateEmail, generateId } from "../utils.js";

/**
 * Default values for creating an Invitation in tests
 */
const INVITATION_DEFAULTS = {
	id: () => generateId(),
	email: () => generateEmail("invite"),
	role: () => "member",
	status: () => "pending",
	expiresAt: () => daysFromNow(7), // 7 days from now
} as const;

/**
 * Type for invitation creation data without expanded relations
 */
export type InvitationSeedData = Omit<
	Prisma.InvitationCreateInput,
	"organization" | "user"
> & {
	organizationId: string;
	inviterId: string;
};

/**
 * Builds an Invitation object for testing with sensible defaults
 *
 * @param organizationId - ID of the organization
 * @param inviterId - ID of the user sending the invitation
 * @param overrides - Partial invitation data to override defaults
 * @returns Invitation creation data ready for Prisma
 *
 * @example
 * ```ts
 * // Create pending invitation
 * const invitation = buildInvitation(orgId, userId);
 *
 * // Create accepted invitation with custom email
 * const accepted = buildInvitation(orgId, userId, {
 *   email: 'user@example.com',
 *   status: 'accepted'
 * });
 * ```
 */
export function buildInvitation(
	organizationId: string,
	inviterId: string,
	overrides: Partial<
		Omit<InvitationSeedData, "organizationId" | "inviterId">
	> = {},
): InvitationSeedData {
	return {
		id: overrides.id ?? INVITATION_DEFAULTS.id(),
		organizationId,
		email: overrides.email ?? INVITATION_DEFAULTS.email(),
		role: overrides.role ?? INVITATION_DEFAULTS.role(),
		status: overrides.status ?? INVITATION_DEFAULTS.status(),
		expiresAt: overrides.expiresAt ?? INVITATION_DEFAULTS.expiresAt(),
		inviterId,
	};
}
