import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { PostgresTestHarness } from "./postgres-test-harness";
import { createPostgresTestHarness } from "./postgres-test-harness";

const HOOK_TIMEOUT = 120_000;
const TEST_TIMEOUT = 30_000;

describe.sequential("CreditBalance and CreditTransaction models (integration)", () => {
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

		// Create a test user
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

		// Create a test organization
		const org = await harness.prisma.organization.create({
			data: {
				id: "test-org-1",
				name: "Test Organization",
				slug: "test-org",
				createdAt: new Date(),
			},
		});
		testOrganizationId = org.id;
	}, TEST_TIMEOUT);

	afterAll(async () => {
		await harness?.cleanup();
	}, HOOK_TIMEOUT);

	describe("CreditBalance", () => {
		it(
			"can create a credit balance for a user",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const balance = await harness.prisma.creditBalance.create({
					data: {
						userId: testUserId,
						periodStart: new Date("2026-01-01"),
						periodEnd: new Date("2026-01-31"),
						included: 1000,
					},
				});

				expect(balance).toBeDefined();
				expect(balance.userId).toBe(testUserId);
				expect(balance.included).toBe(1000);
				expect(balance.used).toBe(0);
				expect(balance.overage).toBe(0);
				expect(balance.purchasedCredits).toBe(0);
			},
			TEST_TIMEOUT,
		);

		it(
			"can create a credit balance for an organization",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const balance = await harness.prisma.creditBalance.create({
					data: {
						organizationId: testOrganizationId,
						periodStart: new Date("2026-01-01"),
						periodEnd: new Date("2026-01-31"),
						included: 5000,
						purchasedCredits: 500,
					},
				});

				expect(balance).toBeDefined();
				expect(balance.organizationId).toBe(testOrganizationId);
				expect(balance.included).toBe(5000);
				expect(balance.purchasedCredits).toBe(500);
			},
			TEST_TIMEOUT,
		);

		it(
			"enforces unique constraint on userId",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.creditBalance.create({
					data: {
						userId: testUserId,
						periodStart: new Date("2026-01-01"),
						periodEnd: new Date("2026-01-31"),
						included: 1000,
					},
				});

				await expect(
					harness.prisma.creditBalance.create({
						data: {
							userId: testUserId,
							periodStart: new Date("2026-02-01"),
							periodEnd: new Date("2026-02-28"),
							included: 1000,
						},
					}),
				).rejects.toThrow();
			},
			TEST_TIMEOUT,
		);

		it(
			"enforces unique constraint on organizationId",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.creditBalance.create({
					data: {
						organizationId: testOrganizationId,
						periodStart: new Date("2026-01-01"),
						periodEnd: new Date("2026-01-31"),
						included: 5000,
					},
				});

				await expect(
					harness.prisma.creditBalance.create({
						data: {
							organizationId: testOrganizationId,
							periodStart: new Date("2026-02-01"),
							periodEnd: new Date("2026-02-28"),
							included: 5000,
						},
					}),
				).rejects.toThrow();
			},
			TEST_TIMEOUT,
		);

		it(
			"cascades delete when user is deleted",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const balance = await harness.prisma.creditBalance.create({
					data: {
						userId: testUserId,
						periodStart: new Date("2026-01-01"),
						periodEnd: new Date("2026-01-31"),
						included: 1000,
					},
				});

				await harness.prisma.user.delete({
					where: { id: testUserId },
				});

				const deletedBalance =
					await harness.prisma.creditBalance.findUnique({
						where: { id: balance.id },
					});

				expect(deletedBalance).toBeNull();
			},
			TEST_TIMEOUT,
		);

		it(
			"can be queried by User relation",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.creditBalance.create({
					data: {
						userId: testUserId,
						periodStart: new Date("2026-01-01"),
						periodEnd: new Date("2026-01-31"),
						included: 1000,
					},
				});

				const userWithBalance = await harness.prisma.user.findUnique({
					where: { id: testUserId },
					include: { creditBalance: true },
				});

				expect(userWithBalance?.creditBalance).toBeDefined();
				expect(userWithBalance?.creditBalance?.included).toBe(1000);
			},
			TEST_TIMEOUT,
		);
	});

	describe("CreditTransaction", () => {
		let testBalanceId: string;

		beforeEach(async () => {
			if (!harness) {
				throw new Error("Harness not initialized");
			}

			const balance = await harness.prisma.creditBalance.create({
				data: {
					userId: testUserId,
					periodStart: new Date("2026-01-01"),
					periodEnd: new Date("2026-01-31"),
					included: 1000,
				},
			});
			testBalanceId = balance.id;
		});

		it(
			"can create a GRANT transaction",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const transaction =
					await harness.prisma.creditTransaction.create({
						data: {
							balanceId: testBalanceId,
							amount: 1000,
							type: "GRANT",
							description: "Monthly subscription credits",
						},
					});

				expect(transaction).toBeDefined();
				expect(transaction.amount).toBe(1000);
				expect(transaction.type).toBe("GRANT");
			},
			TEST_TIMEOUT,
		);

		it(
			"can create a USAGE transaction with tool reference",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const transaction =
					await harness.prisma.creditTransaction.create({
						data: {
							balanceId: testBalanceId,
							amount: -10,
							type: "USAGE",
							toolSlug: "news-analyzer",
							jobId: "job-123",
							description: "News article analysis",
						},
					});

				expect(transaction).toBeDefined();
				expect(transaction.amount).toBe(-10);
				expect(transaction.type).toBe("USAGE");
				expect(transaction.toolSlug).toBe("news-analyzer");
				expect(transaction.jobId).toBe("job-123");
			},
			TEST_TIMEOUT,
		);

		it(
			"supports all CreditTransactionType values",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const types = [
					"GRANT",
					"USAGE",
					"OVERAGE",
					"REFUND",
					"PURCHASE",
					"ADJUSTMENT",
				] as const;

				for (const type of types) {
					const transaction =
						await harness.prisma.creditTransaction.create({
							data: {
								balanceId: testBalanceId,
								amount:
									type === "USAGE" || type === "OVERAGE"
										? -10
										: 10,
								type,
							},
						});
					expect(transaction.type).toBe(type);
				}
			},
			TEST_TIMEOUT,
		);

		it(
			"cascades delete when balance is deleted",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const transaction =
					await harness.prisma.creditTransaction.create({
						data: {
							balanceId: testBalanceId,
							amount: -10,
							type: "USAGE",
						},
					});

				await harness.prisma.creditBalance.delete({
					where: { id: testBalanceId },
				});

				const deletedTransaction =
					await harness.prisma.creditTransaction.findUnique({
						where: { id: transaction.id },
					});

				expect(deletedTransaction).toBeNull();
			},
			TEST_TIMEOUT,
		);

		it(
			"can query transactions with balance relation",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.creditTransaction.createMany({
					data: [
						{
							balanceId: testBalanceId,
							amount: 1000,
							type: "GRANT",
						},
						{
							balanceId: testBalanceId,
							amount: -50,
							type: "USAGE",
							toolSlug: "tool-1",
						},
						{
							balanceId: testBalanceId,
							amount: -30,
							type: "USAGE",
							toolSlug: "tool-2",
						},
					],
				});

				const balanceWithTransactions =
					await harness.prisma.creditBalance.findUnique({
						where: { id: testBalanceId },
						include: { transactions: true },
					});

				expect(balanceWithTransactions?.transactions).toHaveLength(3);
			},
			TEST_TIMEOUT,
		);

		it(
			"can filter transactions by toolSlug index",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.creditTransaction.createMany({
					data: [
						{
							balanceId: testBalanceId,
							amount: -10,
							type: "USAGE",
							toolSlug: "news-analyzer",
						},
						{
							balanceId: testBalanceId,
							amount: -20,
							type: "USAGE",
							toolSlug: "news-analyzer",
						},
						{
							balanceId: testBalanceId,
							amount: -5,
							type: "USAGE",
							toolSlug: "other-tool",
						},
					],
				});

				const newsAnalyzerTransactions =
					await harness.prisma.creditTransaction.findMany({
						where: { toolSlug: "news-analyzer" },
					});

				expect(newsAnalyzerTransactions).toHaveLength(2);
			},
			TEST_TIMEOUT,
		);
	});
});
