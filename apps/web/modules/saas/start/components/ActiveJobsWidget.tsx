"use client";

import { config } from "@repo/config";
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
	CheckCircle2Icon,
	ChevronRightIcon,
	ClockIcon,
	ExternalLinkIcon,
	Loader2Icon,
	ZapIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import type { Job } from "../hooks/use-recent-jobs";
import { useRecentJobs } from "../hooks/use-recent-jobs";

const ACTIVE_STATUSES = new Set(["PENDING", "PROCESSING"]);
const RECENT_TERMINAL_STATUSES = new Set(["COMPLETED", "FAILED"]);

// How long to show recently completed jobs (5 minutes)
const RECENT_COMPLETED_THRESHOLD_MS = 5 * 60 * 1000;

function getToolName(toolSlug: string): string {
	const tool = config.tools.registry.find((t) => t.slug === toolSlug);
	return tool?.name ?? toolSlug;
}

function getJobDetailUrl(toolSlug: string, jobId: string): string | null {
	const detailRouteTools: Record<string, string> = {
		"news-analyzer": `/app/tools/news-analyzer/${jobId}`,
		"speaker-separation": `/app/tools/speaker-separation/${jobId}`,
	};
	return detailRouteTools[toolSlug] ?? null;
}

function isRecentlyCompleted(job: Job): boolean {
	if (!RECENT_TERMINAL_STATUSES.has(job.status)) {
		return false;
	}
	const completedAt = job.completedAt ? new Date(job.completedAt) : null;
	if (!completedAt) {
		return false;
	}
	return Date.now() - completedAt.getTime() < RECENT_COMPLETED_THRESHOLD_MS;
}

function JobStatusIcon({ status }: { status: Job["status"] }) {
	switch (status) {
		case "PROCESSING":
			return (
				<Loader2Icon className="size-4 animate-spin text-blue-500" />
			);
		case "PENDING":
			return <ClockIcon className="size-4 text-amber-500" />;
		case "COMPLETED":
			return <CheckCircle2Icon className="size-4 text-green-500" />;
		case "FAILED":
			return <AlertCircleIcon className="size-4 text-destructive" />;
		default:
			return null;
	}
}

function JobStatusText({ status }: { status: Job["status"] }) {
	switch (status) {
		case "PROCESSING":
			return (
				<span className="text-xs font-medium text-blue-600 dark:text-blue-400">
					Running
				</span>
			);
		case "PENDING":
			return (
				<span className="text-xs font-medium text-amber-600 dark:text-amber-400">
					Queued
				</span>
			);
		case "COMPLETED":
			return (
				<span className="text-xs font-medium text-green-600 dark:text-green-400">
					Done
				</span>
			);
		case "FAILED":
			return (
				<span className="text-xs font-medium text-destructive">
					Failed
				</span>
			);
		default:
			return null;
	}
}

function ActiveJobRow({ job }: { job: Job }) {
	const toolName = getToolName(job.toolSlug);
	const detailUrl = getJobDetailUrl(job.toolSlug, job.id);
	const isActive = ACTIVE_STATUSES.has(job.status);
	const isCompleted = job.status === "COMPLETED";

	return (
		<div className="flex items-center gap-3 py-2">
			<JobStatusIcon status={job.status} />
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium truncate">
						{toolName}
					</span>
					<JobStatusText status={job.status} />
				</div>
				{isActive && (
					<p className="text-xs text-muted-foreground mt-0.5">
						{job.status === "PROCESSING"
							? "Processing your request…"
							: "Waiting to start…"}
					</p>
				)}
			</div>
			{isCompleted && detailUrl && (
				<Button
					variant="ghost"
					size="sm"
					className="shrink-0 h-7 px-2"
					asChild
				>
					<Link href={detailUrl}>
						<ExternalLinkIcon className="size-3 mr-1" />
						View
					</Link>
				</Button>
			)}
		</div>
	);
}

interface ActiveJobsWidgetProps {
	className?: string;
}

export function ActiveJobsWidget({ className }: ActiveJobsWidgetProps) {
	const { jobs, isLoading } = useRecentJobs(20);
	const [, setTick] = useState(0);

	// Re-render every 30s so "recently completed" threshold stays accurate
	useEffect(() => {
		const interval = setInterval(() => setTick((t) => t + 1), 30_000);
		return () => clearInterval(interval);
	}, []);

	const activeJobs = jobs.filter(
		(j) => ACTIVE_STATUSES.has(j.status) || isRecentlyCompleted(j),
	);

	if (isLoading) {
		return (
			<Card className={cn("animate-pulse", className)}>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2">
						<ZapIcon className="size-4" />
						Active Jobs
					</CardTitle>
					<CardDescription>Loading…</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<Skeleton className="h-8 w-full" />
					<Skeleton className="h-8 w-full" />
				</CardContent>
			</Card>
		);
	}

	if (!activeJobs.length) {
		return null; // Nothing to show — don't clutter the dashboard
	}

	const hasActive = activeJobs.some((j) => ACTIVE_STATUSES.has(j.status));

	return (
		<Card className={cn("border-primary/20", className)}>
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-base">
					<ZapIcon className="size-4 text-primary" />
					Active Jobs
					{hasActive && (
						<span className="ml-auto flex h-2 w-2">
							<span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75" />
							<span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
						</span>
					)}
				</CardTitle>
				<CardDescription>
					In-progress and recently completed
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="divide-y">
					{activeJobs.map((job) => (
						<ActiveJobRow key={job.id} job={job} />
					))}
				</div>
				<div className="pt-2">
					<Button
						variant="ghost"
						size="sm"
						className="w-full text-muted-foreground hover:text-foreground"
						asChild
					>
						<Link href="/app/jobs">
							All jobs
							<ChevronRightIcon className="size-4 ml-auto" />
						</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
