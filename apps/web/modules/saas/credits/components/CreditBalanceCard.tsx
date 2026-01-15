"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Progress } from "@ui/components/progress";
import { cn } from "@ui/lib";
import { ChevronRightIcon, CoinsIcon } from "lucide-react";
import Link from "next/link";
import { useCreditsBalance } from "../hooks/use-credits-balance";

interface CreditBalanceCardProps {
	className?: string;
}

export function CreditBalanceCard({ className }: CreditBalanceCardProps) {
	const { balance, isLoading, percentageUsed, isLowCredits } =
		useCreditsBalance();
	const { activeOrganization } = useActiveOrganization();

	const usageHistoryPath = activeOrganization
		? `/app/${activeOrganization.slug}/settings/billing/usage`
		: "/app/settings/billing/usage";

	if (isLoading) {
		return (
			<Card className={cn("animate-pulse", className)}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CoinsIcon className="size-5" />
						Credit Balance
					</CardTitle>
					<CardDescription>Loading...</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="h-24 bg-muted rounded-lg" />
				</CardContent>
			</Card>
		);
	}

	if (!balance) {
		return null;
	}

	const periodEnd = new Date(balance.periodEnd);
	const periodStart = new Date(balance.periodStart);
	const daysRemaining = Math.ceil(
		(periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
	);

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<CoinsIcon className="size-5" />
					Credit Balance
				</CardTitle>
				<CardDescription>
					Your {balance.plan.name} plan credit usage for this billing
					period
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="flex items-baseline justify-between">
					<div>
						<span className="text-4xl font-bold">
							{balance.totalAvailable}
						</span>
						<span className="ml-2 text-muted-foreground">
							credits available
						</span>
					</div>
					{isLowCredits && (
						<span className="text-sm font-medium text-destructive">
							Low balance
						</span>
					)}
				</div>

				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">
							{balance.used} of {balance.included} included
							credits used
						</span>
						<span className="font-medium">{percentageUsed}%</span>
					</div>
					<Progress
						value={percentageUsed}
						className={cn(
							"h-2",
							isLowCredits && "[&>*]:bg-destructive",
						)}
					/>
				</div>

				<div className="grid grid-cols-2 gap-4 pt-2">
					<div className="rounded-lg bg-muted/50 p-3">
						<p className="text-sm text-muted-foreground">
							Included
						</p>
						<p className="text-lg font-semibold">
							{balance.remaining}
						</p>
						<p className="text-xs text-muted-foreground">
							remaining
						</p>
					</div>
					<div className="rounded-lg bg-muted/50 p-3">
						<p className="text-sm text-muted-foreground">
							Purchased
						</p>
						<p className="text-lg font-semibold">
							{balance.purchasedCredits}
						</p>
						<p className="text-xs text-muted-foreground">credits</p>
					</div>
				</div>

				{balance.overage > 0 && (
					<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
						<p className="text-sm font-medium text-amber-800 dark:text-amber-200">
							Overage: {balance.overage} credits
						</p>
						<p className="text-xs text-amber-600 dark:text-amber-400">
							Additional usage beyond your included credits
						</p>
					</div>
				)}

				<div className="text-sm text-muted-foreground border-t pt-4">
					<p>
						Period: {periodStart.toLocaleDateString()} -{" "}
						{periodEnd.toLocaleDateString()}
					</p>
					<p className="mt-1">
						{daysRemaining > 0
							? `${daysRemaining} days remaining in this period`
							: "Billing period ending soon"}
					</p>
				</div>

				<Button variant="outline" className="w-full" asChild>
					<Link href={usageHistoryPath}>
						View usage history
						<ChevronRightIcon className="size-4 ml-auto" />
					</Link>
				</Button>
			</CardContent>
		</Card>
	);
}
