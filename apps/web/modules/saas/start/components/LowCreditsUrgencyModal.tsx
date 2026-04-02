"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Progress } from "@ui/components/progress";
import { AlertTriangleIcon, SparklesIcon, ZapIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const STORAGE_KEY_PREFIX = "low-credits-modal-dismissed";
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

function getDismissKey(userId?: string) {
	return `${STORAGE_KEY_PREFIX}-${userId ?? "anonymous"}`;
}

function checkIsDismissed(userId?: string): boolean {
	if (typeof window === "undefined") {
		return false;
	}
	const key = getDismissKey(userId);
	const stored = localStorage.getItem(key);
	if (!stored) {
		return false;
	}
	const dismissedAt = Number.parseInt(stored, 10);
	return Date.now() - dismissedAt < DISMISS_DURATION_MS;
}

function setDismissed(userId?: string) {
	const key = getDismissKey(userId);
	localStorage.setItem(key, String(Date.now()));
}

interface LowCreditsUrgencyModalProps {
	userId?: string;
}

export function LowCreditsUrgencyModal({
	userId,
}: LowCreditsUrgencyModalProps) {
	const { activeOrganization } = useActiveOrganization();
	const {
		balance,
		isLoading,
		isLowCredits,
		isStarterPlan,
		percentageUsed,
		totalCredits,
	} = useCreditsBalance();
	const { track } = useProductAnalytics();
	const [open, setOpen] = useState(false);
	const [hasChecked, setHasChecked] = useState(false);
	const planLabel = isStarterPlan ? "starter" : "free";

	const billingPath = activeOrganization
		? `/app/${activeOrganization.slug}/settings/billing`
		: "/app/settings/billing";

	useEffect(() => {
		if (isLoading || hasChecked) {
			return;
		}
		setHasChecked(true);

		if (!balance || !isLowCredits) {
			return;
		}

		// Don't show if balance is 0 (ZeroCreditsModal handles that case)
		if (balance.remaining <= 0) {
			return;
		}

		// Don't show if user has never used any credits (fresh accounts)
		if (balance.used <= 0) {
			return;
		}

		// Check 24h dismissal
		if (checkIsDismissed(userId)) {
			return;
		}

		setOpen(true);
		track({
			name: "low_credits_modal_shown",
			props: { percent_used: percentageUsed, plan: planLabel },
		});
	}, [
		isLoading,
		balance,
		isLowCredits,
		userId,
		hasChecked,
		track,
		percentageUsed,
		planLabel,
	]);

	const handleDismiss = () => {
		track({
			name: "low_credits_modal_dismissed",
			props: { percent_used: percentageUsed, plan: planLabel },
		});
		setDismissed(userId);
		setOpen(false);
	};

	if (!open || !balance) {
		return null;
	}

	const percentRemaining =
		totalCredits > 0
			? Math.max(0, Math.round((balance.remaining / totalCredits) * 100))
			: 0;

	return (
		<Dialog open={open} onOpenChange={(v) => !v && handleDismiss()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-2 mb-1">
						<div className="flex size-9 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
							<AlertTriangleIcon className="size-5 text-amber-600 dark:text-amber-400" />
						</div>
						<DialogTitle className="text-lg">
							Running Low on Credits
						</DialogTitle>
					</div>
					<DialogDescription>
						{isStarterPlan
							? `You've used ${percentageUsed}% of your Starter credits. Upgrade to Pro for 500 credits/month, scheduled runs, and bulk actions.`
							: `You've used ${percentageUsed}% of your credits. Upgrade now to keep your workflows running without interruption.`}
					</DialogDescription>
				</DialogHeader>

				{/* Credit usage bar */}
				<div className="space-y-2 my-2">
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">
							Credits remaining
						</span>
						<span className="font-semibold text-amber-600 dark:text-amber-400">
							{balance.remaining} / {totalCredits}
						</span>
					</div>
					<Progress
						value={percentageUsed}
						className="h-3 [&>div]:bg-amber-500"
					/>
					<p className="text-xs text-muted-foreground text-right">
						{percentRemaining}% remaining
					</p>
				</div>

				{/* CTAs */}
				<div className="flex flex-col gap-2 mt-2">
					<Button asChild className="w-full gap-2">
						<Link
							href={billingPath}
							onClick={() => {
								track({
									name: "low_credits_modal_upgrade_clicked",
									props: {
										plan: planLabel,
										cta: isStarterPlan
											? "upgrade_to_pro"
											: "upgrade_plan",
									},
								});
								handleDismiss();
							}}
						>
							<SparklesIcon className="size-4" />
							{isStarterPlan
								? "Upgrade to Pro"
								: "Upgrade Plan for More Credits"}
						</Link>
					</Button>
					{isStarterPlan && (
						<Button
							variant="outline"
							asChild
							className="w-full gap-2"
						>
							<Link
								href="/pricing#pricing-plan-pro"
								onClick={handleDismiss}
							>
								Compare plans
							</Link>
						</Button>
					)}
					<Button variant="outline" asChild className="w-full gap-2">
						<Link href={billingPath} onClick={handleDismiss}>
							<ZapIcon className="size-4" />
							Buy a Credit Pack
						</Link>
					</Button>
					<button
						type="button"
						onClick={handleDismiss}
						className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-1"
					>
						Remind me tomorrow
					</button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
