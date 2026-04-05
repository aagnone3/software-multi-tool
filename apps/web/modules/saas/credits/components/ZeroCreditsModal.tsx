"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { CoinsIcon, RocketIcon, ZapIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect } from "react";
import { useActiveOrganization } from "../../organizations/hooks/use-active-organization";
import { useCreditsBalance } from "../hooks/use-credits-balance";

export function ZeroCreditsModal() {
	const { balance, isLoading, isStarterPlan } = useCreditsBalance();
	const { activeOrganization } = useActiveOrganization();
	const { track } = useProductAnalytics();
	const [dismissed, setDismissed] = React.useState(false);

	const billingPath = activeOrganization
		? `/app/${activeOrganization.slug}/settings/billing`
		: "/app/settings/billing";

	const isOpen =
		!isLoading &&
		!dismissed &&
		balance !== undefined &&
		balance.totalAvailable === 0;

	useEffect(() => {
		if (isOpen && balance) {
			track({
				name: "credits_exhausted",
				props: {
					plan_id: balance.plan.id,
					credits_purchased: balance.purchasedCredits,
				},
			});
		}
	}, [isOpen, balance, track]);

	const description = isStarterPlan
		? "You've hit your Starter credit limit. Upgrade to Pro for 500 credits/month, scheduled runs, and bulk actions."
		: "Get more credits to continue using AI tools. Upgrade to Pro for 500 credits/month, or buy a one-time pack.";

	const proFeatureText = isStarterPlan
		? "500 credits/month · scheduled runs · bulk actions · priority processing"
		: "500 credits/month · all tools · priority processing";

	const upgradeCTAText = isStarterPlan ? "Upgrade to Pro" : "Upgrade to Pro";

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) {
					setDismissed(true);
				}
			}}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
						<CoinsIcon className="size-6 text-amber-600 dark:text-amber-400" />
					</div>
					<DialogTitle className="text-center text-xl">
						You&apos;ve used all your credits
					</DialogTitle>
					<DialogDescription className="text-center">
						{description}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3 py-2">
					<div className="flex items-start gap-3 rounded-lg border border-indigo-100 bg-indigo-50 p-3 dark:border-indigo-900 dark:bg-indigo-950/30">
						<RocketIcon className="mt-0.5 size-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
						<div>
							<p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
								Pro Plan — $29/month
							</p>
							<p className="text-xs text-indigo-700 dark:text-indigo-300">
								{proFeatureText}
							</p>
						</div>
					</div>

					{!isStarterPlan && (
						<div className="flex items-start gap-3 rounded-lg border p-3">
							<ZapIcon className="mt-0.5 size-5 shrink-0 text-amber-500" />
							<div>
								<p className="text-sm font-semibold">
									Buy a Credit Pack
								</p>
								<p className="text-xs text-muted-foreground">
									One-time purchase · no subscription required
								</p>
							</div>
						</div>
					)}
				</div>

				<DialogFooter className="flex-col gap-2 sm:flex-col">
					<Button
						asChild
						variant="primary"
						className="w-full bg-indigo-600 hover:bg-indigo-700"
					>
						<Link href={billingPath}>{upgradeCTAText}</Link>
					</Button>
					{isStarterPlan && (
						<Button asChild variant="outline" className="w-full">
							<Link href="/pricing#pricing-plan-pro">
								Compare plans
							</Link>
						</Button>
					)}
					{!isStarterPlan && (
						<Button asChild variant="outline" className="w-full">
							<Link href={billingPath}>Buy Credits</Link>
						</Button>
					)}
					<Button
						variant="ghost"
						className="w-full text-muted-foreground"
						onClick={() => setDismissed(true)}
					>
						Maybe later
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
