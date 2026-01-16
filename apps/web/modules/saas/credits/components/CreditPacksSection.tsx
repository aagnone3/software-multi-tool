"use client";

import { getCreditPacks } from "@repo/config";
import { SettingsItem } from "@saas/shared/components/SettingsItem";
import { cn } from "@ui/lib";
import { toast } from "sonner";
import {
	type PackId,
	useCreditPackPurchase,
} from "../hooks/use-credit-pack-purchase";
import { CreditPackCard } from "./CreditPackCard";

interface CreditPacksSectionProps {
	className?: string;
}

export function CreditPacksSection({ className }: CreditPacksSectionProps) {
	const creditPacks = getCreditPacks();
	const { purchasePack, isPurchasing, purchasingPackId } =
		useCreditPackPurchase({
			onError: (error) => {
				toast.error(error.message || "Failed to create checkout");
			},
		});

	if (!creditPacks.length) {
		return null;
	}

	return (
		<SettingsItem
			title="Buy credits"
			description="Purchase additional credits that never expire. Use them after your included credits run out."
		>
			<div
				className={cn(
					"grid gap-4",
					creditPacks.length >= 3
						? "grid-cols-1 sm:grid-cols-3"
						: "grid-cols-1 sm:grid-cols-2",
					className,
				)}
				data-testid="credit-packs-grid"
			>
				{creditPacks.map((pack) => (
					<CreditPackCard
						key={pack.id}
						pack={pack}
						onPurchase={(id) => purchasePack(id as PackId)}
						isPurchasing={
							isPurchasing && purchasingPackId === pack.id
						}
						isRecommended={pack.id === "bundle"}
					/>
				))}
			</div>
		</SettingsItem>
	);
}
