"use client";

import { useTools } from "@saas/tools/hooks/use-tools";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import { TrendingDownIcon, TrendingUpIcon, ZapIcon } from "lucide-react";
import React, { useMemo } from "react";
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
			</CardContent>
		</Card>
	);
}
