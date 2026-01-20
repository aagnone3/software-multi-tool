"use client";

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

	const mutation = useMutation(orpc.credits.purchase.mutationOptions());

	const purchasePack = async (packId: PackId) => {
		setPurchasingPackId(packId);

		try {
			const result = await mutation.mutateAsync({
				packId,
				redirectUrl: window.location.href,
			});

			options?.onSuccess?.(result.checkoutUrl);

			// Redirect to Stripe checkout
			window.location.href = result.checkoutUrl;
		} catch (error) {
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
