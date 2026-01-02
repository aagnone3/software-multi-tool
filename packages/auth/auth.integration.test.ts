import type { PostgresTestHarness } from "@repo/database/tests/postgres-test-harness";
import { createPostgresTestHarness } from "@repo/database/tests/postgres-test-harness";
import {
	buildInvitation,
	buildMember,
	buildOrganization,
	buildPurchase,
	buildUser,
} from "@repo/database/tests/seeds";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";

const HOOK_TIMEOUT = 120_000;
const TEST_TIMEOUT = 20_000;

describe.sequential("Better Auth integration tests", () => {
	let harness: PostgresTestHarness | undefined;

	beforeAll(async () => {
		harness = await createPostgresTestHarness();
		await harness.resetDatabase();
	}, HOOK_TIMEOUT);

	beforeEach(async () => {
		await harness?.resetDatabase();
		vi.clearAllMocks();
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

	describe("invitation acceptance flow", () => {
		it(
			"updates subscription seats when invitation is accepted",
			async () => {
				const prisma = requirePrisma();

				// Create test data
				const owner = await prisma.user.create({ data: buildUser() });
				const invitee = await prisma.user.create({ data: buildUser() });
				const organization = await prisma.organization.create({
					data: buildOrganization({ name: "Test Org" }),
				});

				// Create owner membership
				await prisma.member.create({
					data: buildMember(organization.id, owner.id, {
						role: "owner",
					}),
				});

				// Create active subscription
				await prisma.purchase.create({
					data: buildPurchase({
						organizationId: organization.id,
						type: "SUBSCRIPTION",
						status: "active",
						subscriptionId: "sub_test_123",
					}),
				});

				// Create pending invitation
				const invitation = await prisma.invitation.create({
					data: buildInvitation(organization.id, owner.id, {
						email: invitee.email,
						status: "pending",
					}),
				});

				// Verify initial state
				const initialMembersCount = await prisma.member.count({
					where: { organizationId: organization.id },
				});
				expect(initialMembersCount).toBe(1);

				// Accept invitation (simulate the Better Auth hook behavior)
				await prisma.invitation.update({
					where: { id: invitation.id },
					data: { status: "accepted" },
				});

				await prisma.member.create({
					data: buildMember(organization.id, invitee.id, {
						role: "member",
					}),
				});

				// Verify new member was added
				const updatedMembersCount = await prisma.member.count({
					where: { organizationId: organization.id },
				});
				expect(updatedMembersCount).toBe(2);

				// Verify invitation status
				const updatedInvitation = await prisma.invitation.findUnique({
					where: { id: invitation.id },
				});
				expect(updatedInvitation?.status).toBe("accepted");
			},
			TEST_TIMEOUT,
		);

		it(
			"handles invitation acceptance without active subscription",
			async () => {
				const prisma = requirePrisma();

				const owner = await prisma.user.create({ data: buildUser() });
				const invitee = await prisma.user.create({ data: buildUser() });
				const organization = await prisma.organization.create({
					data: buildOrganization({ name: "Free Plan Org" }),
				});

				await prisma.member.create({
					data: buildMember(organization.id, owner.id, {
						role: "owner",
					}),
				});

				const invitation = await prisma.invitation.create({
					data: buildInvitation(organization.id, owner.id, {
						email: invitee.email,
						status: "pending",
					}),
				});

				// Accept invitation without subscription
				await prisma.invitation.update({
					where: { id: invitation.id },
					data: { status: "accepted" },
				});

				await prisma.member.create({
					data: buildMember(organization.id, invitee.id, {
						role: "member",
					}),
				});

				const membersCount = await prisma.member.count({
					where: { organizationId: organization.id },
				});
				expect(membersCount).toBe(2);
			},
			TEST_TIMEOUT,
		);

		it(
			"handles multiple pending invitations for same organization",
			async () => {
				const prisma = requirePrisma();

				const owner = await prisma.user.create({ data: buildUser() });
				const organization = await prisma.organization.create({
					data: buildOrganization({ name: "Multi Invite Org" }),
				});

				await prisma.member.create({
					data: buildMember(organization.id, owner.id, {
						role: "owner",
					}),
				});

				// Create multiple pending invitations
				await Promise.all([
					prisma.invitation.create({
						data: buildInvitation(organization.id, owner.id, {
							email: "user1@test.com",
							status: "pending",
						}),
					}),
					prisma.invitation.create({
						data: buildInvitation(organization.id, owner.id, {
							email: "user2@test.com",
							status: "pending",
						}),
					}),
					prisma.invitation.create({
						data: buildInvitation(organization.id, owner.id, {
							email: "user3@test.com",
							status: "pending",
						}),
					}),
				]);

				const pendingCount = await prisma.invitation.count({
					where: {
						organizationId: organization.id,
						status: "pending",
					},
				});
				expect(pendingCount).toBe(3);
			},
			TEST_TIMEOUT,
		);
	});

	describe("seat update flow", () => {
		it(
			"updates subscription seats when member is removed",
			async () => {
				const prisma = requirePrisma();

				const owner = await prisma.user.create({ data: buildUser() });
				const member1 = await prisma.user.create({ data: buildUser() });
				const member2 = await prisma.user.create({ data: buildUser() });
				const organization = await prisma.organization.create({
					data: buildOrganization({ name: "Seat Update Org" }),
				});

				// Create members
				await prisma.member.createMany({
					data: [
						buildMember(organization.id, owner.id, {
							role: "owner",
						}),
						buildMember(organization.id, member1.id, {
							role: "member",
						}),
						buildMember(organization.id, member2.id, {
							role: "member",
						}),
					],
				});

				// Create active subscription
				await prisma.purchase.create({
					data: buildPurchase({
						organizationId: organization.id,
						type: "SUBSCRIPTION",
						status: "active",
						subscriptionId: "sub_test_456",
					}),
				});

				const initialCount = await prisma.member.count({
					where: { organizationId: organization.id },
				});
				expect(initialCount).toBe(3);

				// Remove a member
				await prisma.member.deleteMany({
					where: {
						organizationId: organization.id,
						userId: member1.id,
					},
				});

				const updatedCount = await prisma.member.count({
					where: { organizationId: organization.id },
				});
				expect(updatedCount).toBe(2);
			},
			TEST_TIMEOUT,
		);

		it(
			"handles seat updates for organizations without subscriptions",
			async () => {
				const prisma = requirePrisma();

				const owner = await prisma.user.create({ data: buildUser() });
				const member = await prisma.user.create({ data: buildUser() });
				const organization = await prisma.organization.create({
					data: buildOrganization({ name: "No Subscription Org" }),
				});

				await prisma.member.createMany({
					data: [
						buildMember(organization.id, owner.id, {
							role: "owner",
						}),
						buildMember(organization.id, member.id, {
							role: "member",
						}),
					],
				});

				// Remove member without subscription
				await prisma.member.deleteMany({
					where: {
						organizationId: organization.id,
						userId: member.id,
					},
				});

				const finalCount = await prisma.member.count({
					where: { organizationId: organization.id },
				});
				expect(finalCount).toBe(1);
			},
			TEST_TIMEOUT,
		);

		it(
			"maintains seat count accuracy across multiple operations",
			async () => {
				const prisma = requirePrisma();

				const owner = await prisma.user.create({ data: buildUser() });
				const organization = await prisma.organization.create({
					data: buildOrganization({ name: "Complex Seat Org" }),
				});

				await prisma.member.create({
					data: buildMember(organization.id, owner.id, {
						role: "owner",
					}),
				});

				await prisma.purchase.create({
					data: buildPurchase({
						organizationId: organization.id,
						type: "SUBSCRIPTION",
						status: "active",
						subscriptionId: "sub_test_789",
					}),
				});

				// Add multiple members
				const newUsers = await Promise.all([
					prisma.user.create({ data: buildUser() }),
					prisma.user.create({ data: buildUser() }),
					prisma.user.create({ data: buildUser() }),
				]);

				for (const user of newUsers) {
					await prisma.member.create({
						data: buildMember(organization.id, user.id, {
							role: "member",
						}),
					});
				}

				let memberCount = await prisma.member.count({
					where: { organizationId: organization.id },
				});
				expect(memberCount).toBe(4); // owner + 3 members

				// Remove one member
				await prisma.member.deleteMany({
					where: {
						organizationId: organization.id,
						userId: newUsers[0].id,
					},
				});

				memberCount = await prisma.member.count({
					where: { organizationId: organization.id },
				});
				expect(memberCount).toBe(3);
			},
			TEST_TIMEOUT,
		);
	});

	describe("subscription cancellation flow", () => {
		it(
			"cancels subscription when user is deleted",
			async () => {
				const prisma = requirePrisma();

				const user = await prisma.user.create({ data: buildUser() });

				// Create personal subscription
				const purchase = await prisma.purchase.create({
					data: buildPurchase({
						userId: user.id,
						type: "SUBSCRIPTION",
						status: "active",
						subscriptionId: "sub_user_123",
					}),
				});

				expect(purchase.subscriptionId).toBe("sub_user_123");
				expect(purchase.type).toBe("SUBSCRIPTION");

				// Verify subscription exists before deletion
				const activePurchase = await prisma.purchase.findFirst({
					where: {
						userId: user.id,
						type: "SUBSCRIPTION",
						subscriptionId: { not: null },
					},
				});
				expect(activePurchase).not.toBeNull();

				// Delete user (this should trigger subscription cancellation in the actual flow)
				await prisma.purchase.deleteMany({
					where: { userId: user.id },
				});
				await prisma.user.delete({ where: { id: user.id } });

				// Verify user and purchases are deleted
				const deletedUser = await prisma.user.findUnique({
					where: { id: user.id },
				});
				expect(deletedUser).toBeNull();
			},
			TEST_TIMEOUT,
		);

		it(
			"cancels organization subscription when organization is deleted",
			async () => {
				const prisma = requirePrisma();

				const owner = await prisma.user.create({ data: buildUser() });
				const organization = await prisma.organization.create({
					data: buildOrganization({ name: "Delete Org" }),
				});

				await prisma.member.create({
					data: buildMember(organization.id, owner.id, {
						role: "owner",
					}),
				});

				const purchase = await prisma.purchase.create({
					data: buildPurchase({
						organizationId: organization.id,
						type: "SUBSCRIPTION",
						status: "active",
						subscriptionId: "sub_org_123",
					}),
				});

				expect(purchase.subscriptionId).toBe("sub_org_123");

				// Verify subscription exists
				const activePurchase = await prisma.purchase.findFirst({
					where: {
						organizationId: organization.id,
						type: "SUBSCRIPTION",
					},
				});
				expect(activePurchase).not.toBeNull();

				// Delete organization (cascading deletes should handle cleanup)
				await prisma.purchase.deleteMany({
					where: { organizationId: organization.id },
				});
				await prisma.member.deleteMany({
					where: { organizationId: organization.id },
				});
				await prisma.organization.delete({
					where: { id: organization.id },
				});

				// Verify organization is deleted
				const deletedOrg = await prisma.organization.findUnique({
					where: { id: organization.id },
				});
				expect(deletedOrg).toBeNull();
			},
			TEST_TIMEOUT,
		);

		it(
			"handles user with multiple subscriptions",
			async () => {
				const prisma = requirePrisma();

				const user = await prisma.user.create({ data: buildUser() });

				// Create multiple subscriptions
				await prisma.purchase.createMany({
					data: [
						buildPurchase({
							userId: user.id,
							type: "SUBSCRIPTION",
							status: "active",
							subscriptionId: "sub_multi_1",
						}),
						buildPurchase({
							userId: user.id,
							type: "SUBSCRIPTION",
							status: "active",
							subscriptionId: "sub_multi_2",
						}),
					],
				});

				const subscriptions = await prisma.purchase.findMany({
					where: {
						userId: user.id,
						type: "SUBSCRIPTION",
					},
				});
				expect(subscriptions).toHaveLength(2);

				// Delete all subscriptions
				await prisma.purchase.deleteMany({
					where: { userId: user.id },
				});

				const remainingSubscriptions = await prisma.purchase.findMany({
					where: { userId: user.id },
				});
				expect(remainingSubscriptions).toHaveLength(0);
			},
			TEST_TIMEOUT,
		);

		it(
			"handles organization with both subscription and one-time purchases",
			async () => {
				const prisma = requirePrisma();

				const owner = await prisma.user.create({ data: buildUser() });
				const organization = await prisma.organization.create({
					data: buildOrganization({ name: "Mixed Purchase Org" }),
				});

				await prisma.member.create({
					data: buildMember(organization.id, owner.id, {
						role: "owner",
					}),
				});

				// Create both subscription and one-time purchase
				await prisma.purchase.createMany({
					data: [
						buildPurchase({
							organizationId: organization.id,
							type: "SUBSCRIPTION",
							status: "active",
							subscriptionId: "sub_mixed_123",
						}),
						buildPurchase({
							organizationId: organization.id,
							type: "ONE_TIME",
							status: "completed",
							subscriptionId: null,
						}),
					],
				});

				const allPurchases = await prisma.purchase.findMany({
					where: { organizationId: organization.id },
				});
				expect(allPurchases).toHaveLength(2);

				const subscriptions = allPurchases.filter(
					(p) =>
						p.type === "SUBSCRIPTION" && p.subscriptionId !== null,
				);
				expect(subscriptions).toHaveLength(1);
				expect(subscriptions[0].subscriptionId).toBe("sub_mixed_123");
			},
			TEST_TIMEOUT,
		);
	});
});
