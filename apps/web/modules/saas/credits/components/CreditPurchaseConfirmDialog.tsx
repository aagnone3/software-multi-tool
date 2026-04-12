"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import type { CreditPack } from "@repo/config";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { CoinsIcon, ShoppingCartIcon } from "lucide-react";
import React, { useEffect } from "react";

interface CreditPurchaseConfirmDialogProps {
	pack: CreditPack | null;
	open: boolean;
	onConfirm: () => void;
	onCancel: () => void;
	isPurchasing?: boolean;
}

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

export function CreditPurchaseConfirmDialog({
	pack,
	open,
	onConfirm,
	onCancel,
	isPurchasing = false,
}: CreditPurchaseConfirmDialogProps) {
	const { track } = useProductAnalytics();

	useEffect(() => {
		if (open && pack) {
			track({
				name: "credit_pack_purchase_dialog_shown",
				props: { pack_id: pack.id, pack_name: pack.name },
			});
		}
	}, [open, pack, track]);

	const handleCancel = () => {
		if (pack) {
			track({
				name: "credit_pack_purchase_dialog_cancelled",
				props: { pack_id: pack.id, pack_name: pack.name },
			});
		}
		onCancel();
	};

	if (!pack) { return null; }

	return (
		<Dialog open={open} onOpenChange={(v) => !v && handleCancel()}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<div className="flex justify-center mb-3">
						<div className="rounded-full bg-primary/10 p-4">
							<ShoppingCartIcon className="size-7 text-primary" />
						</div>
					</div>
					<DialogTitle className="text-center">
						Confirm Purchase
					</DialogTitle>
					<DialogDescription className="text-center">
						You&apos;re about to purchase the{" "}
						<strong>{pack.name}</strong> credit pack.
					</DialogDescription>
				</DialogHeader>

				<div className="rounded-xl border bg-muted/30 p-4 space-y-3">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
							<CoinsIcon className="size-5 text-primary" />
						</div>
						<div>
							<p className="font-semibold">{pack.name}</p>
							<p className="text-sm text-muted-foreground">
								{pack.credits.toLocaleString()} credits
							</p>
						</div>
					</div>

					<div className="border-t pt-3 space-y-1.5">
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">
								Credits
							</span>
							<span className="font-medium">
								{pack.credits.toLocaleString()}
							</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">
								Price per credit
							</span>
							<span className="font-medium">
								{formatPricePerCredit(
									pack.amount,
									pack.credits,
								)}
							</span>
						</div>
						<div className="flex justify-between text-sm font-semibold border-t pt-1.5 mt-1.5">
							<span>Total</span>
							<span>
								{formatCurrency(pack.amount, pack.currency)}
							</span>
						</div>
					</div>
				</div>

				<p className="text-xs text-muted-foreground text-center">
					You&apos;ll be redirected to checkout to complete your
					purchase securely.
				</p>

				<DialogFooter className="flex gap-2 sm:flex-row flex-col">
					<Button
						variant="outline"
						onClick={handleCancel}
						disabled={isPurchasing}
						className="flex-1"
					>
						Cancel
					</Button>
					<Button
						variant="primary"
						onClick={onConfirm}
						loading={isPurchasing}
						className="flex-1"
					>
						Proceed to Checkout
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
