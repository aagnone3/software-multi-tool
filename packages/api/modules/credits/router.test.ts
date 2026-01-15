import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { creditsRouter } from "./router";

// Mock dependencies
const getSessionMock = vi.hoisted(() => vi.fn());
const getPurchasesByOrganizationIdMock = vi.hoisted(() => vi.fn());

// Credit service mocks
const getCreditStatusMock = vi.hoisted(() => vi.fn());
const getOrCreateCreditBalanceMock = vi.hoisted(() => vi.fn());

// Credit query mocks
const getTransactionHistoryMock = vi.hoisted(() => vi.fn());
const getUsageStatsMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

vi.mock("@repo/database", () => ({
	getPurchasesByOrganizationId: getPurchasesByOrganizationIdMock,
}));

vi.mock("@repo/payments", () => ({
	createPurchasesHelper: vi.fn(() => ({
		activePlan: { id: "pro", status: "active" },
	})),
}));

vi.mock("../../lib/credits", () => ({
	getCreditStatus: getCreditStatusMock,
	getOrCreateCreditBalance: getOrCreateCreditBalanceMock,
}));

vi.mock("../../lib/credits/queries", () => ({
	getTransactionHistory: getTransactionHistoryMock,
	getUsageStats: getUsageStatsMock,
}));

describe("Credits Router", () => {
	const mockSession = {
		user: {
			id: "user-123",
			email: "test@example.com",
			name: "Test User",
			role: "member",
		},
		session: {
			id: "session-1",
			activeOrganizationId: "org-123",
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();

		getSessionMock.mockResolvedValue(mockSession);
		getPurchasesByOrganizationIdMock.mockResolvedValue([
			{ id: "purchase-1", productId: "prod_123", type: "SUBSCRIPTION" },
		]);
	});

	describe("credits.balance", () => {
		const createClient = () =>
			createProcedureClient(creditsRouter.balance, {
				context: {
					headers: new Headers(),
				},
			});

		it("returns current credit balance for organization", async () => {
			const mockCreditStatus = {
				included: 500,
				used: 150,
				remaining: 350,
				overage: 0,
				purchasedCredits: 100,
				periodStart: new Date("2026-01-01T00:00:00Z"),
				periodEnd: new Date("2026-02-01T00:00:00Z"),
			};

			getCreditStatusMock.mockResolvedValue(mockCreditStatus);
			getOrCreateCreditBalanceMock.mockResolvedValue({ id: "balance-1" });

			const client = createClient();
			const result = await client({});

			expect(result).toEqual({
				included: 500,
				used: 150,
				remaining: 350,
				overage: 0,
				purchasedCredits: 100,
				totalAvailable: 450, // 350 remaining + 100 purchased
				periodStart: "2026-01-01T00:00:00.000Z",
				periodEnd: "2026-02-01T00:00:00.000Z",
				plan: {
					id: "pro",
					name: "Pro",
				},
			});
		});

		it("throws BAD_REQUEST when no active organization", async () => {
			getSessionMock.mockResolvedValue({
				...mockSession,
				session: { id: "session-1", activeOrganizationId: null },
			});

			const client = createClient();

			await expect(client({})).rejects.toMatchObject({
				code: "BAD_REQUEST",
			});
		});

		it("throws UNAUTHORIZED when not authenticated", async () => {
			getSessionMock.mockResolvedValue(null);

			const client = createClient();

			await expect(client({})).rejects.toMatchObject({
				code: "UNAUTHORIZED",
			});
		});
	});

	describe("credits.history", () => {
		const createClient = () =>
			createProcedureClient(creditsRouter.history, {
				context: {
					headers: new Headers(),
				},
			});

		it("returns paginated transaction history", async () => {
			const mockTransactions = [
				{
					id: "tx-1",
					amount: -5,
					type: "USAGE",
					toolSlug: "invoice-processor",
					jobId: "job-1",
					description: null,
					createdAt: new Date("2026-01-14T10:00:00Z"),
				},
				{
					id: "tx-2",
					amount: -3,
					type: "USAGE",
					toolSlug: "news-analyzer",
					jobId: "job-2",
					description: null,
					createdAt: new Date("2026-01-14T09:00:00Z"),
				},
			];

			getTransactionHistoryMock.mockResolvedValue({
				transactions: mockTransactions,
				total: 25,
			});

			const client = createClient();
			const result = await client({ limit: 10, offset: 0 });

			expect(result).toEqual({
				transactions: [
					{
						id: "tx-1",
						amount: -5,
						type: "USAGE",
						toolSlug: "invoice-processor",
						jobId: "job-1",
						description: null,
						createdAt: "2026-01-14T10:00:00.000Z",
					},
					{
						id: "tx-2",
						amount: -3,
						type: "USAGE",
						toolSlug: "news-analyzer",
						jobId: "job-2",
						description: null,
						createdAt: "2026-01-14T09:00:00.000Z",
					},
				],
				pagination: {
					total: 25,
					limit: 10,
					offset: 0,
					hasMore: true,
				},
			});

			expect(getTransactionHistoryMock).toHaveBeenCalledWith({
				organizationId: "org-123",
				limit: 10,
				offset: 0,
				toolSlug: undefined,
				type: undefined,
				startDate: undefined,
				endDate: undefined,
			});
		});

		it("applies filters correctly", async () => {
			getTransactionHistoryMock.mockResolvedValue({
				transactions: [],
				total: 0,
			});

			const client = createClient();
			await client({
				limit: 20,
				offset: 10,
				toolSlug: "invoice-processor",
				type: "USAGE",
				startDate: "2026-01-01T00:00:00Z",
				endDate: "2026-01-31T23:59:59Z",
			});

			expect(getTransactionHistoryMock).toHaveBeenCalledWith({
				organizationId: "org-123",
				limit: 20,
				offset: 10,
				toolSlug: "invoice-processor",
				type: "USAGE",
				startDate: new Date("2026-01-01T00:00:00Z"),
				endDate: new Date("2026-01-31T23:59:59Z"),
			});
		});

		it("returns hasMore: false when at end of results", async () => {
			getTransactionHistoryMock.mockResolvedValue({
				transactions: [
					{
						id: "tx-1",
						amount: -5,
						type: "USAGE",
						toolSlug: "test",
						jobId: null,
						description: null,
						createdAt: new Date("2026-01-14T10:00:00Z"),
					},
				],
				total: 1,
			});

			const client = createClient();
			const result = await client({ limit: 50, offset: 0 });

			expect(result.pagination.hasMore).toBe(false);
		});

		it("throws BAD_REQUEST when no active organization", async () => {
			getSessionMock.mockResolvedValue({
				...mockSession,
				session: { id: "session-1", activeOrganizationId: null },
			});

			const client = createClient();

			await expect(client({})).rejects.toMatchObject({
				code: "BAD_REQUEST",
			});
		});
	});

	describe("credits.usageStats", () => {
		const createClient = () =>
			createProcedureClient(creditsRouter.usageStats, {
				context: {
					headers: new Headers(),
				},
			});

		it("returns aggregated usage statistics", async () => {
			const mockStats = {
				totalUsed: 250,
				totalOverage: 10,
				byTool: [
					{ toolSlug: "invoice-processor", credits: 150, count: 50 },
					{ toolSlug: "news-analyzer", credits: 100, count: 100 },
				],
				byDay: [
					{ date: "2026-01-14", credits: 45 },
					{ date: "2026-01-13", credits: 55 },
				],
			};

			getUsageStatsMock.mockResolvedValue(mockStats);

			const client = createClient();
			const result = await client({});

			expect(result).toEqual({
				totalUsed: 250,
				totalOverage: 10,
				byTool: [
					{ toolSlug: "invoice-processor", credits: 150, count: 50 },
					{ toolSlug: "news-analyzer", credits: 100, count: 100 },
				],
				byPeriod: [
					{ date: "2026-01-14", credits: 45 },
					{ date: "2026-01-13", credits: 55 },
				],
			});
		});

		it("applies date filters correctly", async () => {
			getUsageStatsMock.mockResolvedValue({
				totalUsed: 0,
				totalOverage: 0,
				byTool: [],
				byDay: [],
			});

			const client = createClient();
			await client({
				startDate: "2026-01-01T00:00:00Z",
				endDate: "2026-01-31T23:59:59Z",
			});

			expect(getUsageStatsMock).toHaveBeenCalledWith({
				organizationId: "org-123",
				startDate: new Date("2026-01-01T00:00:00Z"),
				endDate: new Date("2026-01-31T23:59:59Z"),
			});
		});

		it("throws BAD_REQUEST when no active organization", async () => {
			getSessionMock.mockResolvedValue({
				...mockSession,
				session: { id: "session-1", activeOrganizationId: null },
			});

			const client = createClient();

			await expect(client({})).rejects.toMatchObject({
				code: "BAD_REQUEST",
			});
		});

		it("throws UNAUTHORIZED when not authenticated", async () => {
			getSessionMock.mockResolvedValue(null);

			const client = createClient();

			await expect(client({})).rejects.toMatchObject({
				code: "UNAUTHORIZED",
			});
		});
	});
});
