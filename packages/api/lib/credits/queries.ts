import { type CreditTransactionType, db, type Prisma } from "@repo/database";
import type { CreditBalance, CreditTransaction } from "./types";

/**
 * Find a credit balance by organization ID
 */
export async function findCreditBalanceByOrgId(
	organizationId: string,
): Promise<CreditBalance | null> {
	return db.creditBalance.findUnique({
		where: { organizationId },
	});
}

/**
 * Find a credit balance by ID
 */
export async function findCreditBalanceById(
	id: string,
): Promise<CreditBalance | null> {
	return db.creditBalance.findUnique({
		where: { id },
	});
}

/**
 * Create a new credit balance for an organization
 */
export async function createCreditBalance(
	data: Prisma.CreditBalanceCreateInput,
): Promise<CreditBalance> {
	return db.creditBalance.create({ data });
}

/**
 * Update a credit balance
 */
export async function updateCreditBalance(
	id: string,
	data: Prisma.CreditBalanceUpdateInput,
): Promise<CreditBalance> {
	return db.creditBalance.update({
		where: { id },
		data,
	});
}

/**
 * Find a transaction by ID
 */
export async function findTransactionById(
	id: string,
): Promise<CreditTransaction | null> {
	return db.creditTransaction.findUnique({
		where: { id },
	});
}

/**
 * Create a new credit transaction
 */
export async function createTransaction(
	data: Prisma.CreditTransactionCreateInput,
): Promise<CreditTransaction> {
	return db.creditTransaction.create({ data });
}

/**
 * Execute a transactional deduction with atomic balance update
 * This is the core atomic operation for credit consumption
 */
export async function executeAtomicDeduction(params: {
	balanceId: string;
	organizationId: string;
	amount: number;
	isOverage: boolean;
	remaining: number;
	toolSlug: string;
	jobId?: string;
	description?: string;
}): Promise<CreditTransaction> {
	const {
		balanceId,
		amount,
		isOverage,
		remaining,
		toolSlug,
		jobId,
		description,
	} = params;

	return db.$transaction(async (tx) => {
		// Update balance atomically
		if (isOverage) {
			// All remaining credits are used, rest goes to overage
			const usedFromIncluded = remaining;
			const overageAmount = amount - remaining;

			await tx.creditBalance.update({
				where: { id: balanceId },
				data: {
					used: { increment: usedFromIncluded },
					overage: { increment: overageAmount },
				},
			});
		} else {
			// Normal usage from included credits
			await tx.creditBalance.update({
				where: { id: balanceId },
				data: {
					used: { increment: amount },
				},
			});
		}

		// Create transaction record
		const transactionType: CreditTransactionType = isOverage
			? "OVERAGE"
			: "USAGE";

		return tx.creditTransaction.create({
			data: {
				balance: { connect: { id: balanceId } },
				amount: -amount, // Negative for consumption
				type: transactionType,
				toolSlug,
				jobId,
				description,
			},
		});
	});
}

/**
 * Execute an atomic refund operation
 */
export async function executeAtomicRefund(params: {
	originalTransaction: CreditTransaction;
	reason?: string;
}): Promise<CreditTransaction> {
	const { originalTransaction, reason } = params;

	return db.$transaction(async (tx) => {
		// The original amount is negative, so we add the absolute value back
		const refundAmount = Math.abs(originalTransaction.amount);

		// Determine how to apply the refund based on original transaction type
		if (originalTransaction.type === "OVERAGE") {
			// Refund overage first
			await tx.creditBalance.update({
				where: { id: originalTransaction.balanceId },
				data: {
					overage: { decrement: refundAmount },
				},
			});
		} else {
			// Refund regular usage
			await tx.creditBalance.update({
				where: { id: originalTransaction.balanceId },
				data: {
					used: { decrement: refundAmount },
				},
			});
		}

		// Create refund transaction record
		return tx.creditTransaction.create({
			data: {
				balance: { connect: { id: originalTransaction.balanceId } },
				amount: refundAmount, // Positive for refund
				type: "REFUND",
				toolSlug: originalTransaction.toolSlug,
				jobId: originalTransaction.jobId,
				description:
					reason ??
					`Refund for transaction ${originalTransaction.id}`,
			},
		});
	});
}

/**
 * Execute an atomic grant operation for subscription credits
 */
export async function executeAtomicGrant(params: {
	organizationId: string;
	included: number;
	periodStart: Date;
	periodEnd: Date;
}): Promise<CreditBalance> {
	const { organizationId, included, periodStart, periodEnd } = params;

	return db.$transaction(async (tx) => {
		// Upsert the credit balance
		const balance = await tx.creditBalance.upsert({
			where: { organizationId },
			create: {
				organization: { connect: { id: organizationId } },
				included,
				used: 0,
				overage: 0,
				purchasedCredits: 0,
				periodStart,
				periodEnd,
			},
			update: {
				included,
				periodStart,
				periodEnd,
			},
		});

		// Create grant transaction
		await tx.creditTransaction.create({
			data: {
				balance: { connect: { id: balance.id } },
				amount: included,
				type: "GRANT",
				description: `Subscription credits granted for period ${periodStart.toISOString()} - ${periodEnd.toISOString()}`,
			},
		});

		return balance;
	});
}

/**
 * Parameters for querying transaction history
 */
export interface TransactionHistoryParams {
	organizationId: string;
	limit: number;
	offset: number;
	toolSlug?: string;
	type?: CreditTransactionType;
	startDate?: Date;
	endDate?: Date;
}

/**
 * Result of transaction history query
 */
export interface TransactionHistoryResult {
	transactions: CreditTransaction[];
	total: number;
}

/**
 * Get transaction history for an organization with pagination and filtering
 */
export async function getTransactionHistory(
	params: TransactionHistoryParams,
): Promise<TransactionHistoryResult> {
	const {
		organizationId,
		limit,
		offset,
		toolSlug,
		type,
		startDate,
		endDate,
	} = params;

	// First get the balance ID for this organization
	const balance = await db.creditBalance.findUnique({
		where: { organizationId },
		select: { id: true },
	});

	if (!balance) {
		return { transactions: [], total: 0 };
	}

	// Build where clause
	const where: Prisma.CreditTransactionWhereInput = {
		balanceId: balance.id,
	};

	if (toolSlug) {
		where.toolSlug = toolSlug;
	}

	if (type) {
		where.type = type;
	}

	if (startDate || endDate) {
		where.createdAt = {};
		if (startDate) {
			where.createdAt.gte = startDate;
		}
		if (endDate) {
			where.createdAt.lte = endDate;
		}
	}

	// Execute query with count
	const [transactions, total] = await Promise.all([
		db.creditTransaction.findMany({
			where,
			orderBy: { createdAt: "desc" },
			take: limit,
			skip: offset,
		}),
		db.creditTransaction.count({ where }),
	]);

	return { transactions, total };
}

/**
 * Parameters for usage stats aggregation
 */
export interface UsageStatsParams {
	organizationId: string;
	startDate?: Date;
	endDate?: Date;
}

/**
 * Tool usage aggregation result
 */
export interface ToolUsageAggregation {
	toolSlug: string;
	credits: number;
	count: number;
}

/**
 * Daily usage aggregation result
 */
export interface DailyUsageAggregation {
	date: string;
	credits: number;
}

/**
 * Get aggregated usage statistics for an organization
 */
export async function getUsageStats(params: UsageStatsParams): Promise<{
	totalUsed: number;
	totalOverage: number;
	byTool: ToolUsageAggregation[];
	byDay: DailyUsageAggregation[];
}> {
	const { organizationId, startDate, endDate } = params;

	// Get the balance ID for this organization
	const balance = await db.creditBalance.findUnique({
		where: { organizationId },
		select: { id: true },
	});

	if (!balance) {
		return { totalUsed: 0, totalOverage: 0, byTool: [], byDay: [] };
	}

	// Build date filter
	const dateFilter: Prisma.CreditTransactionWhereInput["createdAt"] = {};
	if (startDate) {
		dateFilter.gte = startDate;
	}
	if (endDate) {
		dateFilter.lte = endDate;
	}

	const hasDateFilter = startDate || endDate;

	// Get usage transactions (USAGE and OVERAGE types have negative amounts)
	const usageTransactions = await db.creditTransaction.findMany({
		where: {
			balanceId: balance.id,
			type: { in: ["USAGE", "OVERAGE"] },
			...(hasDateFilter ? { createdAt: dateFilter } : {}),
		},
		select: {
			amount: true,
			type: true,
			toolSlug: true,
			createdAt: true,
		},
	});

	// Calculate totals
	let totalUsed = 0;
	let totalOverage = 0;
	const toolUsageMap = new Map<string, { credits: number; count: number }>();
	const dayUsageMap = new Map<string, number>();

	for (const tx of usageTransactions) {
		const credits = Math.abs(tx.amount);

		if (tx.type === "OVERAGE") {
			totalOverage += credits;
		} else {
			totalUsed += credits;
		}

		// Aggregate by tool
		if (tx.toolSlug) {
			const existing = toolUsageMap.get(tx.toolSlug) ?? {
				credits: 0,
				count: 0,
			};
			toolUsageMap.set(tx.toolSlug, {
				credits: existing.credits + credits,
				count: existing.count + 1,
			});
		}

		// Aggregate by day
		const dateKey = tx.createdAt.toISOString().split("T")[0] as string;
		const existingDay = dayUsageMap.get(dateKey) ?? 0;
		dayUsageMap.set(dateKey, existingDay + credits);
	}

	// Convert maps to arrays
	const byTool: ToolUsageAggregation[] = Array.from(
		toolUsageMap.entries(),
	).map(([toolSlug, data]) => ({
		toolSlug,
		credits: data.credits,
		count: data.count,
	}));

	const byDay: DailyUsageAggregation[] = Array.from(
		dayUsageMap.entries(),
	).map(([date, credits]) => ({
		date,
		credits,
	}));

	// Sort by credits descending for tools, by date descending for days
	byTool.sort((a, b) => b.credits - a.credits);
	byDay.sort((a, b) => b.date.localeCompare(a.date));

	return { totalUsed, totalOverage, byTool, byDay };
}

/**
 * Execute an atomic billing period reset
 */
export async function executeAtomicReset(params: {
	organizationId: string;
	periodStart: Date;
	periodEnd: Date;
}): Promise<CreditBalance> {
	const { organizationId, periodStart, periodEnd } = params;

	return db.$transaction(async (tx) => {
		// Get current balance
		const currentBalance = await tx.creditBalance.findUnique({
			where: { organizationId },
		});

		if (!currentBalance) {
			throw new Error(
				`Credit balance not found for organization: ${organizationId}`,
			);
		}

		// Reset usage counters but preserve included and purchasedCredits
		const updatedBalance = await tx.creditBalance.update({
			where: { id: currentBalance.id },
			data: {
				used: 0,
				overage: 0,
				periodStart,
				periodEnd,
			},
		});

		// Create adjustment transaction to record the reset
		await tx.creditTransaction.create({
			data: {
				balance: { connect: { id: currentBalance.id } },
				amount: 0, // No net change in credits, just reset
				type: "ADJUSTMENT",
				description: `Billing period reset: ${periodStart.toISOString()} - ${periodEnd.toISOString()}`,
			},
		});

		return updatedBalance;
	});
}
