/**
 * Integration tests for Row Level Security (RLS) on organization/membership tables.
 *
 * These tests verify that:
 * 1. RLS is properly enabled on organization, member, and invitation tables
 * 2. Prisma (using service role) can still perform CRUD operations
 *
 * Since Prisma connects directly to PostgreSQL (bypassing PostgREST),
 * it uses the service role which bypasses RLS. These tests confirm that
 * enabling RLS doesn't break the organization/membership functionality.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { PostgresTestHarness } from "./postgres-test-harness";
import { createPostgresTestHarness } from "./postgres-test-harness";

const HOOK_TIMEOUT = 120_000;
const TEST_TIMEOUT = 30_000;

describe.sequential("RLS on organization/membership tables (integration)", () => {
	let harness: PostgresTestHarness | undefined;
	let testUserId: string;
	let testOrganizationId: string;

	beforeAll(async () => {
		harness = await createPostgresTestHarness();
	}, HOOK_TIMEOUT);

	beforeEach(async () => {
		if (!harness) {
			throw new Error("Postgres test harness did not initialize.");
		}
		await harness.resetDatabase();

		// Create a test user (required for FK constraints)
		const user = await harness.prisma.user.create({
			data: {
				id: "test-user-1",
				name: "Test User",
				email: "test@example.com",
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});
		testUserId = user.id;

		// Create a test organization (required for FK constraints on member/invitation)
		const organization = await harness.prisma.organization.create({
			data: {
				id: "test-org-1",
				name: "Test Organization",
				slug: "test-org",
				createdAt: new Date(),
			},
		});
		testOrganizationId = organization.id;
	}, TEST_TIMEOUT);

	afterAll(async () => {
		await harness?.cleanup();
	}, HOOK_TIMEOUT);

	describe("RLS configuration verification", () => {
		it(
			"has RLS enabled on organization table",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const result = await harness.prisma.$queryRaw<
					{ relrowsecurity: boolean }[]
				>`
					SELECT relrowsecurity
					FROM pg_class
					WHERE relname = 'organization' AND relnamespace = (
						SELECT oid FROM pg_namespace WHERE nspname = 'public'
					)
				`;

				expect(result).toHaveLength(1);
				expect(result[0].relrowsecurity).toBe(true);
			},
			TEST_TIMEOUT,
		);

		it(
			"has RLS enabled on member table",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const result = await harness.prisma.$queryRaw<
					{ relrowsecurity: boolean }[]
				>`
					SELECT relrowsecurity
					FROM pg_class
					WHERE relname = 'member' AND relnamespace = (
						SELECT oid FROM pg_namespace WHERE nspname = 'public'
					)
				`;

				expect(result).toHaveLength(1);
				expect(result[0].relrowsecurity).toBe(true);
			},
			TEST_TIMEOUT,
		);

		it(
			"has RLS enabled on invitation table",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const result = await harness.prisma.$queryRaw<
					{ relrowsecurity: boolean }[]
				>`
					SELECT relrowsecurity
					FROM pg_class
					WHERE relname = 'invitation' AND relnamespace = (
						SELECT oid FROM pg_namespace WHERE nspname = 'public'
					)
				`;

				expect(result).toHaveLength(1);
				expect(result[0].relrowsecurity).toBe(true);
			},
			TEST_TIMEOUT,
		);
	});

	describe("Organization table CRUD (service role bypasses RLS)", () => {
		it(
			"can create an organization",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const organization = await harness.prisma.organization.create({
					data: {
						id: "new-org-1",
						name: "New Organization",
						slug: "new-org",
						createdAt: new Date(),
					},
				});

				expect(organization).toBeDefined();
				expect(organization.name).toBe("New Organization");
				expect(organization.slug).toBe("new-org");
			},
			TEST_TIMEOUT,
		);

		it(
			"can read organizations with billing info",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				// Update the test organization with billing info
				await harness.prisma.organization.update({
					where: { id: testOrganizationId },
					data: {
						paymentsCustomerId: "cus_test_12345",
						metadata: JSON.stringify({ plan: "pro" }),
					},
				});

				const organization = await harness.prisma.organization.findUnique({
					where: { id: testOrganizationId },
				});

				expect(organization).toBeDefined();
				expect(organization?.paymentsCustomerId).toBe("cus_test_12345");
				expect(organization?.metadata).toContain("pro");
			},
			TEST_TIMEOUT,
		);

		it(
			"can update organization",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const updated = await harness.prisma.organization.update({
					where: { id: testOrganizationId },
					data: {
						name: "Updated Organization Name",
						logo: "https://example.com/logo.png",
					},
				});

				expect(updated.name).toBe("Updated Organization Name");
				expect(updated.logo).toBe("https://example.com/logo.png");
			},
			TEST_TIMEOUT,
		);

		it(
			"can delete an organization",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				// Create a separate organization for deletion test
				await harness.prisma.organization.create({
					data: {
						id: "org-to-delete",
						name: "To Delete",
						slug: "to-delete",
						createdAt: new Date(),
					},
				});

				await harness.prisma.organization.delete({
					where: { id: "org-to-delete" },
				});

				const deleted = await harness.prisma.organization.findUnique({
					where: { id: "org-to-delete" },
				});

				expect(deleted).toBeNull();
			},
			TEST_TIMEOUT,
		);
	});

	describe("Member table CRUD (service role bypasses RLS)", () => {
		it(
			"can create a member",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const member = await harness.prisma.member.create({
					data: {
						id: "member-1",
						organizationId: testOrganizationId,
						userId: testUserId,
						role: "admin",
						createdAt: new Date(),
					},
				});

				expect(member).toBeDefined();
				expect(member.role).toBe("admin");
				expect(member.organizationId).toBe(testOrganizationId);
				expect(member.userId).toBe(testUserId);
			},
			TEST_TIMEOUT,
		);

		it(
			"can read members",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.member.create({
					data: {
						id: "member-1",
						organizationId: testOrganizationId,
						userId: testUserId,
						role: "member",
						createdAt: new Date(),
					},
				});

				const members = await harness.prisma.member.findMany({
					where: { organizationId: testOrganizationId },
				});

				expect(members).toHaveLength(1);
				expect(members[0].role).toBe("member");
			},
			TEST_TIMEOUT,
		);

		it(
			"can update member role",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.member.create({
					data: {
						id: "member-1",
						organizationId: testOrganizationId,
						userId: testUserId,
						role: "member",
						createdAt: new Date(),
					},
				});

				const updated = await harness.prisma.member.update({
					where: { id: "member-1" },
					data: { role: "admin" },
				});

				expect(updated.role).toBe("admin");
			},
			TEST_TIMEOUT,
		);

		it(
			"can delete a member",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.member.create({
					data: {
						id: "member-1",
						organizationId: testOrganizationId,
						userId: testUserId,
						role: "member",
						createdAt: new Date(),
					},
				});

				await harness.prisma.member.delete({
					where: { id: "member-1" },
				});

				const deleted = await harness.prisma.member.findUnique({
					where: { id: "member-1" },
				});

				expect(deleted).toBeNull();
			},
			TEST_TIMEOUT,
		);
	});

	describe("Invitation table CRUD (service role bypasses RLS)", () => {
		it(
			"can create an invitation",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const invitation = await harness.prisma.invitation.create({
					data: {
						id: "invitation-1",
						organizationId: testOrganizationId,
						email: "invitee@example.com",
						role: "member",
						status: "pending",
						expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
						inviterId: testUserId,
					},
				});

				expect(invitation).toBeDefined();
				expect(invitation.email).toBe("invitee@example.com");
				expect(invitation.status).toBe("pending");
				expect(invitation.role).toBe("member");
			},
			TEST_TIMEOUT,
		);

		it(
			"can read invitations",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.invitation.create({
					data: {
						id: "invitation-1",
						organizationId: testOrganizationId,
						email: "invite1@example.com",
						role: "admin",
						status: "pending",
						expiresAt: new Date(Date.now() + 86400000),
						inviterId: testUserId,
					},
				});

				const invitations = await harness.prisma.invitation.findMany({
					where: { organizationId: testOrganizationId },
				});

				expect(invitations).toHaveLength(1);
				expect(invitations[0].email).toBe("invite1@example.com");
				expect(invitations[0].role).toBe("admin");
			},
			TEST_TIMEOUT,
		);

		it(
			"can update invitation status",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.invitation.create({
					data: {
						id: "invitation-1",
						organizationId: testOrganizationId,
						email: "invitee@example.com",
						role: "member",
						status: "pending",
						expiresAt: new Date(Date.now() + 86400000),
						inviterId: testUserId,
					},
				});

				const updated = await harness.prisma.invitation.update({
					where: { id: "invitation-1" },
					data: { status: "accepted" },
				});

				expect(updated.status).toBe("accepted");
			},
			TEST_TIMEOUT,
		);

		it(
			"can delete an invitation",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.invitation.create({
					data: {
						id: "invitation-1",
						organizationId: testOrganizationId,
						email: "to-delete@example.com",
						role: "member",
						status: "pending",
						expiresAt: new Date(Date.now() + 86400000),
						inviterId: testUserId,
					},
				});

				await harness.prisma.invitation.delete({
					where: { id: "invitation-1" },
				});

				const deleted = await harness.prisma.invitation.findUnique({
					where: { id: "invitation-1" },
				});

				expect(deleted).toBeNull();
			},
			TEST_TIMEOUT,
		);
	});

	describe("Cascade delete behavior (RLS doesn't affect FK constraints)", () => {
		it(
			"cascades member deletion when organization is deleted",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				// Create a new org for this test to avoid affecting other tests
				const org = await harness.prisma.organization.create({
					data: {
						id: "cascade-test-org",
						name: "Cascade Test Org",
						slug: "cascade-test",
						createdAt: new Date(),
					},
				});

				await harness.prisma.member.create({
					data: {
						id: "cascade-test-member",
						organizationId: org.id,
						userId: testUserId,
						role: "admin",
						createdAt: new Date(),
					},
				});

				await harness.prisma.organization.delete({
					where: { id: org.id },
				});

				const member = await harness.prisma.member.findUnique({
					where: { id: "cascade-test-member" },
				});

				expect(member).toBeNull();
			},
			TEST_TIMEOUT,
		);

		it(
			"cascades invitation deletion when organization is deleted",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				// Create a new org for this test
				const org = await harness.prisma.organization.create({
					data: {
						id: "cascade-test-org-2",
						name: "Cascade Test Org 2",
						slug: "cascade-test-2",
						createdAt: new Date(),
					},
				});

				await harness.prisma.invitation.create({
					data: {
						id: "cascade-test-invitation",
						organizationId: org.id,
						email: "cascade@example.com",
						role: "member",
						status: "pending",
						expiresAt: new Date(Date.now() + 86400000),
						inviterId: testUserId,
					},
				});

				await harness.prisma.organization.delete({
					where: { id: org.id },
				});

				const invitation = await harness.prisma.invitation.findUnique({
					where: { id: "cascade-test-invitation" },
				});

				expect(invitation).toBeNull();
			},
			TEST_TIMEOUT,
		);

		it(
			"cascades member deletion when user is deleted",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				// Create a new user for this test
				const user = await harness.prisma.user.create({
					data: {
						id: "cascade-test-user",
						name: "Cascade Test User",
						email: "cascade-user@example.com",
						emailVerified: true,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				await harness.prisma.member.create({
					data: {
						id: "cascade-user-member",
						organizationId: testOrganizationId,
						userId: user.id,
						role: "member",
						createdAt: new Date(),
					},
				});

				await harness.prisma.user.delete({
					where: { id: user.id },
				});

				const member = await harness.prisma.member.findUnique({
					where: { id: "cascade-user-member" },
				});

				expect(member).toBeNull();
			},
			TEST_TIMEOUT,
		);

		it(
			"cascades invitation deletion when inviter user is deleted",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				// Create a new user for this test
				const inviter = await harness.prisma.user.create({
					data: {
						id: "cascade-inviter-user",
						name: "Cascade Inviter",
						email: "cascade-inviter@example.com",
						emailVerified: true,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				await harness.prisma.invitation.create({
					data: {
						id: "cascade-inviter-invitation",
						organizationId: testOrganizationId,
						email: "invited-by-cascade@example.com",
						role: "member",
						status: "pending",
						expiresAt: new Date(Date.now() + 86400000),
						inviterId: inviter.id,
					},
				});

				await harness.prisma.user.delete({
					where: { id: inviter.id },
				});

				const invitation = await harness.prisma.invitation.findUnique({
					where: { id: "cascade-inviter-invitation" },
				});

				expect(invitation).toBeNull();
			},
			TEST_TIMEOUT,
		);
	});
});
