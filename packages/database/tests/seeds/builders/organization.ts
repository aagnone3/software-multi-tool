import type { Prisma } from "../../../prisma/generated/client/index.js";
import { generateId, generateName, now } from "../utils.js";

/**
 * Default values for creating an Organization in tests
 */
const ORGANIZATION_DEFAULTS = {
	id: () => generateId(),
	name: () => generateName("Test Organization"),
	slug: () => null,
	logo: () => null,
	createdAt: () => now(),
	metadata: () => null,
	paymentsCustomerId: () => null,
} as const;

/**
 * Type for organization creation data without relations
 */
export type OrganizationSeedData = Omit<
	Prisma.OrganizationCreateInput,
	"members" | "invitations" | "purchases" | "aiChats"
>;

/**
 * Builds an Organization object for testing with sensible defaults
 *
 * @param overrides - Partial organization data to override defaults
 * @returns Organization creation data ready for Prisma
 *
 * @example
 * ```ts
 * // Create with defaults
 * const org = buildOrganization();
 *
 * // Create with custom name and slug
 * const org = buildOrganization({
 *   name: 'Acme Corp',
 *   slug: 'acme-corp'
 * });
 * ```
 */
export function buildOrganization(
	overrides: Partial<OrganizationSeedData> = {},
): OrganizationSeedData {
	return {
		id: overrides.id ?? ORGANIZATION_DEFAULTS.id(),
		name: overrides.name ?? ORGANIZATION_DEFAULTS.name(),
		slug: overrides.slug ?? ORGANIZATION_DEFAULTS.slug(),
		logo: overrides.logo ?? ORGANIZATION_DEFAULTS.logo(),
		createdAt: overrides.createdAt ?? ORGANIZATION_DEFAULTS.createdAt(),
		metadata: overrides.metadata ?? ORGANIZATION_DEFAULTS.metadata(),
		paymentsCustomerId:
			overrides.paymentsCustomerId ??
			ORGANIZATION_DEFAULTS.paymentsCustomerId(),
	};
}
