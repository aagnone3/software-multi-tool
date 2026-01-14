import { logger } from "@repo/logs";
import type Stripe from "stripe";
import { getStripeClient } from "./index";

/**
 * Usage record response from Stripe API.
 * Note: In Stripe SDK v18+, the UsageRecord type is not exported,
 * but the API still exists. This interface matches the API response.
 */
export interface StripeUsageRecord {
	id: string;
	object: "usage_record";
	livemode: boolean;
	quantity: number;
	subscription_item: string;
	timestamp: number;
}

/**
 * Parameters for reporting overage to Stripe
 */
export interface ReportOverageParams {
	/** The Stripe subscription ID */
	subscriptionId: string;
	/** Number of overage credits to report */
	overageCredits: number;
	/** The end of the billing period */
	periodEnd: Date;
}

/**
 * Result of reporting overage to Stripe
 */
export interface ReportOverageResult {
	/** Whether the reporting was successful */
	success: boolean;
	/** The Stripe usage record if successful */
	usageRecord?: StripeUsageRecord;
	/** Error message if unsuccessful */
	error?: string;
	/** Whether the subscription has no overage item (not an error, just skip) */
	skipped?: boolean;
}

/**
 * Error thrown when the overage price ID is not configured
 */
export class OveragePriceNotConfiguredError extends Error {
	constructor() {
		super(
			"STRIPE_OVERAGE_PRICE_ID environment variable is not set. Cannot report overage to Stripe.",
		);
		this.name = "OveragePriceNotConfiguredError";
	}
}

/**
 * Error thrown when the subscription doesn't have an overage subscription item
 */
export class NoOverageSubscriptionItemError extends Error {
	constructor(subscriptionId: string) {
		super(
			`Subscription ${subscriptionId} does not have an overage subscription item`,
		);
		this.name = "NoOverageSubscriptionItemError";
	}
}

/**
 * Find the overage subscription item in a Stripe subscription.
 *
 * The overage item is identified by matching the price ID to the configured
 * STRIPE_OVERAGE_PRICE_ID environment variable.
 */
export function findOverageSubscriptionItem(
	subscription: Stripe.Subscription,
): Stripe.SubscriptionItem | undefined {
	const overagePriceId = process.env.STRIPE_OVERAGE_PRICE_ID;

	if (!overagePriceId) {
		return undefined;
	}

	return subscription.items.data.find(
		(item) => item.price.id === overagePriceId,
	);
}

/**
 * Report overage usage to Stripe for metered billing.
 *
 * This function reports the overage credits consumed during a billing period
 * to Stripe's usage-based billing system. Stripe will include this usage
 * on the next invoice.
 *
 * @param params - The parameters for reporting overage
 * @returns A result object indicating success or failure
 *
 * @example
 * ```ts
 * const result = await reportOverageToStripe({
 *   subscriptionId: 'sub_123',
 *   overageCredits: 50,
 *   periodEnd: new Date('2024-02-01'),
 * });
 *
 * if (result.success) {
 *   console.log('Reported usage:', result.usageRecord?.quantity);
 * }
 * ```
 */
export async function reportOverageToStripe(
	params: ReportOverageParams,
): Promise<ReportOverageResult> {
	const { subscriptionId, overageCredits, periodEnd } = params;

	// Validate overage price ID is configured
	const overagePriceId = process.env.STRIPE_OVERAGE_PRICE_ID;
	if (!overagePriceId) {
		logger.warn(
			"STRIPE_OVERAGE_PRICE_ID not configured, skipping overage reporting",
		);
		return {
			success: false,
			error: "STRIPE_OVERAGE_PRICE_ID not configured",
			skipped: true,
		};
	}

	// Skip if no overage to report
	if (overageCredits <= 0) {
		logger.debug("No overage credits to report", { subscriptionId });
		return {
			success: true,
			skipped: true,
		};
	}

	const stripe = getStripeClient();

	try {
		// Retrieve the subscription to find the overage item
		const subscription =
			await stripe.subscriptions.retrieve(subscriptionId);

		// Find the overage subscription item
		const overageItem = findOverageSubscriptionItem(subscription);

		if (!overageItem) {
			logger.warn("Subscription does not have overage item", {
				subscriptionId,
				overagePriceId,
				availableItems: subscription.items.data.map((item) => ({
					id: item.id,
					priceId: item.price.id,
				})),
			});
			return {
				success: false,
				error: `Subscription ${subscriptionId} does not have an overage subscription item`,
				skipped: true,
			};
		}

		// Report usage to Stripe via raw request
		// Note: In Stripe SDK v18+, the createUsageRecord method is no longer typed,
		// but the API endpoint still exists. We use rawRequest to call it.
		// Using 'set' action to set the total usage for the period
		// (not 'increment' which would add to existing usage)
		const response = await stripe.rawRequest(
			"POST",
			`/v1/subscription_items/${overageItem.id}/usage_records`,
			{
				quantity: overageCredits,
				timestamp: Math.floor(periodEnd.getTime() / 1000),
				action: "set",
			},
		);

		const usageRecord = response as unknown as StripeUsageRecord;

		logger.info("Successfully reported overage to Stripe", {
			subscriptionId,
			subscriptionItemId: overageItem.id,
			overageCredits,
			usageRecordId: usageRecord.id,
		});

		return {
			success: true,
			usageRecord,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";

		logger.error("Failed to report overage to Stripe", {
			subscriptionId,
			overageCredits,
			error: errorMessage,
		});

		return {
			success: false,
			error: errorMessage,
		};
	}
}
