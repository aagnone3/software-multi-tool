import { ORPCError } from "@orpc/server";
import { getCreditPackById } from "@repo/config";
import { getOrganizationById } from "@repo/database";
import { logger } from "@repo/logs";
import { createCheckoutLink, getCustomerIdFromEntity } from "@repo/payments";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

const purchaseCheckoutInputSchema = z.object({
	packId: z.enum(["boost", "bundle", "vault"], {
		message: "Invalid pack ID. Must be one of: boost, bundle, vault",
	}),
	redirectUrl: z.string().url().optional(),
});

const purchaseCheckoutOutputSchema = z.object({
	checkoutUrl: z.string().url(),
	pack: z.object({
		id: z.string(),
		name: z.string(),
		credits: z.number(),
		amount: z.number(),
		currency: z.string(),
	}),
});

export const createPurchaseCheckout = protectedProcedure
	.route({
		method: "POST",
		path: "/credits/purchase",
		tags: ["Credits"],
		summary: "Create credit pack purchase checkout",
		description:
			"Creates a Stripe checkout session for purchasing a credit pack",
	})
	.input(purchaseCheckoutInputSchema)
	.output(purchaseCheckoutOutputSchema)
	.handler(async ({ input: { packId, redirectUrl }, context }) => {
		const organizationId = context.session.activeOrganizationId;

		if (!organizationId) {
			throw new ORPCError("BAD_REQUEST", {
				message: "No active organization",
			});
		}

		// Get the credit pack configuration
		const creditPack = getCreditPackById(packId);

		if (!creditPack) {
			// This shouldn't happen due to zod validation, but handle it anyway
			throw new ORPCError("NOT_FOUND", {
				message: `Credit pack '${packId}' not found`,
			});
		}

		if (!creditPack.priceId) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: `Credit pack '${packId}' is not configured with a Stripe price ID`,
			});
		}

		// Get organization to verify it exists
		const organization = await getOrganizationById(organizationId);

		if (!organization) {
			throw new ORPCError("NOT_FOUND", {
				message: "Organization not found",
			});
		}

		// Get existing customer ID if available
		const customerId = await getCustomerIdFromEntity({ organizationId });

		try {
			// Create the checkout session
			const checkoutUrl = await createCheckoutLink({
				type: "one-time",
				productId: creditPack.priceId,
				email: context.user.email,
				name: context.user.name ?? "",
				redirectUrl,
				organizationId,
				customerId: customerId ?? undefined,
			});

			if (!checkoutUrl) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to create checkout session",
				});
			}

			logger.info(
				`Created credit pack checkout for organization ${organizationId}: pack ${packId} (${creditPack.credits} credits)`,
			);

			return {
				checkoutUrl,
				pack: {
					id: creditPack.id,
					name: creditPack.name,
					credits: creditPack.credits,
					amount: creditPack.amount,
					currency: creditPack.currency,
				},
			};
		} catch (error) {
			logger.error("Failed to create credit pack checkout:", error);
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Failed to create checkout session",
			});
		}
	});
