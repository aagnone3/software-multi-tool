import type { Prisma } from "@prisma/client";
import { generateId, now } from "../utils.js";

/**
 * Default values for creating a Member in tests
 */
const MEMBER_DEFAULTS = {
	id: () => generateId(),
	role: () => "member",
	createdAt: () => now(),
} as const;

/**
 * Type for member creation data without expanded relations
 */
export type MemberSeedData = Omit<
	Prisma.MemberCreateInput,
	"organization" | "user"
> & {
	organizationId: string;
	userId: string;
};

/**
 * Builds a Member object for testing with sensible defaults
 *
 * @param organizationId - ID of the organization
 * @param userId - ID of the user
 * @param overrides - Partial member data to override defaults
 * @returns Member creation data ready for Prisma
 *
 * @example
 * ```ts
 * // Create member with default role
 * const member = buildMember(orgId, userId);
 *
 * // Create member with owner role
 * const owner = buildMember(orgId, userId, { role: 'owner' });
 * ```
 */
export function buildMember(
	organizationId: string,
	userId: string,
	overrides: Partial<Omit<MemberSeedData, "organizationId" | "userId">> = {},
): MemberSeedData {
	return {
		id: overrides.id ?? MEMBER_DEFAULTS.id(),
		organizationId,
		userId,
		role: overrides.role ?? MEMBER_DEFAULTS.role(),
		createdAt: overrides.createdAt ?? MEMBER_DEFAULTS.createdAt(),
	};
}
