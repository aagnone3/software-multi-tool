import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { PostgresTestHarness } from "../../tests/postgres-test-harness";
import { createPostgresTestHarness } from "../../tests/postgres-test-harness";
import {
	buildInvitation,
	buildMember,
	buildOrganization,
	buildPurchase,
	buildUser,
} from "../../tests/seeds";

const HOOK_TIMEOUT = 120_000;
const TEST_TIMEOUT = 20_000;

type OrganizationQueries = typeof import("./organizations");

describe.sequential("organizations queries (integration)", () => {
	let harness: PostgresTestHarness | undefined;
	let queries: OrganizationQueries;

	beforeAll(async () => {
		harness = await createPostgresTestHarness();
		queries = await import("./organizations");
		await harness.resetDatabase();
	}, HOOK_TIMEOUT);

	beforeEach(async () => {
		await harness?.resetDatabase();
	});

	afterAll(async () => {
		await harness?.cleanup();
	}, HOOK_TIMEOUT);

	const requirePrisma = () => {
		if (!harness) {
			throw new Error("Postgres test harness did not initialize.");
		}

		return harness.prisma;
	};

	it(
		"returns organizations with aggregated member counts and name filter",
		async () => {
			const prisma = requirePrisma();

			const owner = await prisma.user.create({ data: buildUser() });
			const alpha = await prisma.organization.create({
				data: buildOrganization({
					name: "Alpha Labs",
					slug: "alpha-labs",
				}),
			});
			const beta = await prisma.organization.create({
				data: buildOrganization({
					name: "Beta Group",
					slug: "beta-group",
				}),
			});

			const secondUser = await prisma.user.create({ data: buildUser() });

			await prisma.member.createMany({
				data: [
					buildMember(alpha.id, owner.id),
					buildMember(alpha.id, secondUser.id),
					buildMember(beta.id, owner.id),
				],
			});

			const organizations = await queries.getOrganizations({
				limit: 10,
				offset: 0,
				query: "beta",
			});

			expect(organizations).toHaveLength(1);
			expect(organizations[0]).toMatchObject({
				id: beta.id,
				name: "Beta Group",
				membersCount: 1,
			});
		},
		TEST_TIMEOUT,
	);

	it(
		"returns organization with purchases and members count",
		async () => {
			const prisma = requirePrisma();

			const user = await prisma.user.create({ data: buildUser() });
			const organization = await prisma.organization.create({
				data: buildOrganization({ name: "Gamma Collective" }),
			});

			await prisma.member.create({
				data: buildMember(organization.id, user.id),
			});

			await prisma.purchase.create({
				data: buildPurchase({
					organizationId: organization.id,
					status: "active",
				}),
			});

			const result =
				await queries.getOrganizationWithPurchasesAndMembersCount(
					organization.id,
				);

			expect(result).not.toBeNull();
			expect(result).toMatchObject({
				id: organization.id,
				membersCount: 1,
			});
			expect(result?.purchases).toHaveLength(1);
		},
		TEST_TIMEOUT,
	);

	it(
		"finds pending invitations and respects status filtering",
		async () => {
			const prisma = requirePrisma();

			const inviter = await prisma.user.create({ data: buildUser() });
			const organization = await prisma.organization.create({
				data: buildOrganization({ name: "Delta Org" }),
			});

			await prisma.invitation.createMany({
				data: [
					buildInvitation(organization.id, inviter.id, {
						email: "join@delta.test",
						status: "pending",
					}),
					buildInvitation(organization.id, inviter.id, {
						email: "join@delta.test",
						status: "accepted",
					}),
				],
			});

			const pending =
				await queries.getPendingInvitationByEmail("join@delta.test");

			expect(pending).not.toBeNull();
			expect(pending?.status).toBe("pending");
		},
		TEST_TIMEOUT,
	);
});

// Note: buildUser, buildOrganization, buildMember, and buildInvitation
// are now imported from shared seed utilities at ../../tests/seeds
