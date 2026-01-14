import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	deductCredits,
	getCreditStatus,
	getOrCreateCreditBalance,
	grantSubscriptionCredits,
	hasCredits,
	refundCredits,
	resetBillingPeriod,
} from "../service";
import {
	CreditBalanceNotFoundError,
	InsufficientCreditsError,
	TransactionNotFoundError,
} from "../types";

// Mock the queries module
vi.mock("../queries", () => ({
	findCreditBalanceByOrgId: vi.fn(),
	findCreditBalanceById: vi.fn(),
	findTransactionById: vi.fn(),
	createCreditBalance: vi.fn(),
	updateCreditBalance: vi.fn(),
	createTransaction: vi.fn(),
	executeAtomicDeduction: vi.fn(),
	executeAtomicRefund: vi.fn(),
	executeAtomicGrant: vi.fn(),
	executeAtomicReset: vi.fn(),
}));

// Mock the config module
vi.mock("@repo/config", () => ({
	getPlanCredits: vi.fn(),
}));

import { getPlanCredits } from "@repo/config";
import * as queries from "../queries";

const mockFindCreditBalanceByOrgId =
	queries.findCreditBalanceByOrgId as ReturnType<typeof vi.fn>;
const mockFindTransactionById = queries.findTransactionById as ReturnType<
	typeof vi.fn
>;
const mockExecuteAtomicDeduction = queries.executeAtomicDeduction as ReturnType<
	typeof vi.fn
>;
const mockExecuteAtomicRefund = queries.executeAtomicRefund as ReturnType<
	typeof vi.fn
>;
const mockExecuteAtomicGrant = queries.executeAtomicGrant as ReturnType<
	typeof vi.fn
>;
const mockExecuteAtomicReset = queries.executeAtomicReset as ReturnType<
	typeof vi.fn
>;
const mockGetPlanCredits = getPlanCredits as ReturnType<typeof vi.fn>;

describe("Credit Service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getOrCreateCreditBalance", () => {
		it("should return existing balance if found", async () => {
			const existingBalance = {
				id: "balance-1",
				organizationId: "org-1",
				included: 100,
				used: 20,
				overage: 0,
				purchasedCredits: 0,
				periodStart: new Date("2024-01-01"),
				periodEnd: new Date("2024-02-01"),
			};
			mockFindCreditBalanceByOrgId.mockResolvedValue(existingBalance);

			const result = await getOrCreateCreditBalance("org-1");

			expect(result).toEqual(existingBalance);
			expect(mockFindCreditBalanceByOrgId).toHaveBeenCalledWith("org-1");
			expect(mockExecuteAtomicGrant).not.toHaveBeenCalled();
		});

		it("should create new balance if not found", async () => {
			const newBalance = {
				id: "balance-1",
				organizationId: "org-1",
				included: 0,
				used: 0,
				overage: 0,
				purchasedCredits: 0,
				periodStart: expect.any(Date),
				periodEnd: expect.any(Date),
			};
			mockFindCreditBalanceByOrgId.mockResolvedValue(null);
			mockExecuteAtomicGrant.mockResolvedValue(newBalance);

			const result = await getOrCreateCreditBalance("org-1");

			expect(result).toEqual(newBalance);
			expect(mockExecuteAtomicGrant).toHaveBeenCalledWith({
				organizationId: "org-1",
				included: 0,
				periodStart: expect.any(Date),
				periodEnd: expect.any(Date),
			});
		});
	});

	describe("hasCredits", () => {
		it("should return allowed=false if no balance exists", async () => {
			mockFindCreditBalanceByOrgId.mockResolvedValue(null);

			const result = await hasCredits("org-1", 10);

			expect(result).toEqual({
				allowed: false,
				balance: 0,
				isOverage: false,
			});
		});

		it("should return allowed=true with sufficient included credits", async () => {
			mockFindCreditBalanceByOrgId.mockResolvedValue({
				id: "balance-1",
				organizationId: "org-1",
				included: 100,
				used: 50,
				overage: 0,
				purchasedCredits: 0,
				periodStart: new Date(),
				periodEnd: new Date(),
			});

			const result = await hasCredits("org-1", 30);

			expect(result).toEqual({
				allowed: true,
				balance: 50, // 100 - 50
				isOverage: false,
			});
		});

		it("should return allowed=true with purchased credits when included exhausted", async () => {
			mockFindCreditBalanceByOrgId.mockResolvedValue({
				id: "balance-1",
				organizationId: "org-1",
				included: 100,
				used: 100, // All included used
				overage: 0,
				purchasedCredits: 50, // But have purchased credits
				periodStart: new Date(),
				periodEnd: new Date(),
			});

			const result = await hasCredits("org-1", 30);

			expect(result).toEqual({
				allowed: true,
				balance: 50, // Only purchased credits remain
				isOverage: true, // Would use purchased credits
			});
		});

		it("should return allowed=false when no credits available", async () => {
			mockFindCreditBalanceByOrgId.mockResolvedValue({
				id: "balance-1",
				organizationId: "org-1",
				included: 100,
				used: 100,
				overage: 0,
				purchasedCredits: 0,
				periodStart: new Date(),
				periodEnd: new Date(),
			});

			const result = await hasCredits("org-1", 10);

			expect(result).toEqual({
				allowed: false,
				balance: 0,
				isOverage: true,
			});
		});

		it("should correctly calculate balance with mixed credits", async () => {
			mockFindCreditBalanceByOrgId.mockResolvedValue({
				id: "balance-1",
				organizationId: "org-1",
				included: 100,
				used: 80,
				overage: 0,
				purchasedCredits: 50,
				periodStart: new Date(),
				periodEnd: new Date(),
			});

			const result = await hasCredits("org-1", 60);

			expect(result).toEqual({
				allowed: true,
				balance: 70, // (100 - 80) + 50 = 70
				isOverage: true, // 60 > 20 remaining included
			});
		});
	});

	describe("getCreditStatus", () => {
		it("should throw CreditBalanceNotFoundError if no balance exists", async () => {
			mockFindCreditBalanceByOrgId.mockResolvedValue(null);

			await expect(getCreditStatus("org-1")).rejects.toThrow(
				CreditBalanceNotFoundError,
			);
		});

		it("should return correct status for existing balance", async () => {
			const balance = {
				id: "balance-1",
				organizationId: "org-1",
				included: 100,
				used: 40,
				overage: 5,
				purchasedCredits: 20,
				periodStart: new Date("2024-01-01"),
				periodEnd: new Date("2024-02-01"),
			};
			mockFindCreditBalanceByOrgId.mockResolvedValue(balance);

			const result = await getCreditStatus("org-1");

			expect(result).toEqual({
				included: 100,
				used: 40,
				remaining: 60, // 100 - 40
				overage: 5,
				purchasedCredits: 20,
				periodStart: new Date("2024-01-01"),
				periodEnd: new Date("2024-02-01"),
			});
		});

		it("should return remaining=0 when used exceeds included", async () => {
			const balance = {
				id: "balance-1",
				organizationId: "org-1",
				included: 100,
				used: 100,
				overage: 10,
				purchasedCredits: 0,
				periodStart: new Date("2024-01-01"),
				periodEnd: new Date("2024-02-01"),
			};
			mockFindCreditBalanceByOrgId.mockResolvedValue(balance);

			const result = await getCreditStatus("org-1");

			expect(result.remaining).toBe(0);
		});
	});

	describe("deductCredits", () => {
		it("should throw CreditBalanceNotFoundError if no balance exists", async () => {
			mockFindCreditBalanceByOrgId.mockResolvedValue(null);

			await expect(
				deductCredits({
					organizationId: "org-1",
					amount: 10,
					toolSlug: "test-tool",
				}),
			).rejects.toThrow(CreditBalanceNotFoundError);
		});

		it("should throw InsufficientCreditsError if not enough credits", async () => {
			mockFindCreditBalanceByOrgId.mockResolvedValue({
				id: "balance-1",
				organizationId: "org-1",
				included: 100,
				used: 95,
				overage: 0,
				purchasedCredits: 0,
				periodStart: new Date(),
				periodEnd: new Date(),
			});

			await expect(
				deductCredits({
					organizationId: "org-1",
					amount: 10,
					toolSlug: "test-tool",
				}),
			).rejects.toThrow(InsufficientCreditsError);
		});

		it("should deduct credits successfully with sufficient balance", async () => {
			const balance = {
				id: "balance-1",
				organizationId: "org-1",
				included: 100,
				used: 50,
				overage: 0,
				purchasedCredits: 0,
				periodStart: new Date(),
				periodEnd: new Date(),
			};
			const transaction = {
				id: "tx-1",
				balanceId: "balance-1",
				amount: -10,
				type: "USAGE",
				toolSlug: "test-tool",
				createdAt: new Date(),
			};

			mockFindCreditBalanceByOrgId.mockResolvedValue(balance);
			mockExecuteAtomicDeduction.mockResolvedValue(transaction);

			const result = await deductCredits({
				organizationId: "org-1",
				amount: 10,
				toolSlug: "test-tool",
				jobId: "job-1",
				description: "Test usage",
			});

			expect(result).toEqual(transaction);
			expect(mockExecuteAtomicDeduction).toHaveBeenCalledWith({
				balanceId: "balance-1",
				organizationId: "org-1",
				amount: 10,
				isOverage: false,
				remaining: 50,
				toolSlug: "test-tool",
				jobId: "job-1",
				description: "Test usage",
			});
		});

		it("should mark as overage when using purchased credits", async () => {
			const balance = {
				id: "balance-1",
				organizationId: "org-1",
				included: 100,
				used: 100, // All included used
				overage: 0,
				purchasedCredits: 50, // But have purchased
				periodStart: new Date(),
				periodEnd: new Date(),
			};
			const transaction = {
				id: "tx-1",
				balanceId: "balance-1",
				amount: -10,
				type: "OVERAGE",
				toolSlug: "test-tool",
				createdAt: new Date(),
			};

			mockFindCreditBalanceByOrgId.mockResolvedValue(balance);
			mockExecuteAtomicDeduction.mockResolvedValue(transaction);

			await deductCredits({
				organizationId: "org-1",
				amount: 10,
				toolSlug: "test-tool",
			});

			expect(mockExecuteAtomicDeduction).toHaveBeenCalledWith(
				expect.objectContaining({
					isOverage: true,
					remaining: 0,
				}),
			);
		});
	});

	describe("refundCredits", () => {
		it("should throw TransactionNotFoundError if transaction not found", async () => {
			mockFindTransactionById.mockResolvedValue(null);

			await expect(
				refundCredits({ transactionId: "tx-1" }),
			).rejects.toThrow(TransactionNotFoundError);
		});

		it("should throw error for non-consumption transactions", async () => {
			mockFindTransactionById.mockResolvedValue({
				id: "tx-1",
				balanceId: "balance-1",
				amount: 100, // Positive = grant, not consumption
				type: "GRANT",
				createdAt: new Date(),
			});

			await expect(
				refundCredits({ transactionId: "tx-1" }),
			).rejects.toThrow("Cannot refund non-consumption transaction");
		});

		it("should refund credits successfully", async () => {
			const originalTransaction = {
				id: "tx-1",
				balanceId: "balance-1",
				amount: -10, // Negative = consumption
				type: "USAGE",
				toolSlug: "test-tool",
				jobId: "job-1",
				createdAt: new Date(),
			};
			const refundTransaction = {
				id: "tx-2",
				balanceId: "balance-1",
				amount: 10,
				type: "REFUND",
				toolSlug: "test-tool",
				createdAt: new Date(),
			};

			mockFindTransactionById.mockResolvedValue(originalTransaction);
			mockExecuteAtomicRefund.mockResolvedValue(refundTransaction);

			const result = await refundCredits({
				transactionId: "tx-1",
				reason: "Job failed",
			});

			expect(result).toEqual(refundTransaction);
			expect(mockExecuteAtomicRefund).toHaveBeenCalledWith({
				originalTransaction,
				reason: "Job failed",
			});
		});
	});

	describe("grantSubscriptionCredits", () => {
		it("should throw error for unknown plan", async () => {
			mockGetPlanCredits.mockReturnValue(undefined);

			await expect(
				grantSubscriptionCredits({
					organizationId: "org-1",
					planId: "unknown-plan",
					periodStart: new Date("2024-01-01"),
					periodEnd: new Date("2024-02-01"),
				}),
			).rejects.toThrow("Unknown plan: unknown-plan");
		});

		it("should grant credits successfully", async () => {
			const newBalance = {
				id: "balance-1",
				organizationId: "org-1",
				included: 500,
				used: 0,
				overage: 0,
				purchasedCredits: 0,
				periodStart: new Date("2024-01-01"),
				periodEnd: new Date("2024-02-01"),
			};

			mockGetPlanCredits.mockReturnValue({ included: 500 });
			mockExecuteAtomicGrant.mockResolvedValue(newBalance);

			const result = await grantSubscriptionCredits({
				organizationId: "org-1",
				planId: "pro",
				periodStart: new Date("2024-01-01"),
				periodEnd: new Date("2024-02-01"),
			});

			expect(result).toEqual(newBalance);
			expect(mockExecuteAtomicGrant).toHaveBeenCalledWith({
				organizationId: "org-1",
				included: 500,
				periodStart: new Date("2024-01-01"),
				periodEnd: new Date("2024-02-01"),
			});
		});
	});

	describe("resetBillingPeriod", () => {
		it("should throw CreditBalanceNotFoundError if no balance exists", async () => {
			mockFindCreditBalanceByOrgId.mockResolvedValue(null);

			await expect(
				resetBillingPeriod({
					organizationId: "org-1",
					periodStart: new Date("2024-02-01"),
					periodEnd: new Date("2024-03-01"),
				}),
			).rejects.toThrow(CreditBalanceNotFoundError);
		});

		it("should reset billing period successfully", async () => {
			const existingBalance = {
				id: "balance-1",
				organizationId: "org-1",
				included: 100,
				used: 80,
				overage: 10,
				purchasedCredits: 20,
				periodStart: new Date("2024-01-01"),
				periodEnd: new Date("2024-02-01"),
			};
			const resetBalance = {
				...existingBalance,
				used: 0,
				overage: 0,
				periodStart: new Date("2024-02-01"),
				periodEnd: new Date("2024-03-01"),
			};

			mockFindCreditBalanceByOrgId.mockResolvedValue(existingBalance);
			mockExecuteAtomicReset.mockResolvedValue(resetBalance);

			const result = await resetBillingPeriod({
				organizationId: "org-1",
				periodStart: new Date("2024-02-01"),
				periodEnd: new Date("2024-03-01"),
			});

			expect(result).toEqual(resetBalance);
			expect(mockExecuteAtomicReset).toHaveBeenCalledWith({
				organizationId: "org-1",
				periodStart: new Date("2024-02-01"),
				periodEnd: new Date("2024-03-01"),
			});
		});
	});
});

describe("Error Classes", () => {
	describe("InsufficientCreditsError", () => {
		it("should contain correct properties", () => {
			const error = new InsufficientCreditsError("org-1", 100, 50);

			expect(error.name).toBe("InsufficientCreditsError");
			expect(error.organizationId).toBe("org-1");
			expect(error.required).toBe(100);
			expect(error.available).toBe(50);
			expect(error.message).toBe(
				"Insufficient credits: required 100, available 50",
			);
		});
	});

	describe("CreditBalanceNotFoundError", () => {
		it("should contain correct properties", () => {
			const error = new CreditBalanceNotFoundError("org-1");

			expect(error.name).toBe("CreditBalanceNotFoundError");
			expect(error.organizationId).toBe("org-1");
			expect(error.message).toBe(
				"Credit balance not found for organization: org-1",
			);
		});
	});

	describe("TransactionNotFoundError", () => {
		it("should contain correct properties", () => {
			const error = new TransactionNotFoundError("tx-1");

			expect(error.name).toBe("TransactionNotFoundError");
			expect(error.transactionId).toBe("tx-1");
			expect(error.message).toBe("Transaction not found: tx-1");
		});
	});
});
