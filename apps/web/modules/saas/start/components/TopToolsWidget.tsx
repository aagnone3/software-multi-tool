"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { useTools } from "@saas/tools/hooks/use-tools";
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
	AlertCircleIcon,
	BarChart3Icon,
	ChevronRightIcon,
	WrenchIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useMemo } from "react";
import { useRecentJobs } from "../hooks/use-recent-jobs";

interface TopToolEntry {
	slug: string;
	name: string;
	count: number;
	percentage: number;
}

interface TopToolsWidgetProps {
	className?: string;
	maxTools?: number;
}

export function TopToolsWidget({
	className,
	maxTools = 5,
}: TopToolsWidgetProps) {
	const { jobs, isLoading, isError } = useRecentJobs(50);
	const { enabledTools } = useTools();
	const { track } = useProductAnalytics();

	const handleToolClick = useCallback(
		(tool: TopToolEntry, rank: number) => {
			track({
				name: "dashboard_top_tool_clicked",
				props: { tool_slug: tool.slug, tool_name: tool.name, rank },
			});
		},
		[track],
	);

	const topTools = useMemo<TopToolEntry[]>(() => {
		if (!jobs.length) {
			return [];
		}

		// Count jobs per tool slug
		const countMap = new Map<string, number>();
		for (const job of jobs) {
			countMap.set(job.toolSlug, (countMap.get(job.toolSlug) ?? 0) + 1);
		}

		const total = jobs.length;

		return Array.from(countMap.entries())
			.sort(([, a], [, b]) => b - a)
			.slice(0, maxTools)
			.map(([slug, count]) => {
				const toolConfig = enabledTools.find((t) => t.slug === slug);
				return {
					slug,
					name: toolConfig?.name ?? slug,
					count,
					percentage: Math.round((count / total) * 100),
				};
			});
	}, [jobs, enabledTools, maxTools]);

	if (isError) {
		return (
			<Card className={className}>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2">
						<BarChart3Icon className="size-5" />
						Top Tools
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-6 text-center">
						<AlertCircleIcon className="size-8 text-destructive/60 mb-2" />
						<p className="text-sm text-muted-foreground">
							Failed to load usage data
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (isLoading) {
		return (
			<Card className={cn("animate-pulse", className)}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart3Icon className="size-5" />
						Top Tools
					</CardTitle>
					<CardDescription>Loading...</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-8 w-full" />
					))}
				</CardContent>
			</Card>
		);
	}

	if (!topTools.length) {
		return (
			<Card className={className}>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2">
						<BarChart3Icon className="size-5" />
						Top Tools
					</CardTitle>
					<CardDescription>Your most-used tools</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-6 text-center">
						<WrenchIcon className="size-10 text-muted-foreground/40 mb-3" />
						<p className="text-sm font-medium">No usage yet</p>
						<p className="text-xs text-muted-foreground mt-1">
							Run a tool to see your activity here
						</p>
						<Button
							variant="outline"
							size="sm"
							className="mt-3"
							asChild
						>
							<Link href="/app/tools">
								Browse tools
								<ChevronRightIcon className="size-4 ml-1" />
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2">
					<BarChart3Icon className="size-5" />
					Top Tools
				</CardTitle>
				<CardDescription>Your most-used tools</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				{topTools.map((tool, index) => (
					<Link
						key={tool.slug}
						href={`/app/tools/${tool.slug}`}
						className="block group"
						onClick={() => handleToolClick(tool, index + 1)}
					>
						<div className="flex items-center justify-between mb-1">
							<span className="text-sm font-medium group-hover:text-primary transition-colors truncate">
								{tool.name}
							</span>
							<span className="text-xs text-muted-foreground ml-2 shrink-0">
								{tool.count} run{tool.count !== 1 ? "s" : ""}
							</span>
						</div>
						<div className="h-1.5 rounded-full bg-muted overflow-hidden">
							<div
								className="h-full rounded-full bg-primary/60 group-hover:bg-primary transition-colors"
								style={{ width: `${tool.percentage}%` }}
							/>
						</div>
					</Link>
				))}

				<div className="pt-1">
					<Button
						variant="ghost"
						size="sm"
						className="w-full text-muted-foreground hover:text-foreground"
						asChild
					>
						<Link href="/app/jobs">
							View all jobs
							<ChevronRightIcon className="size-4 ml-auto" />
						</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
