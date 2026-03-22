"use client";

import { useJobsList } from "@tools/hooks/use-job-polling";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import { cn } from "@ui/lib";
import {
	BarChart3Icon,
	CheckCircle2Icon,
	ClockIcon,
	PlayIcon,
} from "lucide-react";
import React, { useMemo } from "react";

interface ToolPersonalStatsProps {
	toolSlug: string;
	className?: string;
}

function formatTimeAgo(dateStr: string | Date): string {
	const now = Date.now();
	const then = new Date(dateStr).getTime();
	const diffMs = now - then;
	const diffMin = Math.floor(diffMs / 60000);
	if (diffMin < 1) return "Just now";
	if (diffMin < 60) return `${diffMin}m ago`;
	const diffHr = Math.floor(diffMin / 60);
	if (diffHr < 24) return `${diffHr}h ago`;
	const diffDays = Math.floor(diffHr / 24);
	return `${diffDays}d ago`;
}

export function ToolPersonalStats({
	toolSlug,
	className,
}: ToolPersonalStatsProps) {
	const { jobs, isLoading } = useJobsList(toolSlug);

	const stats = useMemo(() => {
		if (!jobs.length) return null;
		const total = jobs.length;
		const completed = jobs.filter((j) => j.status === "COMPLETED").length;
		const successRate = Math.round((completed / total) * 100);
		const sorted = [...jobs].sort(
			(a, b) =>
				new Date(b.createdAt).getTime() -
				new Date(a.createdAt).getTime(),
		);
		const lastUsed = sorted[0]?.createdAt ?? null;
		return { total, successRate, lastUsed };
	}, [jobs]);

	if (isLoading) {
		return (
			<Card className={cn("", className)}>
				<CardHeader className="pb-3">
					<Skeleton className="h-4 w-28" />
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-3 gap-3">
						<Skeleton className="h-12" />
						<Skeleton className="h-12" />
						<Skeleton className="h-12" />
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!stats) return null;

	return (
		<Card className={cn("", className)}>
			<CardHeader className="pb-3">
				<CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
					<BarChart3Icon className="size-4" />
					Your Usage
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="grid grid-cols-3 gap-3">
					<div className="flex flex-col items-center rounded-lg bg-muted/50 p-3 text-center">
						<PlayIcon className="size-4 mb-1 text-primary" />
						<span className="text-lg font-bold">{stats.total}</span>
						<span className="text-xs text-muted-foreground">
							{stats.total === 1 ? "Run" : "Runs"}
						</span>
					</div>
					<div className="flex flex-col items-center rounded-lg bg-muted/50 p-3 text-center">
						<CheckCircle2Icon className="size-4 mb-1 text-green-500" />
						<span className="text-lg font-bold">
							{stats.successRate}%
						</span>
						<span className="text-xs text-muted-foreground">
							Success
						</span>
					</div>
					<div className="flex flex-col items-center rounded-lg bg-muted/50 p-3 text-center">
						<ClockIcon className="size-4 mb-1 text-muted-foreground" />
						<span className="text-sm font-medium leading-tight mt-0.5">
							{stats.lastUsed
								? formatTimeAgo(stats.lastUsed)
								: "—"}
						</span>
						<span className="text-xs text-muted-foreground">
							Last Used
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
