/**
 * Integration tests for Row Level Security (RLS) on sensitive auth tables.
 *
 * These tests verify that:
 * 1. RLS is properly enabled on session, account, and twoFactor tables
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

describe.sequential("RLS on sensitive auth tables (integration)", () => {
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
			"has RLS enabled on session table",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const result = await harness.prisma.$queryRaw<
					{ relrowsecurity: boolean }[]
				>`
					SELECT relrowsecurity
					FROM pg_class
					WHERE relname = 'session' AND relnamespace = (
						SELECT oid FROM pg_namespace WHERE nspname = 'public'
					)
				`;

				expect(result).toHaveLength(1);
				expect(result[0].relrowsecurity).toBe(true);
			},
			TEST_TIMEOUT,
		);

		it(
			"has RLS enabled on account table",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const result = await harness.prisma.$queryRaw<
					{ relrowsecurity: boolean }[]
				>`
					SELECT relrowsecurity
					FROM pg_class
					WHERE relname = 'account' AND relnamespace = (
						SELECT oid FROM pg_namespace WHERE nspname = 'public'
					)
				`;

				expect(result).toHaveLength(1);
				expect(result[0].relrowsecurity).toBe(true);
			},
			TEST_TIMEOUT,
		);

		it(
			"has RLS enabled on twoFactor table",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const result = await harness.prisma.$queryRaw<
					{ relrowsecurity: boolean }[]
				>`
					SELECT relrowsecurity
					FROM pg_class
					WHERE relname = 'twoFactor' AND relnamespace = (
						SELECT oid FROM pg_namespace WHERE nspname = 'public'
					)
				`;

				expect(result).toHaveLength(1);
				expect(result[0].relrowsecurity).toBe(true);
			},
			TEST_TIMEOUT,
		);
	});

	describe("Session table CRUD (service role bypasses RLS)", () => {
		it(
			"can create a session",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const session = await harness.prisma.session.create({
					data: {
						id: "session-1",
						userId: testUserId,
						token: "secret-session-token-12345",
						expiresAt: new Date(Date.now() + 86400000), // 1 day
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				expect(session).toBeDefined();
				expect(session.token).toBe("secret-session-token-12345");
				expect(session.userId).toBe(testUserId);
			},
			TEST_TIMEOUT,
		);

		it(
			"can read sessions",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.session.create({
					data: {
						id: "session-1",
						userId: testUserId,
						token: "token-1",
						expiresAt: new Date(Date.now() + 86400000),
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				const sessions = await harness.prisma.session.findMany({
					where: { userId: testUserId },
				});

				expect(sessions).toHaveLength(1);
				expect(sessions[0].token).toBe("token-1");
			},
			TEST_TIMEOUT,
		);

		it(
			"can update a session",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.session.create({
					data: {
						id: "session-1",
						userId: testUserId,
						token: "original-token",
						expiresAt: new Date(Date.now() + 86400000),
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				const updated = await harness.prisma.session.update({
					where: { id: "session-1" },
					data: { ipAddress: "192.168.1.1" },
				});

				expect(updated.ipAddress).toBe("192.168.1.1");
			},
			TEST_TIMEOUT,
		);

		it(
			"can delete a session",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.session.create({
					data: {
						id: "session-1",
						userId: testUserId,
						token: "token-to-delete",
						expiresAt: new Date(Date.now() + 86400000),
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				await harness.prisma.session.delete({
					where: { id: "session-1" },
				});

				const deleted = await harness.prisma.session.findUnique({
					where: { id: "session-1" },
				});

				expect(deleted).toBeNull();
			},
			TEST_TIMEOUT,
		);
	});

	describe("Account table CRUD (service role bypasses RLS)", () => {
		it(
			"can create an account with password",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const account = await harness.prisma.account.create({
					data: {
						id: "account-1",
						userId: testUserId,
						accountId: testUserId,
						providerId: "credential",
						password: "hashed-password-abc123",
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				expect(account).toBeDefined();
				expect(account.password).toBe("hashed-password-abc123");
				expect(account.providerId).toBe("credential");
			},
			TEST_TIMEOUT,
		);

		it(
			"can read accounts with password field",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.account.create({
					data: {
						id: "account-1",
						userId: testUserId,
						accountId: testUserId,
						providerId: "credential",
						password: "secret-hash",
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				const account = await harness.prisma.account.findUnique({
					where: { id: "account-1" },
				});

				expect(account).toBeDefined();
				expect(account?.password).toBe("secret-hash");
			},
			TEST_TIMEOUT,
		);

		it(
			"can update account password",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.account.create({
					data: {
						id: "account-1",
						userId: testUserId,
						accountId: testUserId,
						providerId: "credential",
						password: "old-hash",
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				const updated = await harness.prisma.account.update({
					where: { id: "account-1" },
					data: { password: "new-hash" },
				});

				expect(updated.password).toBe("new-hash");
			},
			TEST_TIMEOUT,
		);

		it(
			"can delete an account",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.account.create({
					data: {
						id: "account-1",
						userId: testUserId,
						accountId: testUserId,
						providerId: "credential",
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				await harness.prisma.account.delete({
					where: { id: "account-1" },
				});

				const deleted = await harness.prisma.account.findUnique({
					where: { id: "account-1" },
				});

				expect(deleted).toBeNull();
			},
			TEST_TIMEOUT,
		);
	});

	describe("TwoFactor table CRUD (service role bypasses RLS)", () => {
		it(
			"can create a twoFactor record",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const twoFactor = await harness.prisma.twoFactor.create({
					data: {
						id: "2fa-1",
						userId: testUserId,
						secret: "TOTP-SECRET-BASE32-ENCODED",
						backupCodes: JSON.stringify([
							"code1",
							"code2",
							"code3",
						]),
					},
				});

				expect(twoFactor).toBeDefined();
				expect(twoFactor.secret).toBe("TOTP-SECRET-BASE32-ENCODED");
				expect(twoFactor.backupCodes).toContain("code1");
			},
			TEST_TIMEOUT,
		);

		it(
			"can read twoFactor records with secret",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.twoFactor.create({
					data: {
						id: "2fa-1",
						userId: testUserId,
						secret: "secret-totp-key",
						backupCodes: "[]",
					},
				});

				const twoFactor = await harness.prisma.twoFactor.findFirst({
					where: { userId: testUserId },
				});

				expect(twoFactor).toBeDefined();
				expect(twoFactor?.secret).toBe("secret-totp-key");
			},
			TEST_TIMEOUT,
		);

		it(
			"can update twoFactor backup codes",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.twoFactor.create({
					data: {
						id: "2fa-1",
						userId: testUserId,
						secret: "secret",
						backupCodes: '["old-code"]',
					},
				});

				const updated = await harness.prisma.twoFactor.update({
					where: { id: "2fa-1" },
					data: { backupCodes: '["new-code-1", "new-code-2"]' },
				});

				expect(updated.backupCodes).toContain("new-code-1");
			},
			TEST_TIMEOUT,
		);

		it(
			"can delete a twoFactor record",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.twoFactor.create({
					data: {
						id: "2fa-1",
						userId: testUserId,
						secret: "to-be-deleted",
						backupCodes: "[]",
					},
				});

				await harness.prisma.twoFactor.delete({
					where: { id: "2fa-1" },
				});

				const deleted = await harness.prisma.twoFactor.findUnique({
					where: { id: "2fa-1" },
				});

				expect(deleted).toBeNull();
			},
			TEST_TIMEOUT,
		);
	});

	describe("Cascade delete behavior (RLS doesn't affect FK constraints)", () => {
		it(
			"cascades session deletion when user is deleted",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.session.create({
					data: {
						id: "session-1",
						userId: testUserId,
						token: "cascade-test-token",
						expiresAt: new Date(Date.now() + 86400000),
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				await harness.prisma.user.delete({
					where: { id: testUserId },
				});

				const session = await harness.prisma.session.findUnique({
					where: { id: "session-1" },
				});

				expect(session).toBeNull();
			},
			TEST_TIMEOUT,
		);

		it(
			"cascades account deletion when user is deleted",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.account.create({
					data: {
						id: "account-1",
						userId: testUserId,
						accountId: testUserId,
						providerId: "credential",
						password: "cascade-test",
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				await harness.prisma.user.delete({
					where: { id: testUserId },
				});

				const account = await harness.prisma.account.findUnique({
					where: { id: "account-1" },
				});

				expect(account).toBeNull();
			},
			TEST_TIMEOUT,
		);

		it(
			"cascades twoFactor deletion when user is deleted",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.twoFactor.create({
					data: {
						id: "2fa-1",
						userId: testUserId,
						secret: "cascade-test-secret",
						backupCodes: "[]",
					},
				});

				await harness.prisma.user.delete({
					where: { id: testUserId },
				});

				const twoFactor = await harness.prisma.twoFactor.findUnique({
					where: { id: "2fa-1" },
				});

				expect(twoFactor).toBeNull();
			},
			TEST_TIMEOUT,
		);
	});
});
