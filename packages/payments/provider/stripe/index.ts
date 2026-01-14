import { getPlanCredits } from "@repo/config";
import {
	adjustCreditsForPlanChange,
	createPurchase,
	deletePurchaseBySubscriptionId,
	getOrganizationByPaymentsCustomerId,
	getPurchaseBySubscriptionId,
	grantCredits,
	resetCreditsForNewPeriod,
	updatePurchase,
} from "@repo/database";
import { logger } from "@repo/logs";
import Stripe from "stripe";
import { setCustomerIdToEntity } from "../../src/lib/customer";
import { getPlanIdFromPriceId } from "../../src/lib/helper";
import type {
	CancelSubscription,
	CreateCheckoutLink,
	CreateCustomerPortalLink,
	SetSubscriptionSeats,
	WebhookHandler,
} from "../../types";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
	if (stripeClient) {
		return stripeClient;
	}

	const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string;

	if (!stripeSecretKey) {
		throw new Error("Missing env variable STRIPE_SECRET_KEY");
	}

	stripeClient = new Stripe(stripeSecretKey);

	return stripeClient;
}

export const createCheckoutLink: CreateCheckoutLink = async (options) => {
	const stripeClient = getStripeClient();
	const {
		type,
		productId,
		redirectUrl,
		customerId,
		organizationId,
		userId,
		trialPeriodDays,
		seats,
		email,
	} = options;

	const metadata = {
		organization_id: organizationId || null,
		user_id: userId || null,
	};

	const response = await stripeClient.checkout.sessions.create({
		mode: type === "subscription" ? "subscription" : "payment",
		success_url: redirectUrl ?? "",
		line_items: [
			{
				quantity: seats ?? 1,
				price: productId,
			},
		],
		...(customerId ? { customer: customerId } : { customer_email: email }),
		...(type === "one-time"
			? {
					payment_intent_data: {
						metadata,
					},
					customer_creation: "always",
				}
			: {
					subscription_data: {
						metadata,
						trial_period_days: trialPeriodDays,
					},
				}),
		metadata,
	});

	return response.url;
};

export const createCustomerPortalLink: CreateCustomerPortalLink = async ({
	customerId,
	redirectUrl,
}) => {
	const stripeClient = getStripeClient();

	const response = await stripeClient.billingPortal.sessions.create({
		customer: customerId,
		return_url: redirectUrl ?? "",
	});

	return response.url;
};

export const setSubscriptionSeats: SetSubscriptionSeats = async ({
	id,
	seats,
}) => {
	const stripeClient = getStripeClient();

	const subscription = await stripeClient.subscriptions.retrieve(id);

	if (!subscription) {
		throw new Error("Subscription not found.");
	}

	await stripeClient.subscriptions.update(id, {
		items: [
			{
				id: subscription.items.data[0].id,
				quantity: seats,
			},
		],
	});
};

export const cancelSubscription: CancelSubscription = async (id) => {
	const stripeClient = getStripeClient();

	await stripeClient.subscriptions.cancel(id);
};

/**
 * Helper to get organization ID from Stripe customer ID.
 * Returns null if organization not found.
 */
async function getOrganizationIdFromCustomer(
	customerId: string,
): Promise<string | null> {
	const organization = await getOrganizationByPaymentsCustomerId(customerId);
	return organization?.id ?? null;
}

/**
 * Handle subscription created event.
 * Creates purchase record and grants initial credits.
 */
async function handleSubscriptionCreated(
	subscription: Stripe.Subscription,
): Promise<void> {
	const { metadata, customer, items, id } = subscription;
	const productId = items?.data[0].price?.id;

	if (!productId) {
		throw new Error("Missing product ID in subscription");
	}

	// Create purchase record
	await createPurchase({
		subscriptionId: id,
		organizationId: metadata?.organization_id || null,
		userId: metadata?.user_id || null,
		customerId: customer as string,
		type: "SUBSCRIPTION",
		productId,
		status: subscription.status,
	});

	// Set customer ID on entity
	await setCustomerIdToEntity(customer as string, {
		organizationId: metadata?.organization_id,
		userId: metadata?.user_id,
	});

	// Grant credits if organization exists
	const organizationId = metadata?.organization_id;
	if (organizationId) {
		const planId = getPlanIdFromPriceId(productId);
		if (planId) {
			const planCredits = getPlanCredits(planId);
			if (planCredits) {
				// Get period dates from subscription item
				const subscriptionItem = subscription.items.data[0];
				await grantCredits({
					organizationId,
					included: planCredits.included,
					periodStart: new Date(
						subscriptionItem.current_period_start * 1000,
					),
					periodEnd: new Date(
						subscriptionItem.current_period_end * 1000,
					),
				});
				logger.info(
					`Granted ${planCredits.included} credits to organization ${organizationId} for plan ${planId}`,
				);
			}
		}
	}
}

/**
 * Handle invoice paid event for subscription renewals.
 * Resets credits for the new billing period.
 */
async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
	// Only handle subscription cycle invoices (renewals)
	if (invoice.billing_reason !== "subscription_cycle") {
		return;
	}

	// Get subscription ID from parent (newer Stripe API structure)
	const subscriptionDetails = invoice.parent?.subscription_details;
	if (!subscriptionDetails) {
		return;
	}

	const subscriptionId = subscriptionDetails.subscription;
	if (!subscriptionId || typeof subscriptionId !== "string") {
		return;
	}

	const customerId = invoice.customer;
	if (!customerId || typeof customerId !== "string") {
		return;
	}

	// Get organization from customer
	const organizationId = await getOrganizationIdFromCustomer(customerId);
	if (!organizationId) {
		logger.warn(
			`No organization found for customer ${customerId} during invoice.paid`,
		);
		return;
	}

	// Get subscription details for period dates
	const stripeClient = getStripeClient();
	const subscription =
		await stripeClient.subscriptions.retrieve(subscriptionId);

	// Get period dates from subscription item
	const subscriptionItem = subscription.items.data[0];

	// Reset credits for new period
	await resetCreditsForNewPeriod({
		organizationId,
		periodStart: new Date(subscriptionItem.current_period_start * 1000),
		periodEnd: new Date(subscriptionItem.current_period_end * 1000),
	});

	logger.info(
		`Reset credits for organization ${organizationId} for new billing period`,
	);
}

/**
 * Handle subscription updated event.
 * Handles plan upgrades and downgrades.
 */
async function handleSubscriptionUpdated(
	subscription: Stripe.Subscription,
	previousAttributes: Partial<Stripe.Subscription> | undefined,
): Promise<void> {
	const subscriptionId = subscription.id;

	// Update purchase record
	const existingPurchase = await getPurchaseBySubscriptionId(subscriptionId);
	if (existingPurchase) {
		await updatePurchase({
			id: existingPurchase.id,
			status: subscription.status,
			productId: subscription.items?.data[0].price?.id,
		});
	}

	// Check for plan changes
	const currentPriceId = subscription.items?.data[0].price?.id;
	const previousPriceId = (
		previousAttributes?.items?.data as
			| { price?: { id?: string } }[]
			| undefined
	)?.[0]?.price?.id;

	// If price changed, this is a plan change (upgrade or downgrade)
	if (
		currentPriceId &&
		previousPriceId &&
		currentPriceId !== previousPriceId
	) {
		const customerId = subscription.customer;
		if (typeof customerId !== "string") {
			return;
		}

		const organizationId = await getOrganizationIdFromCustomer(customerId);
		if (!organizationId) {
			return;
		}

		const newPlanId = getPlanIdFromPriceId(currentPriceId);
		const oldPlanId = getPlanIdFromPriceId(previousPriceId);

		if (newPlanId && oldPlanId && newPlanId !== oldPlanId) {
			const newPlanCredits = getPlanCredits(newPlanId);
			const oldPlanCredits = getPlanCredits(oldPlanId);

			if (newPlanCredits && oldPlanCredits) {
				// Check if this is an upgrade (more credits)
				if (newPlanCredits.included > oldPlanCredits.included) {
					// Upgrade: immediately adjust credits
					await adjustCreditsForPlanChange({
						organizationId,
						newIncluded: newPlanCredits.included,
						description: `Plan upgrade from ${oldPlanId} to ${newPlanId}: +${newPlanCredits.included - oldPlanCredits.included} credits`,
					});
					logger.info(
						`Adjusted credits for organization ${organizationId} on upgrade from ${oldPlanId} to ${newPlanId}`,
					);
				} else {
					// Downgrade: credits will be reduced at next billing period
					// We don't immediately reduce credits - user already paid for current period
					logger.info(
						`Plan downgrade detected for organization ${organizationId} from ${oldPlanId} to ${newPlanId}. Credits will be adjusted at next renewal.`,
					);
				}
			}
		}
	}
}

/**
 * Handle subscription deleted event.
 * Deletes purchase record but credits remain until period end.
 */
async function handleSubscriptionDeleted(
	subscription: Stripe.Subscription,
): Promise<void> {
	// Delete the purchase record
	await deletePurchaseBySubscriptionId(subscription.id);

	// Note: We don't delete credits immediately.
	// The user has already paid for the current period, so credits remain valid
	// until periodEnd. No new credits will be granted after this.
	logger.info(
		`Subscription ${subscription.id} deleted. Credits remain until period end.`,
	);
}

export const webhookHandler: WebhookHandler = async (req) => {
	const stripeClient = getStripeClient();

	if (!req.body) {
		return new Response("Invalid request.", {
			status: 400,
		});
	}

	let event: Stripe.Event | undefined;

	try {
		event = await stripeClient.webhooks.constructEventAsync(
			await req.text(),
			req.headers.get("stripe-signature") as string,
			process.env.STRIPE_WEBHOOK_SECRET as string,
		);
	} catch (e) {
		logger.error(e);

		return new Response("Invalid request.", {
			status: 400,
		});
	}

	try {
		switch (event.type) {
			case "checkout.session.completed": {
				const { mode, metadata, customer, id } = event.data.object;

				// Subscription checkouts are handled by subscription.created
				if (mode === "subscription") {
					break;
				}

				// Handle one-time payments
				const checkoutSession =
					await stripeClient.checkout.sessions.retrieve(id, {
						expand: ["line_items"],
					});

				const productId = checkoutSession.line_items?.data[0].price?.id;

				if (!productId) {
					return new Response("Missing product ID.", {
						status: 400,
					});
				}

				await createPurchase({
					organizationId: metadata?.organization_id || null,
					userId: metadata?.user_id || null,
					customerId: customer as string,
					type: "ONE_TIME",
					productId,
				});

				await setCustomerIdToEntity(customer as string, {
					organizationId: metadata?.organization_id,
					userId: metadata?.user_id,
				});

				break;
			}

			case "customer.subscription.created": {
				await handleSubscriptionCreated(
					event.data.object as Stripe.Subscription,
				);
				break;
			}

			case "invoice.paid": {
				await handleInvoicePaid(event.data.object as Stripe.Invoice);
				break;
			}

			case "customer.subscription.updated": {
				await handleSubscriptionUpdated(
					event.data.object as Stripe.Subscription,
					event.data.previous_attributes as
						| Partial<Stripe.Subscription>
						| undefined,
				);
				break;
			}

			case "customer.subscription.deleted": {
				await handleSubscriptionDeleted(
					event.data.object as Stripe.Subscription,
				);
				break;
			}

			default:
				return new Response("Unhandled event type.", {
					status: 200,
				});
		}

		return new Response(null, { status: 204 });
	} catch (error) {
		logger.error("Webhook error:", error);
		return new Response(
			`Webhook error: ${error instanceof Error ? error.message : ""}`,
			{
				status: 400,
			},
		);
	}
};
