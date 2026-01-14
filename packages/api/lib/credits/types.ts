import type { CreditBalance, CreditTransaction } from "@repo/database";

/**
 * Result of checking if an organization has sufficient credits
 */
export interface HasCreditsResult {
	/** Whether the operation is allowed (has credits or overage allowed) */
	allowed: boolean;
	/** Current available balance (included - used + purchasedCredits) */
	balance: number;
	/** Whether using these credits would result in overage */
	isOverage: boolean;
}

/**
 * Current credit status for an organization
 */
export interface CreditStatus {
	/** Total credits included from subscription */
	included: number;
	/** Credits used in current period */
	used: number;
	/** Remaining included credits (included - used) */
	remaining: number;
	/** Overage credits used beyond included amount */
	overage: number;
	/** Additional credits from purchased credit packs */
	purchasedCredits: number;
	/** Billing period start date */
	periodStart: Date;
	/** Billing period end date */
	periodEnd: Date;
}

/**
 * Parameters for deducting credits
 */
export interface DeductCreditsParams {
	/** Organization ID to deduct credits from */
	organizationId: string;
	/** Number of credits to deduct */
	amount: number;
	/** Tool slug that consumed the credits */
	toolSlug: string;
	/** Optional job ID for traceability */
	jobId?: string;
	/** Optional description of the usage */
	description?: string;
}

/**
 * Parameters for refunding credits
 */
export interface RefundCreditsParams {
	/** Transaction ID to refund */
	transactionId: string;
	/** Optional reason for the refund */
	reason?: string;
}

/**
 * Parameters for granting subscription credits
 */
export interface GrantSubscriptionCreditsParams {
	/** Organization ID to grant credits to */
	organizationId: string;
	/** Plan ID for looking up credit allocation */
	planId: string;
	/** Start of the billing period */
	periodStart: Date;
	/** End of the billing period */
	periodEnd: Date;
}

/**
 * Parameters for resetting billing period
 */
export interface ResetBillingPeriodParams {
	/** Organization ID to reset */
	organizationId: string;
	/** New billing period start date */
	periodStart: Date;
	/** New billing period end date */
	periodEnd: Date;
}

/**
 * Error thrown when an organization has insufficient credits
 */
export class InsufficientCreditsError extends Error {
	constructor(
		public readonly organizationId: string,
		public readonly required: number,
		public readonly available: number,
	) {
		super(
			`Insufficient credits: required ${required}, available ${available}`,
		);
		this.name = "InsufficientCreditsError";
	}
}

/**
 * Error thrown when a credit balance is not found
 */
export class CreditBalanceNotFoundError extends Error {
	constructor(public readonly organizationId: string) {
		super(`Credit balance not found for organization: ${organizationId}`);
		this.name = "CreditBalanceNotFoundError";
	}
}

/**
 * Error thrown when a transaction is not found
 */
export class TransactionNotFoundError extends Error {
	constructor(public readonly transactionId: string) {
		super(`Transaction not found: ${transactionId}`);
		this.name = "TransactionNotFoundError";
	}
}

// Re-export Prisma types for convenience
export type { CreditBalance, CreditTransaction };
