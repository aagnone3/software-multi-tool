"use client";

import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Progress } from "@ui/components/progress";
import { ArrowRightIcon, SparklesIcon, StarIcon, ZapIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

interface CreditUpgradeWidgetProps {
	className?: string;
}

const UPGRADE_THRESHOLD = 0.4; // Show when ≤40% credits remaining

export function CreditUpgradeWidget({ className }: CreditUpgradeWidgetProps) {
	const { balance, isLoading, isFreePlan, percentageUsed, totalCredits } =
		useCreditsBalance();
	const { activeOrganization } = useActiveOrganization();

	if (isLoading || !balance) return null;

	const percentageRemaining = 100 - percentageUsed;
	const remainingFraction =
		totalCredits > 0 ? balance.totalAvailable / totalCredits : 1;

	// Only show for free plan users or users with ≤40% credits remaining
	if (!isFreePlan && remainingFraction > UPGRADE_THRESHOLD) return null;

	// Don't show if already on overage (CreditBalanceCard handles that)
	if (balance.overage > 0) return null;

	const billingPath = activeOrganization
		? `/app/${activeOrganization.slug}/settings/billing`
		: "/app/settings/billing";

	const isUrgent = remainingFraction <= 0.1 || balance.totalAvailable <= 5;
	const isMedium = remainingFraction <= 0.2;

	const urgencyColor = isUrgent
		? "bg-red-500"
		: isMedium
			? "bg-amber-500"
			: "bg-blue-500";

	const features = [
		{ icon: ZapIcon, text: "500 credits/month included" },
		{ icon: StarIcon, text: "Priority processing" },
		{ icon: SparklesIcon, text: "Unlimited tool access" },
	];

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<ZapIcon className="size-5 text-primary" />
						<CardTitle className="text-base">
							{isUrgent
								? "Running out of credits"
								: isFreePlan
									? "Upgrade your plan"
									: "Low on credits"}
						</CardTitle>
					</div>
					{isUrgent && (
						<Badge status="error" className="text-xs">
							{balance.totalAvailable} left
						</Badge>
					)}
				</div>
				<CardDescription>
					{isFreePlan
						? "Unlock more with a Pro or Business plan"
						: `${balance.totalAvailable} of ${totalCredits} credits remaining this period`}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-1.5">
					<div className="flex justify-between text-xs text-muted-foreground">
						<span>{balance.used} used</span>
						<span>{percentageRemaining}% remaining</span>
					</div>
					<Progress
						value={percentageRemaining}
						className="h-2"
						data-urgent={isUrgent}
						data-medium={isMedium}
					/>
					<div
						className={`h-0.5 w-full rounded-full ${urgencyColor} opacity-40`}
					/>
				</div>

				{isFreePlan && (
					<ul className="space-y-1.5">
						{features.map(({ icon: Icon, text }) => (
							<li
								key={text}
								className="flex items-center gap-2 text-sm text-muted-foreground"
							>
								<Icon className="size-3.5 text-primary shrink-0" />
								{text}
							</li>
						))}
					</ul>
				)}

				<div className="flex gap-2">
					<Button asChild size="sm" className="flex-1">
						<Link href={billingPath}>
							<ZapIcon className="size-3.5 mr-1.5" />
							{isFreePlan ? "Upgrade to Pro" : "Get More Credits"}
						</Link>
					</Button>
					{isFreePlan && (
						<Button asChild size="sm" variant="outline">
							<Link href="/pricing">
								Compare plans
								<ArrowRightIcon className="size-3.5 ml-1.5" />
							</Link>
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
