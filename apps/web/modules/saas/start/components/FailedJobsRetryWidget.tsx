"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { config } from "@repo/config";
import { orpcClient } from "@shared/lib/orpc-client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { cn } from "@ui/lib";
import { AlertCircleIcon, ChevronRightIcon, RefreshCwIcon } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";
import { useRecentJobs } from "../hooks/use-recent-jobs";

function getToolName(toolSlug: string): string {
	const tool = config.tools.registry.find((t) => t.slug === toolSlug);
	return tool?.name ?? toolSlug;
}

function getToolPath(toolSlug: string): string {
	return `/app/tools/${toolSlug}`;
}

function formatTimeAgo(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const minutes = Math.floor(diff / 60_000);
	if (minutes < 60) { return `${minutes}m ago`; }
	const hours = Math.floor(minutes / 60);
	if (hours < 24) { return `${hours}h ago`; }
	return `${Math.floor(hours / 24)}d ago`;
}

interface FailedJobRowProps {
	jobId: string;
	toolSlug: string;
	failedAt: string;
	onRetry: (toolSlug: string) => void;
	retrying: boolean;
}

function FailedJobRow({
	jobId,
	toolSlug,
	failedAt,
	onRetry,
	retrying,
}: FailedJobRowProps) {
	const toolName = getToolName(toolSlug);
	const toolPath = getToolPath(toolSlug);

	return (
		<div className="flex items-center gap-3 py-2">
			<AlertCircleIcon className="size-4 text-destructive shrink-0" />
			<div className="flex-1 min-w-0">
				<Link
					href={`/app/jobs/${jobId}`}
					className="text-sm font-medium truncate hover:underline block"
				>
					{toolName}
				</Link>
				<p className="text-xs text-muted-foreground">
					{formatTimeAgo(failedAt)}
				</p>
			</div>
			<Button
				variant="outline"
				size="sm"
				className="shrink-0 h-7 px-2 text-xs"
				onClick={() => onRetry(toolSlug)}
				disabled={retrying}
				asChild={!retrying}
			>
				{retrying ? (
					<>
						<RefreshCwIcon className="size-3 mr-1 animate-spin" />
						Retrying…
					</>
				) : (
					<Link href={toolPath}>
						<RefreshCwIcon className="size-3 mr-1" />
						Retry
					</Link>
				)}
			</Button>
		</div>
	);
}

interface FailedJobsRetryWidgetProps {
	className?: string;
	maxJobs?: number;
}

export function FailedJobsRetryWidget({
	className,
	maxJobs = 5,
}: FailedJobsRetryWidgetProps) {
	const { jobs, isLoading } = useRecentJobs(50);
	const queryClient = useQueryClient();
	const [retryingJob, setRetryingJob] = useState<string | null>(null);
	const { track } = useProductAnalytics();

	const failedJobs = jobs
		.filter((j) => j.status === "FAILED")
		.slice(0, maxJobs);

	if (isLoading || failedJobs.length === 0) {
		return null;
	}

	async function handleRetry(toolSlug: string) {
		setRetryingJob(toolSlug);
		track({
			name: "failed_job_retry_clicked",
			props: { tool_slug: toolSlug },
		});
		try {
			await orpcClient.jobs.create({
				toolSlug,
				input: {},
			});
			toast.success("Job queued", {
				description: `${getToolName(toolSlug)} will run shortly.`,
			});
			queryClient.invalidateQueries({ queryKey: ["jobs"] });
		} catch {
			toast.error("Failed to queue job", {
				description: "Please try again from the tool page.",
			});
		} finally {
			setRetryingJob(null);
		}
	}

	return (
		<Card className={cn("border-destructive/20", className)}>
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-base">
					<AlertCircleIcon className="size-4 text-destructive" />
					Failed Jobs
				</CardTitle>
				<CardDescription>
					{failedJobs.length === 1
						? "1 job needs attention"
						: `${failedJobs.length} jobs need attention`}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="divide-y">
					{failedJobs.map((job) => (
						<FailedJobRow
							key={job.id}
							jobId={job.id}
							toolSlug={job.toolSlug}
							failedAt={job.completedAt ?? job.createdAt}
							onRetry={handleRetry}
							retrying={retryingJob === job.toolSlug}
						/>
					))}
				</div>
				<div className="pt-2">
					<Button
						variant="ghost"
						size="sm"
						className="w-full text-muted-foreground hover:text-foreground"
						asChild
					>
						<Link href="/app/jobs?status=FAILED">
							View all failed jobs
							<ChevronRightIcon className="size-4 ml-auto" />
						</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
