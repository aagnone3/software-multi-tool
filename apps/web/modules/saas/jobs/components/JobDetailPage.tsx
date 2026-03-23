"use client";

import { config } from "@repo/config";
import { useJobPolling } from "@tools/hooks/use-job-polling";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import {
	AlertCircleIcon,
	ArrowLeftIcon,
	CheckCircle2Icon,
	ClockIcon,
	CopyIcon,
	Loader2Icon,
	Share2Icon,
	WrenchIcon,
	XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";

type JobStatus =
	| "PENDING"
	| "PROCESSING"
	| "COMPLETED"
	| "FAILED"
	| "CANCELLED";

const STATUS_CONFIG: Record<
	JobStatus,
	{ label: string; variant: "success" | "error" | "warning" | "info" }
> = {
	PENDING: { label: "Pending", variant: "warning" },
	PROCESSING: { label: "Processing", variant: "info" },
	COMPLETED: { label: "Completed", variant: "success" },
	FAILED: { label: "Failed", variant: "error" },
	CANCELLED: { label: "Cancelled", variant: "warning" },
};

const STATUS_ICONS: Record<
	JobStatus,
	React.ComponentType<{ className?: string }>
> = {
	PENDING: ClockIcon,
	PROCESSING: Loader2Icon,
	COMPLETED: CheckCircle2Icon,
	FAILED: XCircleIcon,
	CANCELLED: AlertCircleIcon,
};

function getToolName(toolSlug: string): string {
	const tool = config.tools.registry.find((t) => t.slug === toolSlug);
	return tool?.name ?? toolSlug;
}

function formatDateTime(dateString: string | Date): string {
	const date = new Date(dateString);
	return date.toLocaleString([], {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function formatDuration(
	startStr: string | Date,
	endStr: string | Date,
): string {
	const start = new Date(startStr).getTime();
	const end = new Date(endStr).getTime();
	const secs = Math.round((end - start) / 1000);
	if (secs < 60) {
		return `${secs}s`;
	}
	const mins = Math.floor(secs / 60);
	const rem = secs % 60;
	return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
}

function StatusBadge({ status }: { status: JobStatus }) {
	const statusConfig = STATUS_CONFIG[status];
	const Icon = STATUS_ICONS[status];
	const isAnimated = status === "PROCESSING" || status === "PENDING";

	return (
		<Badge
			status={statusConfig.variant}
			className={isAnimated ? "motion-safe:animate-pulse" : ""}
		>
			<Icon
				className={`size-3 mr-1 ${status === "PROCESSING" ? "animate-spin" : ""}`}
			/>
			{statusConfig.label}
		</Badge>
	);
}

function OutputViewer({ output }: { output: unknown }) {
	const [copied, setCopied] = useState(false);

	const outputText = (() => {
		try {
			return JSON.stringify(output, null, 2);
		} catch {
			return String(output);
		}
	})();

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(outputText);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Failed to copy to clipboard");
		}
	};

	return (
		<div className="relative">
			<Button
				variant="ghost"
				size="sm"
				className="absolute top-2 right-2 z-10"
				onClick={handleCopy}
				aria-label="Copy output"
			>
				<CopyIcon className="size-3 mr-1" />
				{copied ? "Copied!" : "Copy"}
			</Button>
			<pre className="bg-muted rounded-lg p-4 pt-10 text-xs overflow-auto max-h-96 text-foreground font-mono">
				{outputText}
			</pre>
		</div>
	);
}

export function JobDetailPage({ jobId }: { jobId: string }) {
	const { job, isLoading } = useJobPolling(jobId);
	const [shared, setShared] = useState(false);

	const handleShare = async () => {
		try {
			const url = window.location.href;
			await navigator.clipboard.writeText(url);
			setShared(true);
			toast.success("Job link copied to clipboard");
			setTimeout(() => setShared(false), 2000);
		} catch {
			toast.error("Failed to copy link");
		}
	};

	if (isLoading) {
		return (
			<div className="max-w-3xl space-y-6">
				<div className="flex items-center gap-2">
					<Skeleton className="size-8 rounded-full" />
					<Skeleton className="h-8 w-48" />
				</div>
				<Skeleton className="h-40 w-full rounded-lg" />
				<Skeleton className="h-64 w-full rounded-lg" />
			</div>
		);
	}

	if (!job) {
		return (
			<div className="max-w-3xl">
				<Card>
					<CardContent className="flex flex-col items-center py-12 text-center">
						<AlertCircleIcon className="size-12 text-muted-foreground mb-4" />
						<h3 className="font-semibold text-lg">Job not found</h3>
						<p className="text-muted-foreground mt-1">
							This job may have been deleted or you don&apos;t
							have access.
						</p>
						<Button className="mt-4" asChild>
							<Link href="/app/jobs">Back to Job History</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	const toolName = getToolName(job.toolSlug);
	const status = job.status as JobStatus;
	const isComplete =
		status === "COMPLETED" || status === "FAILED" || status === "CANCELLED";

	return (
		<div className="max-w-3xl space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="sm" asChild>
					<Link href="/app/jobs">
						<ArrowLeftIcon className="size-4 mr-1" />
						Back
					</Link>
				</Button>
				<div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<WrenchIcon className="size-4" />
				</div>
				<div className="flex-1">
					<h1 className="text-xl font-semibold">{toolName}</h1>
					<p className="text-sm text-muted-foreground">
						Job ID: {job.id}
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={handleShare}
					aria-label="Share job link"
				>
					<Share2Icon className="size-4 mr-1" />
					{shared ? "Copied!" : "Share"}
				</Button>
			</div>

			{/* Status Card */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Status</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">
							Current Status
						</span>
						<StatusBadge status={status} />
					</div>
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">
							Created
						</span>
						<span className="text-sm">
							{formatDateTime(job.createdAt)}
						</span>
					</div>
					{job.completedAt && (
						<>
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">
									Completed
								</span>
								<span className="text-sm">
									{formatDateTime(job.completedAt)}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">
									Duration
								</span>
								<span className="text-sm">
									{formatDuration(
										job.createdAt,
										job.completedAt,
									)}
								</span>
							</div>
						</>
					)}
					{!isComplete && (
						<div className="pt-2">
							<p className="text-xs text-muted-foreground">
								This page auto-refreshes while the job is
								running.
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Output Card */}
			{job.output && (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-base">Output</CardTitle>
						<CardDescription>
							Raw JSON output from the job
						</CardDescription>
					</CardHeader>
					<CardContent>
						<OutputViewer output={job.output} />
					</CardContent>
				</Card>
			)}

			{/* Error Card */}
			{status === "FAILED" && !job.output && (
				<Card className="border-destructive/50">
					<CardHeader className="pb-3">
						<CardTitle className="text-base text-destructive">
							Job Failed
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							This job encountered an error. You can try running
							it again from the tool page.
						</p>
						<Button className="mt-3" asChild>
							<Link href={`/app/tools/${job.toolSlug}`}>
								Run Again
							</Link>
						</Button>
					</CardContent>
				</Card>
			)}

			{/* Actions */}
			<div className="flex gap-2">
				<Button variant="outline" asChild>
					<Link href={`/app/tools/${job.toolSlug}`}>
						Run {toolName} Again
					</Link>
				</Button>
				<Button variant="ghost" asChild>
					<Link href="/app/jobs">View All Jobs</Link>
				</Button>
			</div>
		</div>
	);
}
