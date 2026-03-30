import { beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mocks
const mockFindCreditBalanceByOrgId = vi.hoisted(() => vi.fn());
const mockFindTransactionById = vi.hoisted(() => vi.fn());
const mockFindPurchaseTransaction = vi.hoisted(() => vi.fn());
const mockExecuteAtomicGrant = vi.hoisted(() => vi.fn());
const mockExecuteAtomicDeduction = vi.hoisted(() => vi.fn());
const mockExecuteAtomicRefund = vi.hoisted(() => vi.fn());
const mockExecuteAtomicReset = vi.hoisted(() => vi.fn());
const mockExecuteAtomicPurchaseGrant = vi.hoisted(() => vi.fn());
const mockGetPlanCredits = vi.hoisted(() => vi.fn());

vi.mock("./queries", () => ({
	findCreditBalanceByOrgId: mockFindCreditBalanceByOrgId,
	findTransactionById: mockFindTransactionById,
	findPurchaseTransaction: mockFindPurchaseTransaction,
	executeAtomicGrant: mockExecuteAtomicGrant,
	executeAtomicDeduction: mockExecuteAtomicDeduction,
	executeAtomicRefund: mockExecuteAtomicRefund,
	executeAtomicReset: mockExecuteAtomicReset,
	executeAtomicPurchaseGrant: mockExecuteAtomicPurchaseGrant,
}));

vi.mock("@repo/config", () => ({
	getPlanCredits: mockGetPlanCredits,
}));

import {
	deductCredits,
	getCreditStatus,
	getOrCreateCreditBalance,
	grantPurchasedCredits,
	grantSubscriptionCredits,
	hasCredits,
	refundCredits,
	resetBillingPeriod,
} from "./service";
import {
	CreditBalanceNotFoundError,
	InsufficientCreditsError,
	TransactionNotFoundError,
} from "./types";

const mockBalance = {
	id: "bal-1",
	organizationId: "org-1",
	included: 100,
	used: 20,
	purchasedCredits: 0,
	overage: 0,
	periodStart: new Date("2026-01-01"),
	periodEnd: new Date("2026-02-01"),
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("getOrCreateCreditBalance", () => {
	it("returns existing balance when found", async () => {
		mockFindCreditBalanceByOrgId.mockResolvedValue(mockBalance);
		const result = await getOrCreateCreditBalance("org-1");
		expect(result).toBe(mockBalance);
		expect(mockExecuteAtomicGrant).not.toHaveBeenCalled();
	});

	it("creates new balance with free plan credits when none exists", async () => {
		mockFindCreditBalanceByOrgId.mockResolvedValue(null);
		mockGetPlanCredits.mockReturnValue({ included: 10 });
		mockExecuteAtomicGrant.mockResolvedValue(mockBalance);
		const result = await getOrCreateCreditBalance("org-1");
		expect(mockGetPlanCredits).toHaveBeenCalledWith("free");
		expect(mockExecuteAtomicGrant).toHaveBeenCalledWith(
			expect.objectContaining({ organizationId: "org-1", included: 10 }),
		);
		expect(result).toBe(mockBalance);
	});
});

describe("hasCredits", () => {
	it("returns not allowed when no balance", async () => {
		mockFindCreditBalanceByOrgId.mockResolvedValue(null);
		const result = await hasCredits("org-1", 10);
		expect(result).toEqual({
			allowed: false,
			balance: 0,
			isOverage: false,
		});
	});

	it("returns allowed when sufficient included credits", async () => {
		mockFindCreditBalanceByOrgId.mockResolvedValue(mockBalance); // 100 included, 20 used → 80 remaining
		const result = await hasCredits("org-1", 50);
		expect(result.allowed).toBe(true);
		expect(result.balance).toBe(80);
		expect(result.isOverage).toBe(false);
	});

	it("returns not allowed when insufficient credits", async () => {
		mockFindCreditBalanceByOrgId.mockResolvedValue(mockBalance);
		const result = await hasCredits("org-1", 200);
		expect(result.allowed).toBe(false);
	});

	it("uses purchased credits in total available", async () => {
		const balWithPurchased = { ...mockBalance, purchasedCredits: 50 };
		mockFindCreditBalanceByOrgId.mockResolvedValue(balWithPurchased);
		const result = await hasCredits("org-1", 100);
		// 80 remaining + 50 purchased = 130 total
		expect(result.allowed).toBe(true);
		expect(result.balance).toBe(130);
	});
});

describe("getCreditStatus", () => {
	it("throws CreditBalanceNotFoundError when no balance", async () => {
		mockFindCreditBalanceByOrgId.mockResolvedValue(null);
		await expect(getCreditStatus("org-1")).rejects.toThrow(
			CreditBalanceNotFoundError,
		);
	});

	it("returns status with remaining calculated correctly", async () => {
		mockFindCreditBalanceByOrgId.mockResolvedValue(mockBalance);
		const result = await getCreditStatus("org-1");
		expect(result.included).toBe(100);
		expect(result.used).toBe(20);
		expect(result.remaining).toBe(80);
	});
});

describe("deductCredits", () => {
	it("throws CreditBalanceNotFoundError when no balance", async () => {
		mockFindCreditBalanceByOrgId.mockResolvedValue(null);
		await expect(
			deductCredits({
				organizationId: "org-1",
				amount: 10,
				toolSlug: "tool",
			}),
		).rejects.toThrow(CreditBalanceNotFoundError);
	});

	it("throws InsufficientCreditsError when not enough credits", async () => {
		mockFindCreditBalanceByOrgId.mockResolvedValue(mockBalance); // 80 available
		await expect(
			deductCredits({
				organizationId: "org-1",
				amount: 200,
				toolSlug: "tool",
			}),
		).rejects.toThrow(InsufficientCreditsError);
	});

	it("executes deduction when sufficient credits", async () => {
		const mockTx = { id: "tx-1" };
		mockFindCreditBalanceByOrgId.mockResolvedValue(mockBalance);
		mockExecuteAtomicDeduction.mockResolvedValue(mockTx);
		const result = await deductCredits({
			organizationId: "org-1",
			amount: 30,
			toolSlug: "tool",
		});
		expect(mockExecuteAtomicDeduction).toHaveBeenCalledWith(
			expect.objectContaining({ amount: 30, isOverage: false }),
		);
		expect(result).toBe(mockTx);
	});

	it("marks isOverage when using purchased credits", async () => {
		const tightBalance = {
			...mockBalance,
			included: 25,
			used: 20,
			purchasedCredits: 10,
		}; // 5 remaining included + 10 purchased = 15 total
		mockFindCreditBalanceByOrgId.mockResolvedValue(tightBalance);
		mockExecuteAtomicDeduction.mockResolvedValue({ id: "tx-1" });
		await deductCredits({
			organizationId: "org-1",
			amount: 10,
			toolSlug: "tool",
		});
		expect(mockExecuteAtomicDeduction).toHaveBeenCalledWith(
			expect.objectContaining({ isOverage: true }),
		);
	});
});

describe("refundCredits", () => {
	it("throws TransactionNotFoundError when tx not found", async () => {
		mockFindTransactionById.mockResolvedValue(null);
		await expect(
			refundCredits({ transactionId: "tx-x", reason: "failed" }),
		).rejects.toThrow(TransactionNotFoundError);
	});

	it("throws when trying to refund non-consumption transaction", async () => {
		mockFindTransactionById.mockResolvedValue({ id: "tx-1", amount: 50 }); // positive amount = grant
		await expect(
			refundCredits({ transactionId: "tx-1", reason: "test" }),
		).rejects.toThrow(/Cannot refund non-consumption/);
	});

	it("executes refund for consumption transactions", async () => {
		const original = { id: "tx-1", amount: -30 };
		const refundTx = { id: "tx-refund" };
		mockFindTransactionById.mockResolvedValue(original);
		mockExecuteAtomicRefund.mockResolvedValue(refundTx);
		const result = await refundCredits({
			transactionId: "tx-1",
			reason: "job failed",
		});
		expect(mockExecuteAtomicRefund).toHaveBeenCalledWith({
			originalTransaction: original,
			reason: "job failed",
		});
		expect(result).toBe(refundTx);
	});
});

describe("grantSubscriptionCredits", () => {
	it("throws when plan is unknown", async () => {
		mockGetPlanCredits.mockReturnValue(null);
		await expect(
			grantSubscriptionCredits({
				organizationId: "org-1",
				planId: "unknown-plan",
				periodStart: new Date(),
				periodEnd: new Date(),
			}),
		).rejects.toThrow(/Unknown plan/);
	});

	it("grants credits for known plan", async () => {
		mockGetPlanCredits.mockReturnValue({ included: 500 });
		mockExecuteAtomicGrant.mockResolvedValue(mockBalance);
		await grantSubscriptionCredits({
			organizationId: "org-1",
			planId: "pro",
			periodStart: new Date("2026-01-01"),
			periodEnd: new Date("2026-02-01"),
		});
		expect(mockExecuteAtomicGrant).toHaveBeenCalledWith(
			expect.objectContaining({ included: 500 }),
		);
	});
});

describe("resetBillingPeriod", () => {
	it("throws CreditBalanceNotFoundError when no balance", async () => {
		mockFindCreditBalanceByOrgId.mockResolvedValue(null);
		await expect(
			resetBillingPeriod({
				organizationId: "org-1",
				periodStart: new Date(),
				periodEnd: new Date(),
			}),
		).rejects.toThrow(CreditBalanceNotFoundError);
	});

	it("resets period when balance exists", async () => {
		mockFindCreditBalanceByOrgId.mockResolvedValue(mockBalance);
		mockExecuteAtomicReset.mockResolvedValue(mockBalance);
		await resetBillingPeriod({
			organizationId: "org-1",
			periodStart: new Date("2026-02-01"),
			periodEnd: new Date("2026-03-01"),
		});
		expect(mockExecuteAtomicReset).toHaveBeenCalledWith(
			expect.objectContaining({ organizationId: "org-1" }),
		);
	});
});

describe("grantPurchasedCredits", () => {
	it("returns existing transaction when already processed (idempotent)", async () => {
		const existing = { id: "tx-existing" };
		mockFindPurchaseTransaction.mockResolvedValue(existing);
		const result = await grantPurchasedCredits({
			organizationId: "org-1",
			credits: 100,
			packId: "pack-1",
			packName: "100 Pack",
			stripeSessionId: "sess-123",
		});
		expect(result.processed).toBe(false);
		expect(result.transaction).toBe(existing);
		expect(mockExecuteAtomicPurchaseGrant).not.toHaveBeenCalled();
	});

	it("processes new purchase when not already processed", async () => {
		const newTx = { id: "tx-new" };
		mockFindPurchaseTransaction.mockResolvedValue(null);
		mockExecuteAtomicPurchaseGrant.mockResolvedValue(newTx);
		const result = await grantPurchasedCredits({
			organizationId: "org-1",
			credits: 100,
			packId: "pack-1",
			packName: "100 Pack",
			stripeSessionId: "sess-456",
		});
		expect(result.processed).toBe(true);
		expect(result.transaction).toBe(newTx);
	});
});
