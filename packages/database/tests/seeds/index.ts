/**
 * Shared Prisma seed utilities for tests
 *
 * This module provides builder functions to create test data with sensible defaults.
 * All builders return plain objects ready to be inserted into the database via Prisma.
 *
 * @example
 * ```ts
 * import { buildUser, buildOrganization, buildMember } from '@repo/database/tests/seeds';
 * import { db } from '@repo/database';
 *
 * // Create test data
 * const user = await db.user.create({ data: buildUser() });
 * const org = await db.organization.create({ data: buildOrganization() });
 * const member = await db.member.create({
 *   data: buildMember(org.id, user.id, { role: 'owner' })
 * });
 * ```
 *
 * @module seeds
 */

export type { InvitationSeedData } from "./builders/invitation.js";
export { buildInvitation } from "./builders/invitation.js";
export type { MemberSeedData } from "./builders/member.js";
export { buildMember } from "./builders/member.js";
export type { OrganizationSeedData } from "./builders/organization.js";
export { buildOrganization } from "./builders/organization.js";
export type { PurchaseSeedData } from "./builders/purchase.js";
export { buildPurchase } from "./builders/purchase.js";
export type { UserSeedData } from "./builders/user.js";
// Export all builder functions
export { buildUser } from "./builders/user.js";

// Export utility functions
export {
	daysFromNow,
	generateEmail,
	generateId,
	generateName,
	now,
} from "./utils.js";

// Note: createFixtures is available in ./fixtures.js but not exported here
// to avoid importing the db client singleton during module evaluation.
// Import directly from ./fixtures.js when needed:
// import { createFixtures } from '@repo/database/tests/seeds/fixtures';
