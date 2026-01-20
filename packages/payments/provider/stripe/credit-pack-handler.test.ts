import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock database before importing the module
vi.mock("@repo/database", () => ({
	db: {
		creditTransaction: {
			findFirst: vi.fn(),
			create: vi.fn(),
		},
		creditBalance: {
			upsert: vi.fn(),
		},
		$transaction: vi.fn(),
	},
}));

vi.mock("@repo/logs", () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}));

// Import after mocks are set up
import { db } from "@repo/database";
import { grantPurchasedCredits } from "./credit-pack-handler";

describe("Credit Pack Handler", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("grantPurchasedCredits", () => {
		const mockParams = {
			organizationId: "org_test123",
			credits: 50,
			packId: "boost",
			packName: "Boost",
			stripeSessionId: "cs_test_abc123",
		};

		it("should grant credits for new purchase", async () => {
			// Mock: no existing transaction found (new purchase)
			vi.mocked(db.creditTransaction.findFirst).mockResolvedValue(null);

			// Mock: transaction succeeds
			const mockTransactionId = "txn_new123";
			vi.mocked(db.$transaction).mockImplementation(async () => {
				// Simulate the transaction returning a transaction ID
				return mockTransactionId;
			});

			const result = await grantPurchasedCredits(mockParams);

			// Should have checked for existing transaction
			expect(db.creditTransaction.findFirst).toHaveBeenCalledWith({
				where: {
					type: "PURCHASE",
					description: {
						contains: "cs_test_abc123",
					},
				},
				select: { id: true },
			});

			// Should have executed the transaction
			expect(db.$transaction).toHaveBeenCalled();

			// Should return processed: true with new transaction ID
			expect(result).toEqual({
				processed: true,
				transactionId: mockTransactionId,
			});
		});

		it("should return existing transaction for duplicate purchase (idempotency)", async () => {
			// Mock: existing transaction found (only id is selected)
			const existingTxnId = "txn_existing456";
			vi.mocked(db.creditTransaction.findFirst).mockResolvedValue({
				id: existingTxnId,
			} as never);

			const result = await grantPurchasedCredits(mockParams);

			// Should have checked for existing transaction
			expect(db.creditTransaction.findFirst).toHaveBeenCalledWith({
				where: {
					type: "PURCHASE",
					description: {
						contains: "cs_test_abc123",
					},
				},
				select: { id: true },
			});

			// Should NOT have executed a new transaction
			expect(db.$transaction).not.toHaveBeenCalled();

			// Should return processed: false with existing transaction ID
			expect(result).toEqual({
				processed: false,
				transactionId: existingTxnId,
			});
		});

		it("should handle different credit pack amounts", async () => {
			vi.mocked(db.creditTransaction.findFirst).mockResolvedValue(null);
			vi.mocked(db.$transaction).mockResolvedValue("txn_new");

			// Test with Bundle pack (200 credits)
			await grantPurchasedCredits({
				...mockParams,
				packId: "bundle",
				packName: "Bundle",
				credits: 200,
			});

			expect(db.$transaction).toHaveBeenCalled();

			vi.clearAllMocks();

			// Test with Vault pack (500 credits)
			await grantPurchasedCredits({
				...mockParams,
				packId: "vault",
				packName: "Vault",
				credits: 500,
			});

			expect(db.$transaction).toHaveBeenCalled();
		});

		it("should handle different stripe session IDs correctly", async () => {
			vi.mocked(db.creditTransaction.findFirst).mockResolvedValue(null);
			vi.mocked(db.$transaction).mockResolvedValue("txn_new");

			const session1 = "cs_test_session1";
			const session2 = "cs_test_session2";

			// First session
			await grantPurchasedCredits({
				...mockParams,
				stripeSessionId: session1,
			});

			expect(db.creditTransaction.findFirst).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						description: { contains: session1 },
					}),
				}),
			);

			vi.clearAllMocks();

			// Second session - different ID
			await grantPurchasedCredits({
				...mockParams,
				stripeSessionId: session2,
			});

			expect(db.creditTransaction.findFirst).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						description: { contains: session2 },
					}),
				}),
			);
		});
	});

	describe("Idempotency edge cases", () => {
		it("should handle rapid duplicate webhook calls", async () => {
			const mockParams = {
				organizationId: "org_rapid",
				credits: 50,
				packId: "boost",
				packName: "Boost",
				stripeSessionId: "cs_rapid_123",
			};

			// First call: no existing transaction
			vi.mocked(db.creditTransaction.findFirst).mockResolvedValueOnce(
				null,
			);
			vi.mocked(db.$transaction).mockResolvedValueOnce("txn_first");

			const result1 = await grantPurchasedCredits(mockParams);
			expect(result1.processed).toBe(true);

			// Second call: transaction now exists
			vi.mocked(db.creditTransaction.findFirst).mockResolvedValueOnce({
				id: "txn_first",
			} as never);

			const result2 = await grantPurchasedCredits(mockParams);
			expect(result2.processed).toBe(false);
			expect(result2.transactionId).toBe("txn_first");

			// Transaction should only be called once
			expect(db.$transaction).toHaveBeenCalledTimes(1);
		});

		it("should handle multiple organizations with same session pattern", async () => {
			// Different orgs but checking that session ID is the key
			vi.mocked(db.creditTransaction.findFirst)
				.mockResolvedValueOnce(null) // First org, no existing
				.mockResolvedValueOnce(null); // Second org, no existing

			vi.mocked(db.$transaction)
				.mockResolvedValueOnce("txn_org1")
				.mockResolvedValueOnce("txn_org2");

			const result1 = await grantPurchasedCredits({
				organizationId: "org_1",
				credits: 50,
				packId: "boost",
				packName: "Boost",
				stripeSessionId: "cs_unique_1",
			});

			const result2 = await grantPurchasedCredits({
				organizationId: "org_2",
				credits: 50,
				packId: "boost",
				packName: "Boost",
				stripeSessionId: "cs_unique_2",
			});

			// Both should be processed since different session IDs
			expect(result1.processed).toBe(true);
			expect(result2.processed).toBe(true);
			expect(db.$transaction).toHaveBeenCalledTimes(2);
		});
	});
});
