import { type Config, config } from "@repo/config";
import type { zodSchemas } from "@repo/database";
import type { z } from "zod";

const plans = config.payments.plans as Config["payments"]["plans"];

type PlanId = keyof typeof config.payments.plans;
type PurchaseWithoutTimestamps = Omit<
	z.infer<typeof zodSchemas.PurchaseSchema>,
	"createdAt" | "updatedAt"
>;

function getActivePlanFromPurchases(purchases?: PurchaseWithoutTimestamps[]) {
	const subscriptionPurchase = purchases?.find(
		(purchase) => purchase.type === "SUBSCRIPTION",
	);

	if (subscriptionPurchase) {
		const plan = Object.entries(plans).find(([_, plan]) =>
			plan.prices?.some(
				(price) => price.productId === subscriptionPurchase.productId,
			),
		);

		return {
			id: plan?.[0] as PlanId,
			price: plan?.[1].prices?.find(
				(price) => price.productId === subscriptionPurchase.productId,
			),
			status: subscriptionPurchase.status,
			purchaseId: subscriptionPurchase.id,
		};
	}

	const oneTimePurchase = purchases?.find(
		(purchase) => purchase.type === "ONE_TIME",
	);

	if (oneTimePurchase) {
		const plan = Object.entries(plans).find(([_, plan]) =>
			plan.prices?.some(
				(price) => price.productId === oneTimePurchase.productId,
			),
		);

		return {
			id: plan?.[0] as PlanId,
			price: plan?.[1].prices?.find(
				(price) => price.productId === oneTimePurchase.productId,
			),
			status: "active",
			purchaseId: oneTimePurchase.id,
		};
	}

	const freePlan = Object.entries(plans).find(([_, plan]) => plan.isFree);

	return freePlan
		? {
				id: freePlan[0] as PlanId,
				status: "active",
			}
		: null;
}

/**
 * Get the plan ID for a given Stripe price ID.
 * Searches through all plans to find which one contains the given price ID.
 *
 * @param priceId - The Stripe price ID (e.g., 'price_xxx')
 * @returns The plan ID (e.g., 'pro', 'lifetime') or undefined if not found
 */
export function getPlanIdFromPriceId(priceId: string): string | undefined {
	// Early return for empty or invalid price IDs
	if (!priceId) {
		return undefined;
	}

	for (const [planId, plan] of Object.entries(plans)) {
		if (plan.prices) {
			const hasPrice = plan.prices.some(
				(price) => price.productId && price.productId === priceId,
			);
			if (hasPrice) {
				return planId;
			}
		}
	}

	return undefined;
}

export function createPurchasesHelper(purchases: PurchaseWithoutTimestamps[]) {
	const activePlan = getActivePlanFromPurchases(purchases);

	const hasSubscription = (planIds?: PlanId[] | PlanId) => {
		return (
			!!activePlan &&
			(Array.isArray(planIds)
				? planIds.includes(activePlan.id)
				: planIds === activePlan.id)
		);
	};

	const hasPurchase = (planId: PlanId) => {
		return !!purchases?.some((purchase) =>
			Object.entries(plans)
				.find(([id]) => id === planId)?.[1]
				.prices?.some(
					(price) => price.productId === purchase.productId,
				),
		);
	};

	return { activePlan, hasSubscription, hasPurchase };
}
