import { getPlanCredits } from "@repo/config";
import {
	executeAtomicDeduction,
	executeAtomicGrant,
	executeAtomicRefund,
	executeAtomicReset,
	findCreditBalanceByOrgId,
	findTransactionById,
} from "./queries";
import {
	type CreditBalance,
	CreditBalanceNotFoundError,
	type CreditStatus,
	type CreditTransaction,
	type DeductCreditsParams,
	type GrantSubscriptionCreditsParams,
	type HasCreditsResult,
	InsufficientCreditsError,
	type RefundCreditsParams,
	type ResetBillingPeriodParams,
	TransactionNotFoundError,
} from "./types";

/**
 * Get or create a credit balance for an organization.
 *
 * If no balance exists, creates one with default values (no credits).
 * Use grantSubscriptionCredits to allocate credits after creation.
 */
export async function getOrCreateCreditBalance(
	organizationId: string,
): Promise<CreditBalance> {
	const existing = await findCreditBalanceByOrgId(organizationId);

	if (existing) {
		return existing;
	}

	// Create with minimal default values
	// Credits should be granted via grantSubscriptionCredits
	const now = new Date();
	const periodEnd = new Date(now);
	periodEnd.setMonth(periodEnd.getMonth() + 1);

	return executeAtomicGrant({
		organizationId,
		included: 0,
		periodStart: now,
		periodEnd,
	});
}

/**
 * Check if an organization has sufficient credits for an operation.
 *
 * Design Decision: This application does NOT allow overage.
 * When credits run out, users must purchase credit packs.
 *
 * @returns HasCreditsResult indicating if the operation is allowed
 */
export async function hasCredits(
	organizationId: string,
	amount: number,
): Promise<HasCreditsResult> {
	const balance = await findCreditBalanceByOrgId(organizationId);

	if (!balance) {
		return {
			allowed: false,
			balance: 0,
			isOverage: false,
		};
	}

	// Calculate available credits:
	// - Included credits from subscription (minus used)
	// - Plus any purchased credit packs
	const remainingIncluded = balance.included - balance.used;
	const totalAvailable = remainingIncluded + balance.purchasedCredits;

	// Check if we have enough credits
	const allowed = totalAvailable >= amount;

	// Determine if this would be an "overage" situation
	// (using purchased credits beyond subscription included)
	const isOverage = amount > remainingIncluded && remainingIncluded >= 0;

	return {
		allowed,
		balance: totalAvailable,
		isOverage,
	};
}

/**
 * Get the current credit status for an organization.
 *
 * @throws CreditBalanceNotFoundError if organization has no credit balance
 */
export async function getCreditStatus(
	organizationId: string,
): Promise<CreditStatus> {
	const balance = await findCreditBalanceByOrgId(organizationId);

	if (!balance) {
		throw new CreditBalanceNotFoundError(organizationId);
	}

	const remaining = Math.max(0, balance.included - balance.used);

	return {
		included: balance.included,
		used: balance.used,
		remaining,
		overage: balance.overage,
		purchasedCredits: balance.purchasedCredits,
		periodStart: balance.periodStart,
		periodEnd: balance.periodEnd,
	};
}

/**
 * Deduct credits atomically from an organization's balance.
 *
 * Design Decision: This application does NOT allow overage.
 * If insufficient credits, throws InsufficientCreditsError.
 *
 * @throws CreditBalanceNotFoundError if organization has no credit balance
 * @throws InsufficientCreditsError if not enough credits available
 */
export async function deductCredits(
	params: DeductCreditsParams,
): Promise<CreditTransaction> {
	const { organizationId, amount, toolSlug, jobId, description } = params;

	// First check if organization has credits
	const balance = await findCreditBalanceByOrgId(organizationId);

	if (!balance) {
		throw new CreditBalanceNotFoundError(organizationId);
	}

	// Calculate available credits
	const remainingIncluded = balance.included - balance.used;
	const totalAvailable = remainingIncluded + balance.purchasedCredits;

	// Check if sufficient credits
	if (totalAvailable < amount) {
		throw new InsufficientCreditsError(
			organizationId,
			amount,
			totalAvailable,
		);
	}

	// Determine if this goes into "overage" (using purchased credits)
	const isOverage = amount > remainingIncluded;

	return executeAtomicDeduction({
		balanceId: balance.id,
		organizationId,
		amount,
		isOverage,
		remaining: remainingIncluded,
		toolSlug,
		jobId,
		description,
	});
}

/**
 * Refund credits for a failed or cancelled job.
 *
 * @throws TransactionNotFoundError if original transaction not found
 */
export async function refundCredits(
	params: RefundCreditsParams,
): Promise<CreditTransaction> {
	const { transactionId, reason } = params;

	const originalTransaction = await findTransactionById(transactionId);

	if (!originalTransaction) {
		throw new TransactionNotFoundError(transactionId);
	}

	// Only refund consumption transactions (negative amounts)
	if (originalTransaction.amount >= 0) {
		throw new Error(
			`Cannot refund non-consumption transaction: ${transactionId}`,
		);
	}

	return executeAtomicRefund({
		originalTransaction,
		reason,
	});
}

/**
 * Grant subscription credits for a new subscription or renewal.
 *
 * This creates or updates the credit balance with the plan's included credits.
 */
export async function grantSubscriptionCredits(
	params: GrantSubscriptionCreditsParams,
): Promise<CreditBalance> {
	const { organizationId, planId, periodStart, periodEnd } = params;

	// Look up credits for the plan
	const planCredits = getPlanCredits(planId);

	if (!planCredits) {
		throw new Error(`Unknown plan: ${planId}`);
	}

	return executeAtomicGrant({
		organizationId,
		included: planCredits.included,
		periodStart,
		periodEnd,
	});
}

/**
 * Reset credits for a new billing period.
 *
 * This resets used and overage counters but preserves:
 * - included credits (set by subscription)
 * - purchasedCredits (credit packs carry over)
 *
 * @throws CreditBalanceNotFoundError if organization has no credit balance
 */
export async function resetBillingPeriod(
	params: ResetBillingPeriodParams,
): Promise<CreditBalance> {
	const { organizationId, periodStart, periodEnd } = params;

	// Verify balance exists
	const balance = await findCreditBalanceByOrgId(organizationId);

	if (!balance) {
		throw new CreditBalanceNotFoundError(organizationId);
	}

	return executeAtomicReset({
		organizationId,
		periodStart,
		periodEnd,
	});
}
