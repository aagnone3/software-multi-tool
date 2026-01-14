import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the database client
vi.mock("../client", () => ({
	db: {
		creditBalance: {
			findUnique: vi.fn(),
			upsert: vi.fn(),
			update: vi.fn(),
		},
		creditTransaction: {
			create: vi.fn(),
		},
		$transaction: vi.fn(),
	},
}));

import { db } from "../client";
import {
	adjustCreditsForPlanChange,
	getCreditBalanceByOrganizationId,
	grantCredits,
	resetCreditsForNewPeriod,
} from "./credit-balance";

describe("Credit Balance Queries", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getCreditBalanceByOrganizationId", () => {
		it("should return credit balance for existing organization", async () => {
			const mockBalance = {
				id: "balance_123",
				organizationId: "org_123",
				included: 500,
				used: 100,
				overage: 0,
				purchasedCredits: 0,
				periodStart: new Date("2026-01-01"),
				periodEnd: new Date("2026-02-01"),
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(db.creditBalance.findUnique).mockResolvedValue(
				mockBalance,
			);

			const result = await getCreditBalanceByOrganizationId("org_123");

			expect(db.creditBalance.findUnique).toHaveBeenCalledWith({
				where: { organizationId: "org_123" },
			});
			expect(result).toEqual(mockBalance);
		});

		it("should return null for non-existent organization", async () => {
			vi.mocked(db.creditBalance.findUnique).mockResolvedValue(null);

			const result =
				await getCreditBalanceByOrganizationId("org_nonexistent");

			expect(result).toBeNull();
		});
	});

	describe("grantCredits", () => {
		it("should create credit balance with transaction for new organization", async () => {
			const periodStart = new Date("2026-01-01");
			const periodEnd = new Date("2026-02-01");
			const mockBalance = {
				id: "balance_123",
				organizationId: "org_123",
				included: 500,
				used: 0,
				overage: 0,
				purchasedCredits: 0,
				periodStart,
				periodEnd,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			// Mock transaction to execute the callback
			vi.mocked(db.$transaction).mockImplementation(
				async (callback: any) => {
					const mockTx = {
						creditBalance: {
							upsert: vi.fn().mockResolvedValue(mockBalance),
						},
						creditTransaction: {
							create: vi.fn().mockResolvedValue({
								id: "tx_123",
								balanceId: "balance_123",
								amount: 500,
								type: "GRANT",
								description: expect.any(String),
								createdAt: new Date(),
							}),
						},
					};
					return callback(mockTx);
				},
			);

			const result = await grantCredits({
				organizationId: "org_123",
				included: 500,
				periodStart,
				periodEnd,
			});

			expect(db.$transaction).toHaveBeenCalled();
			expect(result).toEqual(mockBalance);
		});

		it("should update existing credit balance on upsert", async () => {
			const periodStart = new Date("2026-01-01");
			const periodEnd = new Date("2026-02-01");
			const mockBalance = {
				id: "balance_123",
				organizationId: "org_123",
				included: 1000, // Updated credits
				used: 0,
				overage: 0,
				purchasedCredits: 0,
				periodStart,
				periodEnd,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(db.$transaction).mockImplementation(
				async (callback: any) => {
					const mockTx = {
						creditBalance: {
							upsert: vi.fn().mockResolvedValue(mockBalance),
						},
						creditTransaction: {
							create: vi.fn().mockResolvedValue({
								id: "tx_124",
								balanceId: "balance_123",
								amount: 1000,
								type: "GRANT",
								description: expect.any(String),
								createdAt: new Date(),
							}),
						},
					};
					return callback(mockTx);
				},
			);

			const result = await grantCredits({
				organizationId: "org_123",
				included: 1000,
				periodStart,
				periodEnd,
			});

			expect(result.included).toBe(1000);
		});
	});

	describe("resetCreditsForNewPeriod", () => {
		it("should reset used and overage counters", async () => {
			const periodStart = new Date("2026-02-01");
			const periodEnd = new Date("2026-03-01");
			const existingBalance = {
				id: "balance_123",
				organizationId: "org_123",
				included: 500,
				used: 450,
				overage: 10,
				purchasedCredits: 100,
				periodStart: new Date("2026-01-01"),
				periodEnd: new Date("2026-02-01"),
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			const resetBalance = {
				...existingBalance,
				used: 0,
				overage: 0,
				periodStart,
				periodEnd,
			};

			vi.mocked(db.$transaction).mockImplementation(
				async (callback: any) => {
					const mockTx = {
						creditBalance: {
							findUnique: vi
								.fn()
								.mockResolvedValue(existingBalance),
							update: vi.fn().mockResolvedValue(resetBalance),
						},
						creditTransaction: {
							create: vi.fn().mockResolvedValue({
								id: "tx_125",
								balanceId: "balance_123",
								amount: 0,
								type: "ADJUSTMENT",
								description: expect.any(String),
								createdAt: new Date(),
							}),
						},
					};
					return callback(mockTx);
				},
			);

			const result = await resetCreditsForNewPeriod({
				organizationId: "org_123",
				periodStart,
				periodEnd,
			});

			expect(result.used).toBe(0);
			expect(result.overage).toBe(0);
			expect(result.purchasedCredits).toBe(100); // Preserved
			expect(result.included).toBe(500); // Preserved
		});

		it("should throw error if balance not found", async () => {
			vi.mocked(db.$transaction).mockImplementation(
				async (callback: any) => {
					const mockTx = {
						creditBalance: {
							findUnique: vi.fn().mockResolvedValue(null),
						},
					};
					return callback(mockTx);
				},
			);

			await expect(
				resetCreditsForNewPeriod({
					organizationId: "org_nonexistent",
					periodStart: new Date(),
					periodEnd: new Date(),
				}),
			).rejects.toThrow("Credit balance not found");
		});
	});

	describe("adjustCreditsForPlanChange", () => {
		it("should update included credits and create adjustment transaction", async () => {
			const existingBalance = {
				id: "balance_123",
				organizationId: "org_123",
				included: 500,
				used: 100,
				overage: 0,
				purchasedCredits: 0,
				periodStart: new Date("2026-01-01"),
				periodEnd: new Date("2026-02-01"),
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			const updatedBalance = {
				...existingBalance,
				included: 1000,
			};

			vi.mocked(db.$transaction).mockImplementation(
				async (callback: any) => {
					const mockTx = {
						creditBalance: {
							findUnique: vi
								.fn()
								.mockResolvedValue(existingBalance),
							update: vi.fn().mockResolvedValue(updatedBalance),
						},
						creditTransaction: {
							create: vi.fn().mockResolvedValue({
								id: "tx_126",
								balanceId: "balance_123",
								amount: 500, // Difference: 1000 - 500
								type: "ADJUSTMENT",
								description: "Plan upgrade",
								createdAt: new Date(),
							}),
						},
					};
					return callback(mockTx);
				},
			);

			const result = await adjustCreditsForPlanChange({
				organizationId: "org_123",
				newIncluded: 1000,
				description: "Plan upgrade",
			});

			expect(result.included).toBe(1000);
		});

		it("should handle credit reduction on downgrade", async () => {
			const existingBalance = {
				id: "balance_123",
				organizationId: "org_123",
				included: 1000,
				used: 100,
				overage: 0,
				purchasedCredits: 0,
				periodStart: new Date("2026-01-01"),
				periodEnd: new Date("2026-02-01"),
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			const updatedBalance = {
				...existingBalance,
				included: 500,
			};

			vi.mocked(db.$transaction).mockImplementation(
				async (callback: any) => {
					const mockTx = {
						creditBalance: {
							findUnique: vi
								.fn()
								.mockResolvedValue(existingBalance),
							update: vi.fn().mockResolvedValue(updatedBalance),
						},
						creditTransaction: {
							create: vi.fn().mockResolvedValue({
								id: "tx_127",
								balanceId: "balance_123",
								amount: -500, // Negative difference: 500 - 1000
								type: "ADJUSTMENT",
								description: "Plan downgrade",
								createdAt: new Date(),
							}),
						},
					};
					return callback(mockTx);
				},
			);

			const result = await adjustCreditsForPlanChange({
				organizationId: "org_123",
				newIncluded: 500,
				description: "Plan downgrade",
			});

			expect(result.included).toBe(500);
		});

		it("should throw error if balance not found", async () => {
			vi.mocked(db.$transaction).mockImplementation(
				async (callback: any) => {
					const mockTx = {
						creditBalance: {
							findUnique: vi.fn().mockResolvedValue(null),
						},
					};
					return callback(mockTx);
				},
			);

			await expect(
				adjustCreditsForPlanChange({
					organizationId: "org_nonexistent",
					newIncluded: 1000,
					description: "Plan upgrade",
				}),
			).rejects.toThrow("Credit balance not found");
		});
	});
});
