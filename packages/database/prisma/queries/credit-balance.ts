import { type CreditTransactionType, db } from "../client";

/**
 * Get purchase transactions for an organization
 */
export async function getCreditPurchasesByOrganizationId(
	organizationId: string,
) {
	const balance = await db.creditBalance.findUnique({
		where: { organizationId },
		select: { id: true },
	});

	if (!balance) {
		return [];
	}

	return db.creditTransaction.findMany({
		where: {
			balanceId: balance.id,
			type: "PURCHASE",
		},
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			amount: true,
			description: true,
			createdAt: true,
		},
	});
}

/**
 * Find a credit balance by organization ID
 */
export async function getCreditBalanceByOrganizationId(organizationId: string) {
	return db.creditBalance.findUnique({
		where: { organizationId },
	});
}

/**
 * Grant subscription credits for a new subscription.
 * Creates or updates the credit balance with the plan's included credits.
 */
export async function grantCredits(params: {
	organizationId: string;
	included: number;
	periodStart: Date;
	periodEnd: Date;
}) {
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
				type: "GRANT" as CreditTransactionType,
				description: `Subscription credits granted for period ${periodStart.toISOString()} - ${periodEnd.toISOString()}`,
			},
		});

		return balance;
	});
}

/**
 * Reset credits for a new billing period.
 * Resets used and overage counters but preserves included credits and purchased credits.
 */
export async function resetCreditsForNewPeriod(params: {
	organizationId: string;
	periodStart: Date;
	periodEnd: Date;
}) {
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
				type: "ADJUSTMENT" as CreditTransactionType,
				description: `Billing period reset: ${periodStart.toISOString()} - ${periodEnd.toISOString()}`,
			},
		});

		return updatedBalance;
	});
}

/**
 * Adjust credits when upgrading plans.
 * Adds the difference between new plan credits and current plan credits.
 */
export async function adjustCreditsForPlanChange(params: {
	organizationId: string;
	newIncluded: number;
	description: string;
}) {
	const { organizationId, newIncluded, description } = params;

	return db.$transaction(async (tx) => {
		const currentBalance = await tx.creditBalance.findUnique({
			where: { organizationId },
		});

		if (!currentBalance) {
			throw new Error(
				`Credit balance not found for organization: ${organizationId}`,
			);
		}

		const creditDifference = newIncluded - currentBalance.included;

		// Update the included credits
		const updatedBalance = await tx.creditBalance.update({
			where: { id: currentBalance.id },
			data: {
				included: newIncluded,
			},
		});

		// Create adjustment transaction
		await tx.creditTransaction.create({
			data: {
				balance: { connect: { id: currentBalance.id } },
				amount: creditDifference,
				type: "ADJUSTMENT" as CreditTransactionType,
				description,
			},
		});

		return updatedBalance;
	});
}
