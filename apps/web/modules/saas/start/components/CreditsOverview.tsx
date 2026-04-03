"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
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
import {
	ChevronRightIcon,
	CoinsIcon,
	SparklesIcon,
	TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";
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
		isStarterPlan,
	} = useCreditsBalance();
	const { totalUsed, isLoading: usageLoading } = useUsageStats();
	const { activeOrganization } = useActiveOrganization();

	const isLoading = balanceLoading || usageLoading;
	const { track } = useProductAnalytics();

	const billingPath = activeOrganization
		? `/app/${activeOrganization.slug}/settings/billing`
		: "/app/settings/billing";

	const usagePath = activeOrganization
		? `/app/${activeOrganization.slug}/settings/usage`
		: "/app/settings/usage";

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
		return (
			<Card className={className}>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2">
						<CoinsIcon className="size-5" />
						Credits
					</CardTitle>
					<CardDescription>Your credit balance</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-6 text-center">
						<CoinsIcon className="size-10 text-muted-foreground/40 mb-3" />
						<p className="text-sm font-medium">No credits yet</p>
						<p className="text-xs text-muted-foreground mt-1">
							Choose a plan to get started with credits
						</p>
						<Button
							variant="outline"
							size="sm"
							className="mt-3"
							asChild
						>
							<Link href={billingPath}>
								View plans
								<ChevronRightIcon className="size-4 ml-1" />
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		);
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
				{isStarterPlan ? (
					<div className="space-y-2 pt-1">
						<div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
							<p className="text-xs font-medium text-primary">
								Pro gives you 500 credits/month with rollover
							</p>
							<p className="text-xs text-muted-foreground mt-0.5">
								5× more than your current Starter plan
							</p>
						</div>
						<div className="flex gap-2">
							<Button
								variant="primary"
								size="sm"
								className="flex-1"
								asChild
								onClick={() =>
									track({
										name: "upgrade_nudge_cta_clicked",
										props: {
											source: "credits_overview_widget",
											plan_id: "starter",

											cta_label: "upgrade_to_pro",
										},
									})
								}
							>
								<Link href={`${billingPath}?upgrade=pro`}>
									<SparklesIcon className="size-3.5 mr-1" />
									Upgrade to Pro
								</Link>
							</Button>
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
						</div>
					</div>
				) : (
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
				)}
			</CardContent>
		</Card>
	);
}
