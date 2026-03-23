"use client";

import { useJobsList } from "@tools/hooks/use-job-polling";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import { cn } from "@ui/lib";
import {
	CheckCircle2Icon,
	ClockIcon,
	HistoryIcon,
	Loader2Icon,
	XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";

interface ToolRecentRunsProps {
	toolSlug: string;
	className?: string;
}

type JobStatus =
	| "PENDING"
	| "PROCESSING"
	| "COMPLETED"
	| "FAILED"
	| "CANCELLED";

function StatusIcon({ status }: { status: JobStatus }) {
	switch (status) {
		case "COMPLETED":
			return <CheckCircle2Icon className="size-4 text-green-500" />;
		case "FAILED":
		case "CANCELLED":
			return <XCircleIcon className="size-4 text-red-500" />;
		case "PROCESSING":
			return (
				<Loader2Icon className="size-4 text-blue-500 animate-spin" />
			);
		default:
			return <ClockIcon className="size-4 text-yellow-500" />;
	}
}

function StatusBadge({ status }: { status: JobStatus }) {
	const variants: Record<
		JobStatus,
		"success" | "error" | "info" | "warning"
	> = {
		COMPLETED: "success",
		FAILED: "error",
		CANCELLED: "error",
		PROCESSING: "info",
		PENDING: "warning",
	};
	const labels: Record<JobStatus, string> = {
		COMPLETED: "Completed",
		FAILED: "Failed",
		CANCELLED: "Cancelled",
		PROCESSING: "Processing",
		PENDING: "Pending",
	};
	return (
		<Badge status={variants[status]} className="text-xs">
			{labels[status]}
		</Badge>
	);
}

function formatRelativeTime(dateStr: string | Date): string {
	const ms = Date.now() - new Date(dateStr).getTime();
	const minutes = Math.floor(ms / 60000);
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

const DETAIL_ROUTES: Record<string, string> = {
	"news-analyzer": "/app/tools/news-analyzer",
	"speaker-separation": "/app/tools/speaker-separation",
};

export function ToolRecentRuns({ toolSlug, className }: ToolRecentRunsProps) {
	const { jobs, isLoading } = useJobsList(toolSlug, 3);

	if (isLoading) {
		return (
			<Card className={className}>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium flex items-center gap-2">
						<HistoryIcon className="size-4" />
						Recent Runs
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={`sk-${i}`} className="h-10 w-full" />
					))}
				</CardContent>
			</Card>
		);
	}

	if (!jobs || jobs.length === 0) {
		return null;
	}

	return (
		<Card className={cn(className)}>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm font-medium flex items-center gap-2">
						<HistoryIcon className="size-4" />
						Recent Runs
					</CardTitle>
					<Button
						variant="ghost"
						size="sm"
						className="h-7 text-xs"
						asChild
					>
						<Link href="/app/jobs">View all</Link>
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-2">
				{jobs.map((job) => {
					const status = job.status as JobStatus;
					const detailBase = DETAIL_ROUTES[toolSlug];
					const detailUrl =
						detailBase && status === "COMPLETED"
							? `${detailBase}/${job.id}`
							: null;

					return (
						<div
							key={job.id}
							className="flex items-center gap-3 rounded-lg border p-2.5"
						>
							<StatusIcon status={status} />
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<StatusBadge status={status} />
									<span className="text-xs text-muted-foreground">
										{formatRelativeTime(job.createdAt)}
									</span>
								</div>
							</div>
							{detailUrl && (
								<Button
									variant="outline"
									size="sm"
									className="h-7 text-xs shrink-0"
									asChild
								>
									<Link href={detailUrl}>View</Link>
								</Button>
							)}
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}
