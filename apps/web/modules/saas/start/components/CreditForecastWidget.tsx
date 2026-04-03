"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useTools } from "@saas/tools/hooks/use-tools";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import {
	AlertTriangleIcon,
	TrendingDownIcon,
	TrendingUpIcon,
	ZapIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo } from "react";
import { useRecentJobs } from "../hooks/use-recent-jobs";

interface CreditForecastWidgetProps {
	className?: string;
}

function getDaysAgo(days: number): Date {
	const d = new Date();
	d.setDate(d.getDate() - days);
	return d;
}

export function CreditForecastWidget({ className }: CreditForecastWidgetProps) {
	const { jobs, isLoading } = useRecentJobs(200);
	const { enabledTools } = useTools();
	const { balance, isFreePlan, isStarterPlan } = useCreditsBalance();
	const { activeOrganization } = useActiveOrganization();
	const { track } = useProductAnalytics();

	const forecast = useMemo(() => {
		if (!jobs || jobs.length === 0) {
			return null;
		}

		const completedJobs = jobs.filter(
			(j) => j.status === "COMPLETED" && j.completedAt,
		);
		if (completedJobs.length === 0) {
			return null;
		}

		// Build a credit cost lookup from tool config
		const creditCostMap = new Map<string, number>();
		for (const tool of enabledTools) {
			if (tool.creditCost != null) {
				creditCostMap.set(tool.slug, tool.creditCost);
			}
		}

		const sevenDaysAgo = getDaysAgo(7).getTime();
		const fourteenDaysAgo = getDaysAgo(14).getTime();

		const last7Days = completedJobs.filter(
			(j) => new Date(j.completedAt as string).getTime() > sevenDaysAgo,
		);
		const prev7Days = completedJobs.filter((j) => {
			const t = new Date(j.completedAt as string).getTime();
			return t > fourteenDaysAgo && t <= sevenDaysAgo;
		});

		const getJobCost = (j: { toolSlug: string }) =>
			creditCostMap.get(j.toolSlug) ?? 1;

		const creditsLast7 = last7Days.reduce(
			(sum, j) => sum + getJobCost(j),
			0,
		);
		const creditsPrev7 = prev7Days.reduce(
			(sum, j) => sum + getJobCost(j),
			0,
		);

		const dailyRate = creditsLast7 / 7;
		const forecast30 = Math.round(dailyRate * 30);
		const forecast7 = Math.round(dailyRate * 7);

		const trendPct =
			creditsPrev7 > 0
				? Math.round(
						((creditsLast7 - creditsPrev7) / creditsPrev7) * 100,
					)
				: null;

		return {
			dailyRate: Math.round(dailyRate * 10) / 10,
			forecast7,
			forecast30,
			creditsLast7,
			creditsPrev7,
			trendPct,
		};
	}, [jobs, enabledTools]);

	// Determine if the user is on track to exceed their plan credits this month.
	// Only show nudge for free and starter plan users (not Pro, not paying for extra).
	const remainingCredits = balance?.totalAvailable ?? null;
	const willExceedCredits =
		remainingCredits !== null &&
		(isFreePlan || isStarterPlan) &&
		forecast !== null &&
		forecast.forecast30 > remainingCredits;

	useEffect(() => {
		if (willExceedCredits && forecast) {
			track({
				name: "credit_forecast_nudge_shown",
				props: {
					plan_id: isStarterPlan ? "starter" : "free",
					forecast_30: forecast.forecast30,
					remaining_credits: remainingCredits ?? 0,
				},
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [willExceedCredits]);

	if (isLoading) {
		return (
			<Card className={className}>
				<CardHeader className="pb-3">
					<Skeleton className="h-5 w-36" />
					<Skeleton className="h-4 w-48 mt-1" />
				</CardHeader>
				<CardContent className="space-y-2">
					<Skeleton className="h-8 w-24" />
					<Skeleton className="h-4 w-40" />
					<Skeleton className="h-4 w-32" />
				</CardContent>
			</Card>
		);
	}

	if (!forecast) {
		return null;
	}

	const { dailyRate, forecast7, forecast30, trendPct } = forecast;
	const trendUp = trendPct !== null && trendPct > 0;
	const trendDown = trendPct !== null && trendPct < 0;

	const billingPath = activeOrganization
		? `/app/${activeOrganization.slug}/settings/billing`
		: "/app/settings/billing";

	const upgradeHref = isStarterPlan
		? `${billingPath}#pricing-plan-pro`
		: billingPath;
	const upgradeLabel = isStarterPlan ? "Upgrade to Pro" : "Get more credits";
	const nudgeCopy = isStarterPlan
		? `At this rate you'll use ~${forecast30} credits/mo — more than your ${balance?.included ?? 100} Starter credits. Upgrade to Pro for 500/mo.`
		: `At this rate you'll use ~${forecast30} credits/mo — more than your ${balance?.included ?? 10} free credits.`;

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<div className="flex items-center gap-2">
					<ZapIcon className="size-4 text-yellow-500" />
					<CardTitle className="text-base">Credit Forecast</CardTitle>
					{trendPct !== null && (
						<span
							className={`ml-auto flex items-center gap-1 text-xs font-medium ${
								trendUp
									? "text-red-500"
									: trendDown
										? "text-green-500"
										: "text-muted-foreground"
							}`}
						>
							{trendUp ? (
								<TrendingUpIcon className="size-3" />
							) : trendDown ? (
								<TrendingDownIcon className="size-3" />
							) : null}
							{trendUp ? "+" : ""}
							{trendPct}% vs last week
						</span>
					)}
				</div>
				<CardDescription>
					Based on your last 7 days of usage
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				<div>
					<p className="text-3xl font-bold tabular-nums">
						{dailyRate}
					</p>
					<p className="text-xs text-muted-foreground">
						credits/day average
					</p>
				</div>
				<div className="grid grid-cols-2 gap-2 pt-1">
					<div className="rounded-md bg-muted/50 p-2 text-center">
						<p className="text-lg font-semibold tabular-nums">
							{forecast7}
						</p>
						<p className="text-xs text-muted-foreground">
							Next 7 days
						</p>
					</div>
					<div className="rounded-md bg-muted/50 p-2 text-center">
						<p className="text-lg font-semibold tabular-nums">
							{forecast30}
						</p>
						<p className="text-xs text-muted-foreground">
							Next 30 days
						</p>
					</div>
				</div>

				{willExceedCredits && (
					<div
						className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/30"
						data-testid="credit-forecast-nudge"
					>
						<AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
						<div className="flex-1 min-w-0">
							<p className="text-xs text-amber-700 dark:text-amber-400 leading-snug">
								{nudgeCopy}
							</p>
							<Link
								href={upgradeHref}
								className="mt-1 inline-block text-xs font-medium text-amber-700 underline underline-offset-2 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200"
								data-testid="credit-forecast-nudge-cta"
								onClick={() =>
									track({
										name: "credit_forecast_upgrade_clicked",
										props: {
											plan_id: isStarterPlan
												? "starter"
												: "free",
											source: "credit_forecast_widget",
										},
									})
								}
							>
								{upgradeLabel} →
							</Link>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
