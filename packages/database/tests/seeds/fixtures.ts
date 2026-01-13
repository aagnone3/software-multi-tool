import type { PrismaClient } from "@prisma/client";
import { db } from "../../prisma/client.js";
import type { InvitationSeedData } from "./builders/invitation.js";
import { buildInvitation } from "./builders/invitation.js";
import type { MemberSeedData } from "./builders/member.js";
import { buildMember } from "./builders/member.js";
import type { OrganizationSeedData } from "./builders/organization.js";
import { buildOrganization } from "./builders/organization.js";
import type { PurchaseSeedData } from "./builders/purchase.js";
import { buildPurchase } from "./builders/purchase.js";
import type { UserSeedData } from "./builders/user.js";
import { buildUser } from "./builders/user.js";

/**
 * Database fixture utilities for integration tests
 *
 * These helpers provide convenient methods to seed the database with test data.
 * They work seamlessly with the Postgres test harness and its resetDatabase() method.
 *
 * @example
 * ```ts
 * import { createFixtures } from '@repo/database/tests/seeds/fixtures';
 *
 * const fixtures = createFixtures();
 *
 * // Create a user
 * const user = await fixtures.createUser({ name: 'John Doe' });
 *
 * // Create an organization with owner
 * const { organization, owner } = await fixtures.createOrganizationWithOwner();
 *
 * // Create a complete org structure
 * const scenario = await fixtures.createOrganizationScenario({
 *   memberCount: 3,
 *   invitationCount: 2
 * });
 * ```
 */

export interface FixtureHelpers {
	/**
	 * Create a user in the database
	 */
	createUser: (overrides?: Partial<UserSeedData>) => Promise<UserSeedData>;

	/**
	 * Create an organization in the database
	 */
	createOrganization: (
		overrides?: Partial<OrganizationSeedData>,
	) => Promise<OrganizationSeedData>;

	/**
	 * Create a member relationship in the database
	 */
	createMember: (
		organizationId: string,
		userId: string,
		overrides?: Partial<Omit<MemberSeedData, "organizationId" | "userId">>,
	) => Promise<MemberSeedData>;

	/**
	 * Create an invitation in the database
	 */
	createInvitation: (
		organizationId: string,
		inviterId: string,
		overrides?: Partial<
			Omit<InvitationSeedData, "organizationId" | "inviterId">
		>,
	) => Promise<InvitationSeedData>;

	/**
	 * Create a purchase in the database
	 */
	createPurchase: (
		overrides?: Partial<PurchaseSeedData>,
	) => Promise<PurchaseSeedData>;

	/**
	 * Create an organization with an owner user
	 */
	createOrganizationWithOwner: (options?: {
		userOverrides?: Partial<UserSeedData>;
		orgOverrides?: Partial<OrganizationSeedData>;
		memberOverrides?: Partial<
			Omit<MemberSeedData, "organizationId" | "userId">
		>;
	}) => Promise<{
		organization: OrganizationSeedData;
		owner: UserSeedData;
		membership: MemberSeedData;
	}>;

	/**
	 * Create a complete organization scenario with members and invitations
	 */
	createOrganizationScenario: (options?: {
		orgOverrides?: Partial<OrganizationSeedData>;
		memberCount?: number;
		invitationCount?: number;
	}) => Promise<{
		organization: OrganizationSeedData;
		owner: UserSeedData;
		members: UserSeedData[];
		invitations: InvitationSeedData[];
	}>;
}

/**
 * Creates fixture helpers for database seeding
 *
 * @param client - Optional Prisma client instance (defaults to singleton db)
 * @returns Object with fixture creation methods
 */
export function createFixtures(client: PrismaClient = db): FixtureHelpers {
	return {
		async createUser(overrides = {}) {
			const data = buildUser(overrides);
			await client.user.create({ data });
			return data;
		},

		async createOrganization(overrides = {}) {
			const data = buildOrganization(overrides);
			await client.organization.create({ data });
			return data;
		},

		async createMember(organizationId, userId, overrides = {}) {
			const data = buildMember(organizationId, userId, overrides);
			await client.member.create({ data });
			return data;
		},

		async createInvitation(organizationId, inviterId, overrides = {}) {
			const data = buildInvitation(organizationId, inviterId, overrides);
			await client.invitation.create({ data });
			return data;
		},

		async createPurchase(overrides = {}) {
			const data = buildPurchase(overrides);
			await client.purchase.create({ data });
			return data;
		},

		async createOrganizationWithOwner(options = {}) {
			const { userOverrides, orgOverrides, memberOverrides } = options;

			const owner = await this.createUser(userOverrides);
			const organization = await this.createOrganization(orgOverrides);
			const membership = await this.createMember(
				organization.id,
				owner.id,
				{ role: "owner", ...memberOverrides },
			);

			return { organization, owner, membership };
		},

		async createOrganizationScenario(options = {}) {
			const {
				orgOverrides,
				memberCount = 0,
				invitationCount = 0,
			} = options;

			const { organization, owner } =
				await this.createOrganizationWithOwner({ orgOverrides });

			const members: UserSeedData[] = [];
			for (let i = 0; i < memberCount; i++) {
				const user = await this.createUser();
				await this.createMember(organization.id, user.id);
				members.push(user);
			}

			const invitations: InvitationSeedData[] = [];
			for (let i = 0; i < invitationCount; i++) {
				const invitation = await this.createInvitation(
					organization.id,
					owner.id,
				);
				invitations.push(invitation);
			}

			return { organization, owner, members, invitations };
		},
	};
}
