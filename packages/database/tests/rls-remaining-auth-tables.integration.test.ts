/**
 * Integration tests for Row Level Security (RLS) on remaining auth tables.
 *
 * These tests verify that:
 * 1. RLS is properly enabled on user, passkey, and verification tables
 * 2. Prisma (using service role) can still perform CRUD operations
 *
 * Since Prisma connects directly to PostgreSQL (bypassing PostgREST),
 * it uses the service role which bypasses RLS. These tests confirm that
 * enabling RLS doesn't break the Better Auth integration.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { PostgresTestHarness } from "./postgres-test-harness";
import { createPostgresTestHarness } from "./postgres-test-harness";

const HOOK_TIMEOUT = 120_000;
const TEST_TIMEOUT = 30_000;

describe.sequential("RLS on remaining auth tables (integration)", () => {
	let harness: PostgresTestHarness | undefined;
	let testUserId: string;

	beforeAll(async () => {
		harness = await createPostgresTestHarness();
	}, HOOK_TIMEOUT);

	beforeEach(async () => {
		if (!harness) {
			throw new Error("Postgres test harness did not initialize.");
		}
		await harness.resetDatabase();

		// Create a test user (required for FK constraints on auth tables)
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
	}, TEST_TIMEOUT);

	afterAll(async () => {
		await harness?.cleanup();
	}, HOOK_TIMEOUT);

	describe("RLS configuration verification", () => {
		it(
			"has RLS enabled on user table",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const result = await harness.prisma.$queryRaw<
					{ relrowsecurity: boolean }[]
				>`
					SELECT relrowsecurity
					FROM pg_class
					WHERE relname = 'user' AND relnamespace = (
						SELECT oid FROM pg_namespace WHERE nspname = 'public'
					)
				`;

				expect(result).toHaveLength(1);
				expect(result[0].relrowsecurity).toBe(true);
			},
			TEST_TIMEOUT,
		);

		it(
			"has RLS enabled on passkey table",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const result = await harness.prisma.$queryRaw<
					{ relrowsecurity: boolean }[]
				>`
					SELECT relrowsecurity
					FROM pg_class
					WHERE relname = 'passkey' AND relnamespace = (
						SELECT oid FROM pg_namespace WHERE nspname = 'public'
					)
				`;

				expect(result).toHaveLength(1);
				expect(result[0].relrowsecurity).toBe(true);
			},
			TEST_TIMEOUT,
		);

		it(
			"has RLS enabled on verification table",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const result = await harness.prisma.$queryRaw<
					{ relrowsecurity: boolean }[]
				>`
					SELECT relrowsecurity
					FROM pg_class
					WHERE relname = 'verification' AND relnamespace = (
						SELECT oid FROM pg_namespace WHERE nspname = 'public'
					)
				`;

				expect(result).toHaveLength(1);
				expect(result[0].relrowsecurity).toBe(true);
			},
			TEST_TIMEOUT,
		);
	});

	describe("User table CRUD (service role bypasses RLS)", () => {
		it(
			"can create a user",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const user = await harness.prisma.user.create({
					data: {
						id: "new-user-1",
						name: "New User",
						email: "newuser@example.com",
						emailVerified: false,
						role: "user",
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				expect(user).toBeDefined();
				expect(user.email).toBe("newuser@example.com");
				expect(user.role).toBe("user");
			},
			TEST_TIMEOUT,
		);

		it(
			"can read users with sensitive fields",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				// Update the test user with sensitive data
				await harness.prisma.user.update({
					where: { id: testUserId },
					data: {
						banned: true,
						banReason: "Test ban",
						role: "admin",
					},
				});

				const user = await harness.prisma.user.findUnique({
					where: { id: testUserId },
				});

				expect(user).toBeDefined();
				expect(user?.banned).toBe(true);
				expect(user?.banReason).toBe("Test ban");
				expect(user?.role).toBe("admin");
			},
			TEST_TIMEOUT,
		);

		it(
			"can update user",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const updated = await harness.prisma.user.update({
					where: { id: testUserId },
					data: {
						name: "Updated Name",
						onboardingComplete: true,
					},
				});

				expect(updated.name).toBe("Updated Name");
				expect(updated.onboardingComplete).toBe(true);
			},
			TEST_TIMEOUT,
		);

		it(
			"can delete a user",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				// Create a separate user for deletion test
				await harness.prisma.user.create({
					data: {
						id: "user-to-delete",
						name: "To Delete",
						email: "delete@example.com",
						emailVerified: false,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				await harness.prisma.user.delete({
					where: { id: "user-to-delete" },
				});

				const deleted = await harness.prisma.user.findUnique({
					where: { id: "user-to-delete" },
				});

				expect(deleted).toBeNull();
			},
			TEST_TIMEOUT,
		);
	});

	describe("Passkey table CRUD (service role bypasses RLS)", () => {
		it(
			"can create a passkey",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const passkey = await harness.prisma.passkey.create({
					data: {
						id: "passkey-1",
						userId: testUserId,
						publicKey:
							"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
						credentialID: "credential-id-12345",
						counter: 0,
						deviceType: "platform",
						backedUp: true,
						transports: "internal",
						aaguid: "00000000-0000-0000-0000-000000000000",
						createdAt: new Date(),
					},
				});

				expect(passkey).toBeDefined();
				expect(passkey.publicKey).toContain("MIIBIj");
				expect(passkey.credentialID).toBe("credential-id-12345");
			},
			TEST_TIMEOUT,
		);

		it(
			"can read passkeys with public key",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.passkey.create({
					data: {
						id: "passkey-1",
						userId: testUserId,
						publicKey: "secret-public-key-data",
						credentialID: "cred-123",
						counter: 5,
						deviceType: "cross-platform",
						backedUp: false,
						createdAt: new Date(),
					},
				});

				const passkey = await harness.prisma.passkey.findUnique({
					where: { id: "passkey-1" },
				});

				expect(passkey).toBeDefined();
				expect(passkey?.publicKey).toBe("secret-public-key-data");
				expect(passkey?.counter).toBe(5);
			},
			TEST_TIMEOUT,
		);

		it(
			"can update passkey counter",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.passkey.create({
					data: {
						id: "passkey-1",
						userId: testUserId,
						publicKey: "public-key",
						credentialID: "cred-123",
						counter: 0,
						deviceType: "platform",
						backedUp: true,
						createdAt: new Date(),
					},
				});

				const updated = await harness.prisma.passkey.update({
					where: { id: "passkey-1" },
					data: { counter: 10 },
				});

				expect(updated.counter).toBe(10);
			},
			TEST_TIMEOUT,
		);

		it(
			"can delete a passkey",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.passkey.create({
					data: {
						id: "passkey-1",
						userId: testUserId,
						publicKey: "to-be-deleted",
						credentialID: "cred-del",
						counter: 0,
						deviceType: "platform",
						backedUp: false,
						createdAt: new Date(),
					},
				});

				await harness.prisma.passkey.delete({
					where: { id: "passkey-1" },
				});

				const deleted = await harness.prisma.passkey.findUnique({
					where: { id: "passkey-1" },
				});

				expect(deleted).toBeNull();
			},
			TEST_TIMEOUT,
		);
	});

	describe("Verification table CRUD (service role bypasses RLS)", () => {
		it(
			"can create a verification token",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const verification = await harness.prisma.verification.create({
					data: {
						id: "verification-1",
						identifier: "test@example.com",
						value: "secret-verification-token-abc123",
						expiresAt: new Date(Date.now() + 3600000), // 1 hour
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				expect(verification).toBeDefined();
				expect(verification.value).toBe(
					"secret-verification-token-abc123",
				);
				expect(verification.identifier).toBe("test@example.com");
			},
			TEST_TIMEOUT,
		);

		it(
			"can read verification tokens",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.verification.create({
					data: {
						id: "verification-1",
						identifier: "user@test.com",
						value: "token-xyz-789",
						expiresAt: new Date(Date.now() + 3600000),
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				const verification =
					await harness.prisma.verification.findUnique({
						where: { id: "verification-1" },
					});

				expect(verification).toBeDefined();
				expect(verification?.value).toBe("token-xyz-789");
			},
			TEST_TIMEOUT,
		);

		it(
			"can update verification token",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.verification.create({
					data: {
						id: "verification-1",
						identifier: "user@test.com",
						value: "original-token",
						expiresAt: new Date(Date.now() + 3600000),
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				const newExpiry = new Date(Date.now() + 7200000); // 2 hours
				const updated = await harness.prisma.verification.update({
					where: { id: "verification-1" },
					data: { expiresAt: newExpiry },
				});

				expect(updated.expiresAt.getTime()).toBe(newExpiry.getTime());
			},
			TEST_TIMEOUT,
		);

		it(
			"can delete a verification token",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.verification.create({
					data: {
						id: "verification-1",
						identifier: "user@test.com",
						value: "to-be-deleted",
						expiresAt: new Date(Date.now() + 3600000),
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				await harness.prisma.verification.delete({
					where: { id: "verification-1" },
				});

				const deleted = await harness.prisma.verification.findUnique({
					where: { id: "verification-1" },
				});

				expect(deleted).toBeNull();
			},
			TEST_TIMEOUT,
		);
	});

	describe("Cascade delete behavior (RLS doesn't affect FK constraints)", () => {
		it(
			"cascades passkey deletion when user is deleted",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.passkey.create({
					data: {
						id: "passkey-1",
						userId: testUserId,
						publicKey: "cascade-test-key",
						credentialID: "cascade-cred",
						counter: 0,
						deviceType: "platform",
						backedUp: false,
						createdAt: new Date(),
					},
				});

				await harness.prisma.user.delete({
					where: { id: testUserId },
				});

				const passkey = await harness.prisma.passkey.findUnique({
					where: { id: "passkey-1" },
				});

				expect(passkey).toBeNull();
			},
			TEST_TIMEOUT,
		);
	});
});
