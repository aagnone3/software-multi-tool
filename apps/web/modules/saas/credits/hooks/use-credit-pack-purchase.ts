"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { getCreditPacks } from "@repo/config";
import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

export type PackId = "boost" | "bundle" | "vault";

interface UseCreditPackPurchaseOptions {
	onSuccess?: (checkoutUrl: string) => void;
	onError?: (error: Error) => void;
}

export function useCreditPackPurchase(options?: UseCreditPackPurchaseOptions) {
	const [purchasingPackId, setPurchasingPackId] = useState<PackId | null>(
		null,
	);
	const { track } = useProductAnalytics();
	const { isFreePlan, isStarterPlan } = useCreditsBalance();
	const planId = isFreePlan ? "free" : isStarterPlan ? "starter" : "pro";

	const mutation = useMutation(orpc.credits.purchase.mutationOptions());

	const purchasePack = async (packId: PackId) => {
		setPurchasingPackId(packId);

		const allPacks = getCreditPacks();
		const pack = allPacks.find((p) => p.id === packId);

		try {
			const result = await mutation.mutateAsync({
				packId,
				redirectUrl: window.location.href,
			});

			if (pack) {
				track({
					name: "credit_pack_purchase_started",
					props: {
						pack_id: packId,
						pack_name: pack.name,
						credits: pack.credits,
						amount: pack.amount,
						currency: pack.currency,
						plan_id: planId,
					},
				});
			}

			options?.onSuccess?.(result.checkoutUrl);

			// Redirect to Stripe checkout
			window.location.href = result.checkoutUrl;
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Failed to create checkout";

			if (pack) {
				track({
					name: "credit_pack_purchase_failed",
					props: {
						pack_id: packId,
						error_message: errorMessage,
						plan_id: planId ?? "unknown",
					},
				});
			}

			options?.onError?.(
				error instanceof Error
					? error
					: new Error("Failed to create checkout"),
			);
		} finally {
			setPurchasingPackId(null);
		}
	};

	return {
		purchasePack,
		isPurchasing: mutation.isPending,
		purchasingPackId,
		error: mutation.error,
	};
}
