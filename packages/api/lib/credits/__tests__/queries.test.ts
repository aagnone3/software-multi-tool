import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the database module before importing queries
vi.mock("@repo/database", () => ({
	db: {
		creditBalance: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			upsert: vi.fn(),
		},
		creditTransaction: {
			findUnique: vi.fn(),
			create: vi.fn(),
		},
		$transaction: vi.fn(),
	},
}));

import { db } from "@repo/database";
import {
	createCreditBalance,
	createTransaction,
	executeAtomicDeduction,
	executeAtomicGrant,
	executeAtomicRefund,
	executeAtomicReset,
	findBalancesNeedingUsageReport,
	findCreditBalanceById,
	findCreditBalanceByOrgId,
	findTransactionById,
	markUsageReported,
	updateCreditBalance,
} from "../queries";

const mockDb = db as unknown as {
	creditBalance: {
		findUnique: ReturnType<typeof vi.fn>;
		findMany: ReturnType<typeof vi.fn>;
		create: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
		upsert: ReturnType<typeof vi.fn>;
	};
	creditTransaction: {
		findUnique: ReturnType<typeof vi.fn>;
		create: ReturnType<typeof vi.fn>;
	};
	$transaction: ReturnType<typeof vi.fn>;
};

describe("Credit Queries", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("findCreditBalanceByOrgId", () => {
		it("should find credit balance by organization ID", async () => {
			const mockBalance = { id: "balance-1", organizationId: "org-1" };
			mockDb.creditBalance.findUnique.mockResolvedValue(mockBalance);

			const result = await findCreditBalanceByOrgId("org-1");

			expect(result).toEqual(mockBalance);
			expect(mockDb.creditBalance.findUnique).toHaveBeenCalledWith({
				where: { organizationId: "org-1" },
			});
		});

		it("should return null if not found", async () => {
			mockDb.creditBalance.findUnique.mockResolvedValue(null);

			const result = await findCreditBalanceByOrgId("org-not-found");

			expect(result).toBeNull();
		});
	});

	describe("findCreditBalanceById", () => {
		it("should find credit balance by ID", async () => {
			const mockBalance = { id: "balance-1", organizationId: "org-1" };
			mockDb.creditBalance.findUnique.mockResolvedValue(mockBalance);

			const result = await findCreditBalanceById("balance-1");

			expect(result).toEqual(mockBalance);
			expect(mockDb.creditBalance.findUnique).toHaveBeenCalledWith({
				where: { id: "balance-1" },
			});
		});
	});

	describe("createCreditBalance", () => {
		it("should create a new credit balance", async () => {
			const mockBalance = {
				id: "balance-1",
				organizationId: "org-1",
				included: 100,
				used: 0,
			};
			mockDb.creditBalance.create.mockResolvedValue(mockBalance);

			const result = await createCreditBalance({
				organization: { connect: { id: "org-1" } },
				included: 100,
				used: 0,
				overage: 0,
				purchasedCredits: 0,
				periodStart: new Date(),
				periodEnd: new Date(),
			});

			expect(result).toEqual(mockBalance);
			expect(mockDb.creditBalance.create).toHaveBeenCalled();
		});
	});

	describe("updateCreditBalance", () => {
		it("should update a credit balance", async () => {
			const mockBalance = { id: "balance-1", used: 50 };
			mockDb.creditBalance.update.mockResolvedValue(mockBalance);

			const result = await updateCreditBalance("balance-1", { used: 50 });

			expect(result).toEqual(mockBalance);
			expect(mockDb.creditBalance.update).toHaveBeenCalledWith({
				where: { id: "balance-1" },
				data: { used: 50 },
			});
		});
	});

	describe("findTransactionById", () => {
		it("should find transaction by ID", async () => {
			const mockTransaction = { id: "tx-1", amount: -10 };
			mockDb.creditTransaction.findUnique.mockResolvedValue(
				mockTransaction,
			);

			const result = await findTransactionById("tx-1");

			expect(result).toEqual(mockTransaction);
			expect(mockDb.creditTransaction.findUnique).toHaveBeenCalledWith({
				where: { id: "tx-1" },
			});
		});
	});

	describe("createTransaction", () => {
		it("should create a new transaction", async () => {
			const mockTransaction = { id: "tx-1", amount: 100, type: "GRANT" };
			mockDb.creditTransaction.create.mockResolvedValue(mockTransaction);

			const result = await createTransaction({
				balance: { connect: { id: "balance-1" } },
				amount: 100,
				type: "GRANT",
			});

			expect(result).toEqual(mockTransaction);
			expect(mockDb.creditTransaction.create).toHaveBeenCalled();
		});
	});

	describe("executeAtomicDeduction", () => {
		it("should execute atomic deduction for normal usage", async () => {
			const mockTransaction = {
				id: "tx-1",
				balanceId: "balance-1",
				amount: -10,
				type: "USAGE",
			};

			// Mock the transaction to execute the callback
			mockDb.$transaction.mockImplementation(async (callback) => {
				const mockTx = {
					creditBalance: {
						update: vi.fn().mockResolvedValue({ id: "balance-1" }),
					},
					creditTransaction: {
						create: vi.fn().mockResolvedValue(mockTransaction),
					},
				};
				return callback(mockTx);
			});

			const result = await executeAtomicDeduction({
				balanceId: "balance-1",
				organizationId: "org-1",
				amount: 10,
				isOverage: false,
				remaining: 50,
				toolSlug: "test-tool",
				jobId: "job-1",
				description: "Test deduction",
			});

			expect(result).toEqual(mockTransaction);
			expect(mockDb.$transaction).toHaveBeenCalled();
		});

		it("should execute atomic deduction for overage usage", async () => {
			const mockTransaction = {
				id: "tx-1",
				balanceId: "balance-1",
				amount: -30,
				type: "OVERAGE",
			};

			mockDb.$transaction.mockImplementation(async (callback) => {
				const mockTx = {
					creditBalance: {
						update: vi.fn().mockResolvedValue({ id: "balance-1" }),
					},
					creditTransaction: {
						create: vi.fn().mockResolvedValue(mockTransaction),
					},
				};
				return callback(mockTx);
			});

			const result = await executeAtomicDeduction({
				balanceId: "balance-1",
				organizationId: "org-1",
				amount: 30,
				isOverage: true,
				remaining: 10, // Only 10 remaining, 20 will be overage
				toolSlug: "test-tool",
			});

			expect(result).toEqual(mockTransaction);
		});
	});

	describe("executeAtomicRefund", () => {
		it("should execute atomic refund for usage transaction", async () => {
			const originalTransaction = {
				id: "tx-1",
				balanceId: "balance-1",
				amount: -10,
				type: "USAGE",
				toolSlug: "test-tool",
				jobId: "job-1",
			};
			const refundTransaction = {
				id: "tx-2",
				balanceId: "balance-1",
				amount: 10,
				type: "REFUND",
			};

			mockDb.$transaction.mockImplementation(async (callback) => {
				const mockTx = {
					creditBalance: {
						update: vi.fn().mockResolvedValue({ id: "balance-1" }),
					},
					creditTransaction: {
						create: vi.fn().mockResolvedValue(refundTransaction),
					},
				};
				return callback(mockTx);
			});

			const result = await executeAtomicRefund({
				originalTransaction: originalTransaction as any,
				reason: "Job failed",
			});

			expect(result).toEqual(refundTransaction);
		});

		it("should execute atomic refund for overage transaction", async () => {
			const originalTransaction = {
				id: "tx-1",
				balanceId: "balance-1",
				amount: -20,
				type: "OVERAGE",
				toolSlug: "test-tool",
				jobId: "job-1",
			};
			const refundTransaction = {
				id: "tx-2",
				balanceId: "balance-1",
				amount: 20,
				type: "REFUND",
			};

			mockDb.$transaction.mockImplementation(async (callback) => {
				const mockTx = {
					creditBalance: {
						update: vi.fn().mockResolvedValue({ id: "balance-1" }),
					},
					creditTransaction: {
						create: vi.fn().mockResolvedValue(refundTransaction),
					},
				};
				return callback(mockTx);
			});

			const result = await executeAtomicRefund({
				originalTransaction: originalTransaction as any,
			});

			expect(result).toEqual(refundTransaction);
		});
	});

	describe("executeAtomicGrant", () => {
		it("should execute atomic grant for new balance", async () => {
			const mockBalance = {
				id: "balance-1",
				organizationId: "org-1",
				included: 500,
				used: 0,
			};

			mockDb.$transaction.mockImplementation(async (callback) => {
				const mockTx = {
					creditBalance: {
						upsert: vi.fn().mockResolvedValue(mockBalance),
					},
					creditTransaction: {
						create: vi.fn().mockResolvedValue({ id: "tx-1" }),
					},
				};
				return callback(mockTx);
			});

			const result = await executeAtomicGrant({
				organizationId: "org-1",
				included: 500,
				periodStart: new Date("2024-01-01"),
				periodEnd: new Date("2024-02-01"),
			});

			expect(result).toEqual(mockBalance);
		});
	});

	describe("executeAtomicReset", () => {
		it("should execute atomic reset for existing balance", async () => {
			const existingBalance = {
				id: "balance-1",
				organizationId: "org-1",
				included: 100,
				used: 80,
			};
			const resetBalance = {
				id: "balance-1",
				organizationId: "org-1",
				included: 100,
				used: 0,
				overage: 0,
			};

			mockDb.$transaction.mockImplementation(async (callback) => {
				const mockTx = {
					creditBalance: {
						findUnique: vi.fn().mockResolvedValue(existingBalance),
						update: vi.fn().mockResolvedValue(resetBalance),
					},
					creditTransaction: {
						create: vi.fn().mockResolvedValue({ id: "tx-1" }),
					},
				};
				return callback(mockTx);
			});

			const result = await executeAtomicReset({
				organizationId: "org-1",
				periodStart: new Date("2024-02-01"),
				periodEnd: new Date("2024-03-01"),
			});

			expect(result).toEqual(resetBalance);
		});

		it("should throw error if balance not found", async () => {
			mockDb.$transaction.mockImplementation(async (callback) => {
				const mockTx = {
					creditBalance: {
						findUnique: vi.fn().mockResolvedValue(null),
					},
				};
				return callback(mockTx);
			});

			await expect(
				executeAtomicReset({
					organizationId: "org-not-found",
					periodStart: new Date("2024-02-01"),
					periodEnd: new Date("2024-03-01"),
				}),
			).rejects.toThrow("Credit balance not found for organization");
		});
	});

	describe("findBalancesNeedingUsageReport", () => {
		it("should find balances with overage that need reporting", async () => {
			const mockBalances = [
				{
					id: "balance-1",
					organizationId: "org-1",
					overage: 50,
					stripeUsageReported: false,
					periodEnd: new Date("2024-01-31"),
					organization: {
						id: "org-1",
						purchases: [
							{ id: "purchase-1", subscriptionId: "sub_123" },
						],
					},
				},
			];
			mockDb.creditBalance.findMany.mockResolvedValue(mockBalances);

			const result = await findBalancesNeedingUsageReport();

			expect(result).toEqual(mockBalances);
			expect(mockDb.creditBalance.findMany).toHaveBeenCalledWith({
				where: {
					periodEnd: { lte: expect.any(Date) },
					overage: { gt: 0 },
					stripeUsageReported: false,
				},
				include: {
					organization: {
						select: {
							id: true,
							purchases: {
								where: {
									type: "SUBSCRIPTION",
									subscriptionId: { not: null },
								},
								select: {
									id: true,
									subscriptionId: true,
								},
							},
						},
					},
				},
			});
		});

		it("should return empty array when no balances need reporting", async () => {
			mockDb.creditBalance.findMany.mockResolvedValue([]);

			const result = await findBalancesNeedingUsageReport();

			expect(result).toEqual([]);
		});
	});

	describe("markUsageReported", () => {
		it("should mark balance as reported", async () => {
			mockDb.creditBalance.update.mockResolvedValue({
				id: "balance-1",
				stripeUsageReported: true,
			});

			await markUsageReported("balance-1");

			expect(mockDb.creditBalance.update).toHaveBeenCalledWith({
				where: { id: "balance-1" },
				data: { stripeUsageReported: true },
			});
		});
	});
});
