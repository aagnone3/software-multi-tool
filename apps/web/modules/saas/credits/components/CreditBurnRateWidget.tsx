"use client";

import { useJobsList } from "@tools/hooks/use-job-polling";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import { cn } from "@ui/lib";
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	FlameIcon,
	TrendingDownIcon,
	TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useMemo } from "react";
import { useCreditsBalance } from "../hooks/use-credits-balance";

interface CreditBurnRateWidgetProps {
	className?: string;
}

function formatDays(days: number): string {
	if (days >= 365) return `${Math.floor(days / 365)}y`;
	if (days >= 30) return `${Math.floor(days / 30)}mo`;
	if (days >= 7) return `${Math.floor(days / 7)}w`;
	return `${Math.round(days)}d`;
}

type BurnTrend = "stable" | "increasing" | "decreasing";

interface BurnRateData {
	dailyBurnRate: number;
	weeklyBurnRate: number;
	estimatedDaysRemaining: number | null;
	trend: BurnTrend;
	totalJobsThisWeek: number;
	totalJobsLastWeek: number;
}

function computeBurnRate(
	jobs: Array<{ status: string; createdAt?: string }>,
	currentBalance: number,
): BurnRateData {
	const now = new Date();
	const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

	const completedJobs = jobs.filter((j) => j.status === "COMPLETED");

	const thisWeekJobs = completedJobs.filter((j) => {
		if (!j.createdAt) return false;
		const d = new Date(j.createdAt);
		return d >= oneWeekAgo;
	});

	const lastWeekJobs = completedJobs.filter((j) => {
		if (!j.createdAt) return false;
		const d = new Date(j.createdAt);
		return d >= twoWeeksAgo && d < oneWeekAgo;
	});

	// Estimate credits per job (default 10 if no creditCost attached)
	const creditsPerJob = 10;
	const thisWeekCredits = thisWeekJobs.length * creditsPerJob;
	const lastWeekCredits = lastWeekJobs.length * creditsPerJob;

	const dailyBurnRate = thisWeekCredits / 7;
	const weeklyBurnRate = thisWeekCredits;

	let trend: BurnTrend = "stable";
	if (lastWeekCredits > 0) {
		const change = (thisWeekCredits - lastWeekCredits) / lastWeekCredits;
		if (change > 0.15) trend = "increasing";
		else if (change < -0.15) trend = "decreasing";
	}

	const estimatedDaysRemaining =
		dailyBurnRate > 0 ? currentBalance / dailyBurnRate : null;

	return {
		dailyBurnRate: Math.round(dailyBurnRate * 10) / 10,
		weeklyBurnRate,
		estimatedDaysRemaining,
		trend,
		totalJobsThisWeek: thisWeekJobs.length,
		totalJobsLastWeek: lastWeekJobs.length,
	};
}

export function CreditBurnRateWidget({ className }: CreditBurnRateWidgetProps) {
	const {
		totalCredits,
		isLoading: balanceLoading,
		isStarterPlan,
		isFreePlan,
	} = useCreditsBalance();
	const { jobs, isLoading: jobsLoading } = useJobsList(undefined, 50);

	const isLoading = balanceLoading || jobsLoading;

	const normalizedJobs = useMemo(
		() =>
			(jobs ?? []).map((j) => ({
				status: j.status,
				createdAt:
					j.createdAt instanceof Date
						? j.createdAt.toISOString()
						: j.createdAt
							? String(j.createdAt)
							: undefined,
			})),
		[jobs],
	);

	const burnData = useMemo((): BurnRateData | null => {
		if (isLoading || totalCredits === undefined || totalCredits === null)
			return null;
		return computeBurnRate(normalizedJobs, totalCredits);
	}, [normalizedJobs, totalCredits, isLoading]);

	if (isLoading) {
		return (
			<Card className={className}>
				<CardHeader className="pb-3">
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-4 w-48 mt-1" />
				</CardHeader>
				<CardContent className="space-y-3">
					<Skeleton className="h-8 w-24" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-3/4" />
				</CardContent>
			</Card>
		);
	}

	if (
		!burnData ||
		(burnData.dailyBurnRate === 0 && burnData.totalJobsThisWeek === 0)
	) {
		return null;
	}

	const { dailyBurnRate, weeklyBurnRate, estimatedDaysRemaining, trend } =
		burnData;

	const isLowBalance =
		estimatedDaysRemaining !== null && estimatedDaysRemaining < 7;

	const TrendIcon =
		trend === "increasing"
			? TrendingUpIcon
			: trend === "decreasing"
				? TrendingDownIcon
				: FlameIcon;

	const trendColor =
		trend === "increasing"
			? "text-orange-500"
			: trend === "decreasing"
				? "text-green-500"
				: "text-muted-foreground";

	return (
		<Card className={cn(isLowBalance && "border-orange-300", className)}>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<FlameIcon className="size-4 text-orange-500" />
						<CardTitle className="text-base">Burn Rate</CardTitle>
					</div>
					{isLowBalance && (
						<span className="inline-flex items-center gap-1 rounded-full border border-orange-300 px-2 py-0.5 text-xs font-medium text-orange-600">
							<AlertTriangleIcon className="size-3" />
							Low balance
						</span>
					)}
				</div>
				<CardDescription>Credit consumption pace</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-end gap-2">
					<span className="text-3xl font-bold">{dailyBurnRate}</span>
					<span className="text-muted-foreground text-sm mb-1">
						credits/day
					</span>
					<TrendIcon
						className={cn("size-4 mb-1 ml-auto", trendColor)}
					/>
				</div>

				<div className="grid grid-cols-2 gap-3 text-sm">
					<div>
						<p className="text-muted-foreground text-xs">
							This week
						</p>
						<p className="font-medium">{weeklyBurnRate} credits</p>
					</div>
					<div>
						<p className="text-muted-foreground text-xs">
							Jobs run
						</p>
						<p className="font-medium">
							{burnData.totalJobsThisWeek}
						</p>
					</div>
				</div>

				{estimatedDaysRemaining !== null && (
					<div
						className={cn(
							"rounded-lg p-3 text-sm",
							isLowBalance
								? "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
								: "bg-muted/50",
						)}
					>
						<p>
							At this rate, your{" "}
							<span className="font-semibold">
								{totalCredits}
							</span>{" "}
							remaining credits will last approximately{" "}
							<span className="font-semibold">
								{formatDays(estimatedDaysRemaining)}
							</span>
							.
						</p>
					</div>
				)}

				{isStarterPlan ? (
					<div className="space-y-2">
						<Button
							variant="primary"
							size="sm"
							className="w-full gap-1"
							asChild
						>
							<Link href="/app/settings/billing?upgrade=pro">
								Upgrade to Pro
								<ArrowRightIcon className="size-3" />
							</Link>
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="w-full gap-1 text-muted-foreground"
							asChild
						>
							<Link href="/pricing#pricing-plan-pro">
								Compare plans
								<ArrowRightIcon className="size-3" />
							</Link>
						</Button>
					</div>
				) : isFreePlan ? (
					<Button
						variant="primary"
						size="sm"
						className="w-full gap-1"
						asChild
					>
						<Link href="/app/settings/billing">
							Upgrade for more credits
							<ArrowRightIcon className="size-3" />
						</Link>
					</Button>
				) : (
					<Button
						variant="ghost"
						size="sm"
						className="w-full gap-1"
						asChild
					>
						<Link href="/app/settings/billing">
							Buy more credits
							<ArrowRightIcon className="size-3" />
						</Link>
					</Button>
				)}
			</CardContent>
		</Card>
	);
}
