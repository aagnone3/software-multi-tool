"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { cn } from "@ui/lib";
import {
	ActivityIcon,
	CheckCircle2Icon,
	ClockIcon,
	TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useMemo } from "react";
import { type Job, useRecentJobs } from "../hooks/use-recent-jobs";

interface ToolBenchmarkWidgetProps {
	className?: string;
	maxTools?: number;
}

interface ToolStats {
	slug: string;
	totalRuns: number;
	successCount: number;
	successRate: number;
	avgDurationMs: number | null;
}

function formatDuration(ms: number): string {
	if (ms < 1000) {
		return `${Math.round(ms)}ms`;
	}
	if (ms < 60_000) {
		return `${(ms / 1000).toFixed(1)}s`;
	}
	const min = Math.floor(ms / 60_000);
	const sec = Math.round((ms % 60_000) / 1000);
	return `${min}m ${sec}s`;
}

function slugToName(slug: string): string {
	return slug
		.split("-")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");
}

export function ToolBenchmarkWidget({
	className,
	maxTools = 5,
}: ToolBenchmarkWidgetProps) {
	const { jobs, isLoading } = useRecentJobs(100);
	const { track } = useProductAnalytics();

	const toolStats = useMemo<ToolStats[]>(() => {
		if (!jobs.length) {
			return [];
		}

		const bySlug = new Map<string, Job[]>();
		for (const job of jobs) {
			const existing = bySlug.get(job.toolSlug) ?? [];
			existing.push(job);
			bySlug.set(job.toolSlug, existing);
		}

		const stats: ToolStats[] = [];
		for (const [slug, slugJobs] of Array.from(bySlug.entries())) {
			const completed = slugJobs.filter(
				(j: Job) => j.status === "COMPLETED",
			);
			const failed = slugJobs.filter((j: Job) => j.status === "FAILED");
			const totalRuns = slugJobs.length;
			const successCount = completed.length;
			const successRate =
				totalRuns > 0
					? Math.round(
							(successCount / (successCount + failed.length)) *
								100,
						)
					: 0;

			const durations = completed
				.filter((j: Job) => j.completedAt)
				.map(
					(j: Job) =>
						new Date(j.completedAt ?? j.createdAt).getTime() -
						new Date(j.createdAt).getTime(),
				)
				.filter((d: number) => d > 0);

			const avgDurationMs =
				durations.length > 0
					? durations.reduce((a: number, b: number) => a + b, 0) /
						durations.length
					: null;

			stats.push({
				slug,
				totalRuns,
				successCount,
				successRate,
				avgDurationMs,
			});
		}

		return stats
			.sort((a, b) => b.totalRuns - a.totalRuns)
			.slice(0, maxTools);
	}, [jobs, maxTools]);

	if (isLoading) {
		return (
			<Card className={cn(className)}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<ActivityIcon className="h-4 w-4" />
						Tool Benchmark
					</CardTitle>
					<CardDescription>
						Performance stats across your tools
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="h-10 animate-pulse rounded bg-muted"
							/>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!toolStats.length) {
		return null;
	}

	return (
		<Card className={cn(className)}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<ActivityIcon className="h-4 w-4" />
					Tool Benchmark
				</CardTitle>
				<CardDescription>
					Performance across your {toolStats.length} most-used tool
					{toolStats.length !== 1 ? "s" : ""}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{toolStats.map((stat) => (
						<div key={stat.slug} className="space-y-1">
							<div className="flex items-center justify-between text-sm">
								<Link
									href={`/app/tools/${stat.slug}`}
									className="font-medium hover:underline"
									onClick={() =>
										track({
											name: "tool_benchmark_tool_clicked",
											props: {
												tool_slug: stat.slug,
												success_rate: stat.successRate,
												total_runs: stat.totalRuns,
											},
										})
									}
								>
									{slugToName(stat.slug)}
								</Link>
								<span className="text-xs text-muted-foreground">
									{stat.totalRuns} run
									{stat.totalRuns !== 1 ? "s" : ""}
								</span>
							</div>
							<div className="flex items-center gap-4 text-xs text-muted-foreground">
								<span
									className={cn(
										"flex items-center gap-1",
										stat.successRate >= 90
											? "text-green-600"
											: stat.successRate >= 70
												? "text-amber-600"
												: "text-red-600",
									)}
								>
									<CheckCircle2Icon className="h-3 w-3" />
									{stat.successRate}% success
								</span>
								{stat.avgDurationMs !== null && (
									<span className="flex items-center gap-1">
										<ClockIcon className="h-3 w-3" />
										avg {formatDuration(stat.avgDurationMs)}
									</span>
								)}
								<span className="flex items-center gap-1">
									<TrendingUpIcon className="h-3 w-3" />
									{stat.successCount} completed
								</span>
							</div>
							{/* Success rate bar */}
							<div className="h-1.5 w-full rounded-full bg-muted">
								<div
									className={cn(
										"h-1.5 rounded-full transition-all",
										stat.successRate >= 90
											? "bg-green-500"
											: stat.successRate >= 70
												? "bg-amber-500"
												: "bg-red-500",
									)}
									style={{ width: `${stat.successRate}%` }}
								/>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
