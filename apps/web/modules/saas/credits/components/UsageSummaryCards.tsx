"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import { cn } from "@ui/lib";
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	CoinsIcon,
	TrendingUpIcon,
	WrenchIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { useUsageStats } from "../hooks/use-usage-stats";
import { formatToolName } from "../lib/format-tool-name";

interface UsageSummaryCardsProps {
	className?: string;
}

export function UsageSummaryCards({ className }: UsageSummaryCardsProps) {
	const {
		totalUsed,
		totalOverage,
		mostUsedTool,
		totalOperations,
		isLoading,
	} = useUsageStats();

	const { isStarterPlan, isFreePlan } = useCreditsBalance();
	const { track } = useProductAnalytics();

	if (isLoading) {
		return (
			<div className={cn("grid gap-4 md:grid-cols-4", className)}>
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={`skeleton-${i}`}>
						<CardHeader className="pb-2">
							<Skeleton className="h-4 w-24" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16 mb-1" />
							<Skeleton className="h-3 w-20" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	const overageCost = (totalOverage * 0.02).toFixed(2);
	const showOverageNudge = totalOverage > 0 && (isStarterPlan || isFreePlan);

	return (
		<div className={cn("space-y-4", className)}>
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							This Month
						</CardTitle>
						<CoinsIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">{totalUsed}</p>
						<p className="text-xs text-muted-foreground">
							credits used
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Overage
						</CardTitle>
						<AlertTriangleIcon
							className={cn(
								"size-4",
								totalOverage > 0
									? "text-amber-500"
									: "text-muted-foreground",
							)}
						/>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">{totalOverage}</p>
						<p className="text-xs text-muted-foreground">
							${overageCost} charged
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Most Used Tool
						</CardTitle>
						<WrenchIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold truncate">
							{mostUsedTool
								? formatToolName(mostUsedTool.toolSlug)
								: "-"}
						</p>
						<p className="text-xs text-muted-foreground">
							{mostUsedTool?.credits ?? 0} credits
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Operations
						</CardTitle>
						<TrendingUpIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">{totalOperations}</p>
						<p className="text-xs text-muted-foreground">
							tool executions
						</p>
					</CardContent>
				</Card>
			</div>

			{showOverageNudge && (
				<div className="flex items-center gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
					<AlertTriangleIcon className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
					<div className="flex-1">
						<p className="text-sm font-medium text-amber-900 dark:text-amber-100">
							You paid ${overageCost} in overage this month
						</p>
						<p className="text-xs text-amber-700 dark:text-amber-300">
							Upgrade to Pro for 500 credits/month — 5× more than
							Starter, with no surprise overage charges.
						</p>
					</div>
					<div className="flex shrink-0 gap-2">
						<Button
							size="sm"
							variant="ghost"
							className="text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900"
							asChild
						>
							<Link
								href="/pricing#pricing-plan-pro"
								onClick={() =>
									track({
										name: "usage_overage_nudge_compare_clicked",
										props: {
											overage_credits: totalOverage,
											overage_cost: Number(overageCost),
										},
									})
								}
							>
								Compare plans
							</Link>
						</Button>
						<Button size="sm" asChild>
							<Link
								href="/app/choose-plan"
								onClick={() =>
									track({
										name: "usage_overage_nudge_upgrade_clicked",
										props: {
											overage_credits: totalOverage,
											overage_cost: Number(overageCost),
										},
									})
								}
							>
								Upgrade to Pro
								<ArrowRightIcon className="ml-1 size-3" />
							</Link>
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
