import { ORPCError } from "@orpc/server";
import { config } from "@repo/config";
import {
	getCreditPurchasesByOrganizationId,
	getPurchasesByOrganizationId,
} from "@repo/database";
import { createPurchasesHelper } from "@repo/payments";
import {
	getCreditStatus,
	getOrCreateCreditBalance,
} from "../../../lib/credits";
import { protectedProcedure } from "../../../orpc/procedures";
import { balanceResponseSchema } from "../schemas";

export const getBalance = protectedProcedure
	.route({
		method: "GET",
		path: "/credits/balance",
		tags: ["Credits"],
		summary: "Get credit balance",
		description:
			"Get the current credit balance and status for the active organization",
	})
	.output(balanceResponseSchema)
	.handler(async ({ context }) => {
		const organizationId = context.session.activeOrganizationId;

		if (!organizationId) {
			throw new ORPCError("BAD_REQUEST", {
				message: "No active organization",
			});
		}

		// Ensure credit balance exists (creates with defaults if not)
		await getOrCreateCreditBalance(organizationId);

		// Get current credit status
		const status = await getCreditStatus(organizationId);

		// Get organization purchases to determine active plan
		const purchases = await getPurchasesByOrganizationId(organizationId);
		const { activePlan } = createPurchasesHelper(purchases);

		// Get credit pack purchases
		const creditPurchases =
			await getCreditPurchasesByOrganizationId(organizationId);

		const planId = activePlan?.id ?? "free";
		const planConfig =
			config.payments.plans[planId as keyof typeof config.payments.plans];
		const planName = planConfig
			? planId.charAt(0).toUpperCase() + planId.slice(1)
			: "Free";

		// Calculate total available credits
		const totalAvailable = status.remaining + status.purchasedCredits;

		return {
			included: status.included,
			used: status.used,
			remaining: status.remaining,
			overage: status.overage,
			purchasedCredits: status.purchasedCredits,
			totalAvailable,
			periodStart: status.periodStart.toISOString(),
			periodEnd: status.periodEnd.toISOString(),
			plan: {
				id: planId,
				name: planName,
			},
			purchases: creditPurchases.map((p) => ({
				id: p.id,
				amount: p.amount,
				description: p.description,
				createdAt: p.createdAt.toISOString(),
			})),
		};
	});
