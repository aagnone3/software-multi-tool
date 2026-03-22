import { describe, expect, it } from "vitest";
import {
	balanceResponseSchema,
	creditPurchaseSchema,
	historyQuerySchema,
	historyResponseSchema,
	toolUsageSchema,
	transactionSchema,
	usageStatsQuerySchema,
	usageStatsResponseSchema,
} from "./schemas";

describe("historyQuerySchema", () => {
	it("uses defaults when no input provided", () => {
		const result = historyQuerySchema.parse({});
		expect(result.limit).toBe(50);
		expect(result.offset).toBe(0);
	});

	it("accepts valid query params", () => {
		const result = historyQuerySchema.parse({
			limit: "10",
			offset: "5",
			toolSlug: "news-analyzer",
			type: "GRANT",
			startDate: "2026-01-01T00:00:00Z",
			endDate: "2026-01-31T23:59:59Z",
		});
		expect(result.limit).toBe(10);
		expect(result.offset).toBe(5);
		expect(result.toolSlug).toBe("news-analyzer");
		expect(result.type).toBe("GRANT");
	});

	it("rejects limit above 100", () => {
		expect(() => historyQuerySchema.parse({ limit: "101" })).toThrow();
	});

	it("rejects limit below 1", () => {
		expect(() => historyQuerySchema.parse({ limit: "0" })).toThrow();
	});

	it("rejects invalid type", () => {
		expect(() => historyQuerySchema.parse({ type: "INVALID" })).toThrow();
	});

	it("accepts all valid transaction types", () => {
		const types = [
			"GRANT",
			"USAGE",
			"OVERAGE",
			"REFUND",
			"PURCHASE",
			"ADJUSTMENT",
		] as const;
		for (const type of types) {
			const result = historyQuerySchema.parse({ type });
			expect(result.type).toBe(type);
		}
	});
});

describe("usageStatsQuerySchema", () => {
	it("uses day as default period", () => {
		const result = usageStatsQuerySchema.parse({});
		expect(result.period).toBe("day");
	});

	it("accepts week and month periods", () => {
		expect(usageStatsQuerySchema.parse({ period: "week" }).period).toBe(
			"week",
		);
		expect(usageStatsQuerySchema.parse({ period: "month" }).period).toBe(
			"month",
		);
	});

	it("rejects invalid period", () => {
		expect(() => usageStatsQuerySchema.parse({ period: "year" })).toThrow();
	});
});

describe("creditPurchaseSchema", () => {
	it("parses a valid credit purchase", () => {
		const result = creditPurchaseSchema.parse({
			id: "purchase-1",
			amount: 100,
			description: "Starter pack",
			createdAt: "2026-01-15T12:00:00Z",
		});
		expect(result.id).toBe("purchase-1");
		expect(result.amount).toBe(100);
	});

	it("accepts null description", () => {
		const result = creditPurchaseSchema.parse({
			id: "purchase-1",
			amount: 100,
			description: null,
			createdAt: "2026-01-15T12:00:00Z",
		});
		expect(result.description).toBeNull();
	});
});

describe("balanceResponseSchema", () => {
	it("parses a valid balance response", () => {
		const result = balanceResponseSchema.parse({
			included: 1000,
			used: 100,
			remaining: 900,
			overage: 0,
			purchasedCredits: 0,
			totalAvailable: 900,
			periodStart: "2026-01-01T00:00:00Z",
			periodEnd: "2026-01-31T23:59:59Z",
			plan: { id: "starter", name: "Starter" },
			purchases: [],
		});
		expect(result.included).toBe(1000);
		expect(result.remaining).toBe(900);
		expect(result.plan.id).toBe("starter");
	});
});

describe("transactionSchema", () => {
	it("parses a valid transaction", () => {
		const result = transactionSchema.parse({
			id: "txn-1",
			amount: -10,
			type: "USAGE",
			toolSlug: "news-analyzer",
			jobId: "job-abc",
			description: null,
			createdAt: "2026-01-15T12:00:00Z",
		});
		expect(result.type).toBe("USAGE");
		expect(result.toolSlug).toBe("news-analyzer");
		expect(result.jobId).toBe("job-abc");
	});

	it("accepts null toolSlug and jobId", () => {
		const result = transactionSchema.parse({
			id: "txn-2",
			amount: 100,
			type: "GRANT",
			toolSlug: null,
			jobId: null,
			description: "Monthly grant",
			createdAt: "2026-01-01T00:00:00Z",
		});
		expect(result.toolSlug).toBeNull();
		expect(result.jobId).toBeNull();
	});
});

describe("historyResponseSchema", () => {
	it("parses a valid history response with pagination", () => {
		const result = historyResponseSchema.parse({
			transactions: [],
			pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
		});
		expect(result.pagination.hasMore).toBe(false);
	});
});

describe("toolUsageSchema", () => {
	it("parses valid tool usage", () => {
		const result = toolUsageSchema.parse({
			toolSlug: "meeting-summarizer",
			credits: 50,
			count: 5,
		});
		expect(result.toolSlug).toBe("meeting-summarizer");
	});
});

describe("usageStatsResponseSchema", () => {
	it("parses a valid usage stats response", () => {
		const result = usageStatsResponseSchema.parse({
			totalUsed: 150,
			totalOverage: 10,
			byTool: [{ toolSlug: "news-analyzer", credits: 150, count: 15 }],
			byPeriod: [{ date: "2026-01-15", credits: 30 }],
		});
		expect(result.totalUsed).toBe(150);
		expect(result.byTool).toHaveLength(1);
		expect(result.byPeriod).toHaveLength(1);
	});
});
