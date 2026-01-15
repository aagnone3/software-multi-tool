"use client";

import type { CreditPack } from "@repo/config";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import { CoinsIcon, SparklesIcon, ZapIcon } from "lucide-react";
import * as React from "react";

interface CreditPackCardProps {
	pack: CreditPack;
	onPurchase: (packId: string) => void;
	isPurchasing: boolean;
	isRecommended?: boolean;
	className?: string;
}

const PACK_ICONS = {
	boost: ZapIcon,
	bundle: CoinsIcon,
	vault: SparklesIcon,
} as const;

function formatCurrency(amount: number, currency: string): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
	}).format(amount);
}

function formatPricePerCredit(amount: number, credits: number): string {
	const perCredit = amount / credits;
	return `$${perCredit.toFixed(perCredit < 0.1 ? 3 : 2)}/credit`;
}

export function CreditPackCard({
	pack,
	onPurchase,
	isPurchasing,
	isRecommended = false,
	className,
}: CreditPackCardProps) {
	const Icon = PACK_ICONS[pack.id as keyof typeof PACK_ICONS] ?? CoinsIcon;

	return (
		<div
			className={cn(
				"relative rounded-2xl border p-5 transition-colors",
				isRecommended
					? "border-2 border-primary bg-primary/5"
					: "hover:border-foreground/20",
				className,
			)}
			data-testid={`credit-pack-${pack.id}`}
		>
			{isRecommended && (
				<div className="absolute -top-3 left-1/2 -translate-x-1/2">
					<span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
						Best Value
					</span>
				</div>
			)}

			<div className="flex flex-col items-center text-center">
				<div
					className={cn(
						"mb-3 flex h-12 w-12 items-center justify-center rounded-full",
						isRecommended ? "bg-primary/10" : "bg-muted",
					)}
				>
					<Icon
						className={cn(
							"size-6",
							isRecommended
								? "text-primary"
								: "text-muted-foreground",
						)}
					/>
				</div>

				<h4 className="font-semibold text-lg">{pack.name}</h4>

				<div className="mt-2 space-y-1">
					<p className="text-3xl font-bold">
						{pack.credits.toLocaleString()}
					</p>
					<p className="text-sm text-muted-foreground">credits</p>
				</div>

				<div className="mt-3 space-y-0.5">
					<p className="text-xl font-semibold">
						{formatCurrency(pack.amount, pack.currency)}
					</p>
					<p className="text-xs text-muted-foreground">
						{formatPricePerCredit(pack.amount, pack.credits)}
					</p>
				</div>

				<Button
					className="mt-4 w-full"
					variant={isRecommended ? "primary" : "secondary"}
					onClick={() => onPurchase(pack.id)}
					loading={isPurchasing}
					data-testid={`purchase-${pack.id}`}
				>
					Buy Now
				</Button>
			</div>
		</div>
	);
}
