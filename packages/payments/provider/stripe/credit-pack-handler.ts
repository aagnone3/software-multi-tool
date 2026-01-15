import { db } from "@repo/database";
import { logger } from "@repo/logs";

/**
 * Parameters for granting purchased credits
 */
export interface GrantPurchasedCreditsParams {
	organizationId: string;
	credits: number;
	packId: string;
	packName: string;
	stripeSessionId: string;
}

/**
 * Result of a credit pack purchase grant operation.
 */
export interface GrantPurchasedCreditsResult {
	/** Whether the purchase was processed (false if already processed) */
	processed: boolean;
	/** The transaction ID */
	transactionId: string;
}

/**
 * Check if a credit pack purchase has already been processed (for idempotency)
 */
async function findPurchaseTransaction(
	stripeSessionId: string,
): Promise<{ id: string } | null> {
	return db.creditTransaction.findFirst({
		where: {
			type: "PURCHASE",
			description: {
				contains: stripeSessionId,
			},
		},
		select: { id: true },
	});
}

/**
 * Execute an atomic credit pack purchase grant.
 * Adds credits to the organization's purchasedCredits balance.
 */
async function executeAtomicPurchaseGrant(
	params: GrantPurchasedCreditsParams,
): Promise<string> {
	const { organizationId, credits, packId, packName, stripeSessionId } =
		params;

	return db.$transaction(async (tx) => {
		// Upsert the credit balance (in case org doesn't have one yet)
		const now = new Date();
		const periodEnd = new Date(now);
		periodEnd.setMonth(periodEnd.getMonth() + 1);

		const balance = await tx.creditBalance.upsert({
			where: { organizationId },
			create: {
				organization: { connect: { id: organizationId } },
				included: 0,
				used: 0,
				overage: 0,
				purchasedCredits: credits,
				periodStart: now,
				periodEnd,
			},
			update: {
				purchasedCredits: { increment: credits },
			},
		});

		// Create transaction record for the purchase
		const transaction = await tx.creditTransaction.create({
			data: {
				balance: { connect: { id: balance.id } },
				amount: credits,
				type: "PURCHASE",
				description: `Credit pack purchase: ${packName} (${packId}) - ${credits} credits [session: ${stripeSessionId}]`,
			},
		});

		return transaction.id;
	});
}

/**
 * Grant credits from a credit pack purchase.
 *
 * This function is idempotent - if the same stripeSessionId is provided twice,
 * it will return the existing transaction instead of granting duplicate credits.
 *
 * @param params - The purchase parameters including organizationId, credits, packId, packName, and stripeSessionId
 * @returns Result indicating whether the purchase was processed and the transaction ID
 */
export async function grantPurchasedCredits(
	params: GrantPurchasedCreditsParams,
): Promise<GrantPurchasedCreditsResult> {
	const { stripeSessionId, organizationId, credits, packId } = params;

	// Check for idempotency - has this session already been processed?
	const existingTransaction = await findPurchaseTransaction(stripeSessionId);

	if (existingTransaction) {
		// Already processed, return existing transaction
		logger.info(
			`Credit pack purchase already processed for session ${stripeSessionId}, skipping duplicate grant`,
		);
		return {
			processed: false,
			transactionId: existingTransaction.id,
		};
	}

	// Process the purchase
	const transactionId = await executeAtomicPurchaseGrant(params);

	logger.info(
		`Granted ${credits} purchased credits to organization ${organizationId} from pack ${packId}`,
	);

	return {
		processed: true,
		transactionId,
	};
}
