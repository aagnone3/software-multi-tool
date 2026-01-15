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
import { Skeleton } from "@ui/components/skeleton";
import { cn } from "@ui/lib";
import { ChevronRightIcon, CoinsIcon, TrendingUpIcon } from "lucide-react";
import Link from "next/link";
import { useCreditsBalance } from "../../credits/hooks/use-credits-balance";
import { useUsageStats } from "../../credits/hooks/use-usage-stats";

interface CreditsOverviewProps {
	className?: string;
}

export function CreditsOverview({ className }: CreditsOverviewProps) {
	const {
		balance,
		isLoading: balanceLoading,
		percentageUsed,
		isLowCredits,
	} = useCreditsBalance();
	const { totalUsed, isLoading: usageLoading } = useUsageStats();
	const { activeOrganization } = useActiveOrganization();

	const isLoading = balanceLoading || usageLoading;

	const billingPath = activeOrganization
		? `/app/${activeOrganization.slug}/settings/billing`
		: "/app/settings/billing";

	const usagePath = activeOrganization
		? `/app/${activeOrganization.slug}/settings/billing/usage`
		: "/app/settings/billing/usage";

	if (isLoading) {
		return (
			<Card className={cn("animate-pulse", className)}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CoinsIcon className="size-5" />
						Credits
					</CardTitle>
					<CardDescription>Loading...</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Skeleton className="h-12 w-24" />
					<Skeleton className="h-2 w-full" />
					<div className="grid grid-cols-2 gap-3">
						<Skeleton className="h-16 rounded-lg" />
						<Skeleton className="h-16 rounded-lg" />
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!balance) {
		return null;
	}

	const daysRemaining = Math.ceil(
		(new Date(balance.periodEnd).getTime() - Date.now()) /
			(1000 * 60 * 60 * 24),
	);

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2">
					<CoinsIcon className="size-5" />
					Credits
				</CardTitle>
				<CardDescription>{balance.plan.name} plan</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Main balance display */}
				<div className="flex items-baseline justify-between">
					<div>
						<span className="text-3xl font-bold">
							{balance.totalAvailable}
						</span>
						<span className="ml-2 text-sm text-muted-foreground">
							available
						</span>
					</div>
					{isLowCredits && (
						<span className="text-xs font-medium text-destructive px-2 py-1 bg-destructive/10 rounded-full">
							Low balance
						</span>
					)}
				</div>

				{/* Progress bar */}
				<div className="space-y-1.5">
					<div className="flex justify-between text-xs">
						<span className="text-muted-foreground">
							{balance.used} / {balance.included} used
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

				{/* Stats grid */}
				<div className="grid grid-cols-2 gap-3">
					<div className="rounded-lg bg-muted/50 p-3">
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<TrendingUpIcon className="size-3.5" />
							<span className="text-xs">This month</span>
						</div>
						<p className="text-lg font-semibold mt-1">
							{totalUsed}
						</p>
						<p className="text-xs text-muted-foreground">
							credits used
						</p>
					</div>
					<div className="rounded-lg bg-muted/50 p-3">
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<CoinsIcon className="size-3.5" />
							<span className="text-xs">Period</span>
						</div>
						<p className="text-lg font-semibold mt-1">
							{daysRemaining > 0 ? daysRemaining : 0}
						</p>
						<p className="text-xs text-muted-foreground">
							days left
						</p>
					</div>
				</div>

				{/* Actions */}
				<div className="flex gap-2 pt-1">
					<Button
						variant="outline"
						size="sm"
						className="flex-1"
						asChild
					>
						<Link href={usagePath}>
							View usage
							<ChevronRightIcon className="size-4 ml-auto" />
						</Link>
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="flex-1"
						asChild
					>
						<Link href={billingPath}>
							Buy credits
							<ChevronRightIcon className="size-4 ml-auto" />
						</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
