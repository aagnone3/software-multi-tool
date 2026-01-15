import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Prisma - use hoisted mocks
const mockFindUnique = vi.hoisted(() => vi.fn());
const mockFindMany = vi.hoisted(() => vi.fn());
const mockCount = vi.hoisted(() => vi.fn());

vi.mock("@repo/database", () => ({
	db: {
		creditBalance: {
			findUnique: mockFindUnique,
		},
		creditTransaction: {
			findMany: mockFindMany,
			count: mockCount,
		},
	},
}));

// Import after mocking
import { getTransactionHistory, getUsageStats } from "./queries";

describe("Credit Queries", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getTransactionHistory", () => {
		it("returns empty result when no balance exists", async () => {
			mockFindUnique.mockResolvedValue(null);

			const result = await getTransactionHistory({
				organizationId: "org-123",
				limit: 50,
				offset: 0,
			});

			expect(result).toEqual({ transactions: [], total: 0 });
			expect(mockFindUnique).toHaveBeenCalledWith({
				where: { organizationId: "org-123" },
				select: { id: true },
			});
		});

		it("returns paginated transactions when balance exists", async () => {
			const mockBalance = { id: "balance-1" };
			const mockTransactions = [
				{
					id: "tx-1",
					balanceId: "balance-1",
					amount: -5,
					type: "USAGE",
					toolSlug: "invoice-processor",
					jobId: "job-1",
					description: null,
					createdAt: new Date("2026-01-14T10:00:00Z"),
				},
				{
					id: "tx-2",
					balanceId: "balance-1",
					amount: -3,
					type: "USAGE",
					toolSlug: "news-analyzer",
					jobId: "job-2",
					description: null,
					createdAt: new Date("2026-01-14T09:00:00Z"),
				},
			];

			mockFindUnique.mockResolvedValue(mockBalance);
			mockFindMany.mockResolvedValue(mockTransactions);
			mockCount.mockResolvedValue(25);

			const result = await getTransactionHistory({
				organizationId: "org-123",
				limit: 10,
				offset: 0,
			});

			expect(result).toEqual({
				transactions: mockTransactions,
				total: 25,
			});
			expect(mockFindMany).toHaveBeenCalledWith({
				where: { balanceId: "balance-1" },
				orderBy: { createdAt: "desc" },
				take: 10,
				skip: 0,
			});
		});

		it("applies toolSlug filter", async () => {
			mockFindUnique.mockResolvedValue({ id: "balance-1" });
			mockFindMany.mockResolvedValue([]);
			mockCount.mockResolvedValue(0);

			await getTransactionHistory({
				organizationId: "org-123",
				limit: 50,
				offset: 0,
				toolSlug: "invoice-processor",
			});

			expect(mockFindMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						balanceId: "balance-1",
						toolSlug: "invoice-processor",
					},
				}),
			);
		});

		it("applies type filter", async () => {
			mockFindUnique.mockResolvedValue({ id: "balance-1" });
			mockFindMany.mockResolvedValue([]);
			mockCount.mockResolvedValue(0);

			await getTransactionHistory({
				organizationId: "org-123",
				limit: 50,
				offset: 0,
				type: "USAGE",
			});

			expect(mockFindMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						balanceId: "balance-1",
						type: "USAGE",
					},
				}),
			);
		});

		it("applies date range filters", async () => {
			mockFindUnique.mockResolvedValue({ id: "balance-1" });
			mockFindMany.mockResolvedValue([]);
			mockCount.mockResolvedValue(0);

			const startDate = new Date("2026-01-01T00:00:00Z");
			const endDate = new Date("2026-01-31T23:59:59Z");

			await getTransactionHistory({
				organizationId: "org-123",
				limit: 50,
				offset: 0,
				startDate,
				endDate,
			});

			expect(mockFindMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						balanceId: "balance-1",
						createdAt: {
							gte: startDate,
							lte: endDate,
						},
					},
				}),
			);
		});

		it("applies only startDate filter", async () => {
			mockFindUnique.mockResolvedValue({ id: "balance-1" });
			mockFindMany.mockResolvedValue([]);
			mockCount.mockResolvedValue(0);

			const startDate = new Date("2026-01-01T00:00:00Z");

			await getTransactionHistory({
				organizationId: "org-123",
				limit: 50,
				offset: 0,
				startDate,
			});

			expect(mockFindMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						balanceId: "balance-1",
						createdAt: {
							gte: startDate,
						},
					},
				}),
			);
		});

		it("applies only endDate filter", async () => {
			mockFindUnique.mockResolvedValue({ id: "balance-1" });
			mockFindMany.mockResolvedValue([]);
			mockCount.mockResolvedValue(0);

			const endDate = new Date("2026-01-31T23:59:59Z");

			await getTransactionHistory({
				organizationId: "org-123",
				limit: 50,
				offset: 0,
				endDate,
			});

			expect(mockFindMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						balanceId: "balance-1",
						createdAt: {
							lte: endDate,
						},
					},
				}),
			);
		});

		it("applies pagination correctly", async () => {
			mockFindUnique.mockResolvedValue({ id: "balance-1" });
			mockFindMany.mockResolvedValue([]);
			mockCount.mockResolvedValue(100);

			await getTransactionHistory({
				organizationId: "org-123",
				limit: 20,
				offset: 40,
			});

			expect(mockFindMany).toHaveBeenCalledWith(
				expect.objectContaining({
					take: 20,
					skip: 40,
				}),
			);
		});

		it("combines multiple filters", async () => {
			mockFindUnique.mockResolvedValue({ id: "balance-1" });
			mockFindMany.mockResolvedValue([]);
			mockCount.mockResolvedValue(0);

			const startDate = new Date("2026-01-01T00:00:00Z");
			const endDate = new Date("2026-01-31T23:59:59Z");

			await getTransactionHistory({
				organizationId: "org-123",
				limit: 50,
				offset: 0,
				toolSlug: "invoice-processor",
				type: "USAGE",
				startDate,
				endDate,
			});

			expect(mockFindMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						balanceId: "balance-1",
						toolSlug: "invoice-processor",
						type: "USAGE",
						createdAt: {
							gte: startDate,
							lte: endDate,
						},
					},
				}),
			);
		});
	});

	describe("getUsageStats", () => {
		it("returns empty stats when no balance exists", async () => {
			mockFindUnique.mockResolvedValue(null);

			const result = await getUsageStats({
				organizationId: "org-123",
			});

			expect(result).toEqual({
				totalUsed: 0,
				totalOverage: 0,
				byTool: [],
				byDay: [],
			});
		});

		it("calculates totals and aggregations from transactions", async () => {
			mockFindUnique.mockResolvedValue({ id: "balance-1" });
			mockFindMany.mockResolvedValue([
				{
					amount: -5,
					type: "USAGE",
					toolSlug: "invoice-processor",
					createdAt: new Date("2026-01-14T10:00:00Z"),
				},
				{
					amount: -3,
					type: "USAGE",
					toolSlug: "invoice-processor",
					createdAt: new Date("2026-01-14T11:00:00Z"),
				},
				{
					amount: -2,
					type: "OVERAGE",
					toolSlug: "news-analyzer",
					createdAt: new Date("2026-01-13T10:00:00Z"),
				},
				{
					amount: -1,
					type: "USAGE",
					toolSlug: "news-analyzer",
					createdAt: new Date("2026-01-13T11:00:00Z"),
				},
			]);

			const result = await getUsageStats({
				organizationId: "org-123",
			});

			expect(result.totalUsed).toBe(9); // 5 + 3 + 1 = 9 (USAGE)
			expect(result.totalOverage).toBe(2); // 2 (OVERAGE)

			// byTool should be sorted by credits descending
			expect(result.byTool).toEqual([
				{ toolSlug: "invoice-processor", credits: 8, count: 2 },
				{ toolSlug: "news-analyzer", credits: 3, count: 2 },
			]);

			// byDay should be sorted by date descending
			expect(result.byDay).toEqual([
				{ date: "2026-01-14", credits: 8 },
				{ date: "2026-01-13", credits: 3 },
			]);
		});

		it("applies date filters", async () => {
			mockFindUnique.mockResolvedValue({ id: "balance-1" });
			mockFindMany.mockResolvedValue([]);

			const startDate = new Date("2026-01-01T00:00:00Z");
			const endDate = new Date("2026-01-31T23:59:59Z");

			await getUsageStats({
				organizationId: "org-123",
				startDate,
				endDate,
			});

			expect(mockFindMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						balanceId: "balance-1",
						type: { in: ["USAGE", "OVERAGE"] },
						createdAt: {
							gte: startDate,
							lte: endDate,
						},
					},
				}),
			);
		});

		it("only queries USAGE and OVERAGE transaction types", async () => {
			mockFindUnique.mockResolvedValue({ id: "balance-1" });
			mockFindMany.mockResolvedValue([]);

			await getUsageStats({
				organizationId: "org-123",
			});

			expect(mockFindMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						balanceId: "balance-1",
						type: { in: ["USAGE", "OVERAGE"] },
					},
				}),
			);
		});

		it("handles transactions without toolSlug", async () => {
			mockFindUnique.mockResolvedValue({ id: "balance-1" });
			mockFindMany.mockResolvedValue([
				{
					amount: -5,
					type: "USAGE",
					toolSlug: null,
					createdAt: new Date("2026-01-14T10:00:00Z"),
				},
				{
					amount: -3,
					type: "USAGE",
					toolSlug: "invoice-processor",
					createdAt: new Date("2026-01-14T11:00:00Z"),
				},
			]);

			const result = await getUsageStats({
				organizationId: "org-123",
			});

			// Only transactions with toolSlug should appear in byTool
			expect(result.byTool).toEqual([
				{ toolSlug: "invoice-processor", credits: 3, count: 1 },
			]);

			// All transactions should be in byDay
			expect(result.byDay).toEqual([{ date: "2026-01-14", credits: 8 }]);
		});

		it("applies only startDate filter", async () => {
			mockFindUnique.mockResolvedValue({ id: "balance-1" });
			mockFindMany.mockResolvedValue([]);

			const startDate = new Date("2026-01-01T00:00:00Z");

			await getUsageStats({
				organizationId: "org-123",
				startDate,
			});

			expect(mockFindMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						balanceId: "balance-1",
						type: { in: ["USAGE", "OVERAGE"] },
						createdAt: {
							gte: startDate,
						},
					},
				}),
			);
		});

		it("applies only endDate filter", async () => {
			mockFindUnique.mockResolvedValue({ id: "balance-1" });
			mockFindMany.mockResolvedValue([]);

			const endDate = new Date("2026-01-31T23:59:59Z");

			await getUsageStats({
				organizationId: "org-123",
				endDate,
			});

			expect(mockFindMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						balanceId: "balance-1",
						type: { in: ["USAGE", "OVERAGE"] },
						createdAt: {
							lte: endDate,
						},
					},
				}),
			);
		});
	});
});
