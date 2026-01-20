import { z } from "zod";

/**
 * Query parameters for GET /credits/history
 */
export const historyQuerySchema = z.object({
	limit: z.coerce.number().min(1).max(100).optional().default(50),
	offset: z.coerce.number().min(0).optional().default(0),
	toolSlug: z.string().optional(),
	type: z
		.enum(["GRANT", "USAGE", "OVERAGE", "REFUND", "PURCHASE", "ADJUSTMENT"])
		.optional(),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
});

export type HistoryQuery = z.infer<typeof historyQuerySchema>;

/**
 * Query parameters for GET /credits/usage-stats
 */
export const usageStatsQuerySchema = z.object({
	period: z.enum(["day", "week", "month"]).optional().default("day"),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
});

export type UsageStatsQuery = z.infer<typeof usageStatsQuerySchema>;

/**
 * Individual credit pack purchase
 */
export const creditPurchaseSchema = z.object({
	id: z.string(),
	amount: z.number(),
	description: z.string().nullable(),
	createdAt: z.string().datetime(),
});

export type CreditPurchase = z.infer<typeof creditPurchaseSchema>;

/**
 * Response schema for credit balance
 */
export const balanceResponseSchema = z.object({
	included: z.number(),
	used: z.number(),
	remaining: z.number(),
	overage: z.number(),
	purchasedCredits: z.number(),
	totalAvailable: z.number(),
	periodStart: z.string().datetime(),
	periodEnd: z.string().datetime(),
	plan: z.object({
		id: z.string(),
		name: z.string(),
	}),
	purchases: z.array(creditPurchaseSchema),
});

export type BalanceResponse = z.infer<typeof balanceResponseSchema>;

/**
 * Transaction item in history response
 */
export const transactionSchema = z.object({
	id: z.string(),
	amount: z.number(),
	type: z.enum([
		"GRANT",
		"USAGE",
		"OVERAGE",
		"REFUND",
		"PURCHASE",
		"ADJUSTMENT",
	]),
	toolSlug: z.string().nullable(),
	jobId: z.string().nullable(),
	description: z.string().nullable(),
	createdAt: z.string().datetime(),
});

export type Transaction = z.infer<typeof transactionSchema>;

/**
 * Response schema for credit history
 */
export const historyResponseSchema = z.object({
	transactions: z.array(transactionSchema),
	pagination: z.object({
		total: z.number(),
		limit: z.number(),
		offset: z.number(),
		hasMore: z.boolean(),
	}),
});

export type HistoryResponse = z.infer<typeof historyResponseSchema>;

/**
 * Tool usage item in usage stats response
 */
export const toolUsageSchema = z.object({
	toolSlug: z.string(),
	credits: z.number(),
	count: z.number(),
});

export type ToolUsage = z.infer<typeof toolUsageSchema>;

/**
 * Daily usage item in usage stats response
 */
export const dailyUsageSchema = z.object({
	date: z.string(),
	credits: z.number(),
});

export type DailyUsage = z.infer<typeof dailyUsageSchema>;

/**
 * Response schema for usage stats
 */
export const usageStatsResponseSchema = z.object({
	totalUsed: z.number(),
	totalOverage: z.number(),
	byTool: z.array(toolUsageSchema),
	byPeriod: z.array(dailyUsageSchema),
});

export type UsageStatsResponse = z.infer<typeof usageStatsResponseSchema>;
