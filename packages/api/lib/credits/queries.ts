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
