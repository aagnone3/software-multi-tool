"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { config } from "@repo/config";
import { useJobsList } from "@tools/hooks/use-job-polling";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import {
	BarChart3Icon,
	CheckCircleIcon,
	ClockIcon,
	CreditCardIcon,
	XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useMemo } from "react";

interface ToolStat {
	slug: string;
	name: string;
	totalRuns: number;
	completed: number;
	failed: number;
	successRate: number;
	creditsUsed: number;
	avgDurationMs: number | null;
}

function formatDuration(ms: number): string {
	if (ms < 1000) {
		return `${ms}ms`;
	}
	const s = Math.round(ms / 1000);
	if (s < 60) {
		return `${s}s`;
	}
	const m = Math.floor(s / 60);
	const rem = s % 60;
	return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

interface ToolInsightsDashboardProps {
	className?: string;
}

export function ToolInsightsDashboard({
	className,
}: ToolInsightsDashboardProps) {
	const { track } = useProductAnalytics();
	const { jobs: allJobs, isLoading } = useJobsList(undefined, 500);

	React.useEffect(() => {
		track({ name: "tool_insights_page_viewed", props: {} });
	}, [track]);

	const toolStats = useMemo<ToolStat[]>(() => {
		const jobs = allJobs ?? [];
		const statsMap = new Map<string, ToolStat>();

		for (const job of jobs) {
			if (!statsMap.has(job.toolSlug)) {
				const toolConfig = config.tools.registry.find(
					(t) => t.slug === job.toolSlug,
				);
				statsMap.set(job.toolSlug, {
					slug: job.toolSlug,
					name: toolConfig?.name ?? job.toolSlug,
					totalRuns: 0,
					completed: 0,
					failed: 0,
					successRate: 0,
					creditsUsed: 0,
					avgDurationMs: null,
				});
			}

			const stat = statsMap.get(job.toolSlug);
			if (!stat) {
				continue;
			}
			stat.totalRuns++;

			if (job.status === "COMPLETED") {
				stat.completed++;
				if (job.completedAt && job.createdAt) {
					const duration =
						new Date(job.completedAt).getTime() -
						new Date(job.createdAt).getTime();
					stat.avgDurationMs =
						stat.avgDurationMs === null
							? duration
							: Math.round(
									(stat.avgDurationMs * (stat.completed - 1) +
										duration) /
										stat.completed,
								);
				}
			} else if (job.status === "FAILED") {
				stat.failed++;
			}

			// Estimate credits: use creditCost from registry if available
			const toolConfig = config.tools.registry.find(
				(t) => t.slug === job.toolSlug,
			);
			if (job.status === "COMPLETED" && toolConfig?.creditCost) {
				stat.creditsUsed += toolConfig.creditCost;
			}
		}

		// Compute success rates
		for (const stat of Array.from(statsMap.values())) {
			const finished = stat.completed + stat.failed;
			stat.successRate =
				finished > 0
					? Math.round((stat.completed / finished) * 100)
					: 0;
		}

		return Array.from(statsMap.values()).sort(
			(a, b) => b.totalRuns - a.totalRuns,
		);
	}, [allJobs]);

	if (isLoading) {
		return (
			<Card className={className}>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-base font-medium">
						<BarChart3Icon className="size-4 text-muted-foreground" />
						Tool Insights
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<Skeleton
								key={i}
								className="h-10 w-full rounded-md"
							/>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	if (toolStats.length === 0) {
		return (
			<Card className={className}>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-base font-medium">
						<BarChart3Icon className="size-4 text-muted-foreground" />
						Tool Insights
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						No tool usage yet.{" "}
						<Link
							href="/app/tools"
							className="text-primary underline"
						>
							Browse tools
						</Link>{" "}
						to get started.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-base font-medium">
					<BarChart3Icon className="size-4 text-muted-foreground" />
					Tool Insights
				</CardTitle>
			</CardHeader>
			<CardContent className="px-0">
				<div className="overflow-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/40">
								<th className="text-left px-4 py-2 font-medium text-muted-foreground">
									Tool
								</th>
								<th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
									<span className="flex items-center justify-end gap-1">
										<CheckCircleIcon className="size-3" />
										Runs
									</span>
								</th>
								<th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
									<span className="flex items-center justify-end gap-1">
										<XCircleIcon className="size-3" />
										Success
									</span>
								</th>
								<th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
									<span className="flex items-center justify-end gap-1">
										<CreditCardIcon className="size-3" />
										Credits
									</span>
								</th>
								<th className="text-right px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">
									<span className="flex items-center justify-end gap-1">
										<ClockIcon className="size-3" />
										Avg Time
									</span>
								</th>
							</tr>
						</thead>
						<tbody>
							{toolStats.map((stat) => (
								<tr
									key={stat.slug}
									className="border-b last:border-0 hover:bg-muted/25 transition-colors"
								>
									<td className="px-4 py-2.5">
										<Link
											href={`/app/tools/${stat.slug}`}
											className="font-medium hover:underline text-foreground"
										>
											{stat.name}
										</Link>
									</td>
									<td className="px-3 py-2.5 text-right tabular-nums">
										{stat.totalRuns}
									</td>
									<td className="px-3 py-2.5 text-right">
										<span
											className={
												stat.successRate >= 80
													? "text-xs inline-flex items-center rounded px-1.5 py-0.5 font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
													: stat.successRate >= 50
														? "text-xs inline-flex items-center rounded px-1.5 py-0.5 font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
														: "text-xs inline-flex items-center rounded px-1.5 py-0.5 font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
											}
										>
											{stat.successRate}%
										</span>
									</td>
									<td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
										{stat.creditsUsed > 0
											? stat.creditsUsed.toLocaleString()
											: "—"}
									</td>
									<td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
										{stat.avgDurationMs !== null
											? formatDuration(stat.avgDurationMs)
											: "—"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
}
