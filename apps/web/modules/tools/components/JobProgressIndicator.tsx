"use client";

import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Progress } from "@ui/components/progress";
import { cn } from "@ui/lib";
import {
	AlertCircleIcon,
	CheckCircle2Icon,
	CircleIcon,
	Loader2Icon,
	XCircleIcon,
} from "lucide-react";
import { useCancelJob } from "../hooks/use-job-polling";
import { useJobUpdates } from "../hooks/use-job-updates";

type JobStatus =
	| "PENDING"
	| "PROCESSING"
	| "COMPLETED"
	| "FAILED"
	| "CANCELLED";

interface StatusConfig {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	color: string;
	progress?: number;
}

const STATUS_CONFIG: Record<JobStatus, StatusConfig> = {
	PENDING: {
		icon: CircleIcon,
		label: "Queued",
		color: "text-muted-foreground",
		progress: 10,
	},
	PROCESSING: {
		icon: Loader2Icon,
		label: "Processing",
		color: "text-blue-500",
		progress: 50,
	},
	COMPLETED: {
		icon: CheckCircle2Icon,
		label: "Completed",
		color: "text-green-500",
		progress: 100,
	},
	FAILED: {
		icon: AlertCircleIcon,
		label: "Failed",
		color: "text-destructive",
		progress: 100,
	},
	CANCELLED: {
		icon: XCircleIcon,
		label: "Cancelled",
		color: "text-muted-foreground",
		progress: 100,
	},
};

interface JobProgressIndicatorProps {
	jobId: string;
	title?: string;
	description?: string;
	onComplete?: (output: Record<string, unknown>) => void;
	onError?: (error: string) => void;
	showCancel?: boolean;
	className?: string;
}

export function JobProgressIndicator({
	jobId,
	title = "Processing",
	description,
	onComplete,
	onError,
	showCancel = true,
	className,
}: JobProgressIndicatorProps) {
	const { job, error } = useJobUpdates(jobId);
	const cancelMutation = useCancelJob();

	const status = (job?.status ?? "PENDING") as JobStatus;
	const config = STATUS_CONFIG[status];
	const Icon = config.icon;

	// Call callbacks when status changes
	if (job?.status === "COMPLETED" && job.output && onComplete) {
		onComplete(job.output as Record<string, unknown>);
	}
	if (job?.status === "FAILED" && job.error && onError) {
		onError(job.error);
	}

	const handleCancel = () => {
		if (job?.status === "PENDING") {
			cancelMutation.mutate({ jobId });
		}
	};

	if (error) {
		return (
			<Card className={cn("w-full", className)}>
				<CardHeader>
					<div className="flex items-center gap-2">
						<AlertCircleIcon className="size-5 text-destructive" />
						<CardTitle>Error</CardTitle>
					</div>
					<CardDescription>Failed to load job status</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<Card className={cn("w-full", className)}>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Icon
							className={cn(
								"size-5",
								config.color,
								status === "PROCESSING" && "animate-spin",
							)}
						/>
						<CardTitle className="text-lg">{title}</CardTitle>
					</div>
					<span
						className={cn(
							"rounded-full px-2 py-1 text-xs font-medium",
							status === "PENDING" &&
								"bg-muted text-muted-foreground",
							status === "PROCESSING" &&
								"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
							status === "COMPLETED" &&
								"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
							status === "FAILED" &&
								"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
							status === "CANCELLED" &&
								"bg-muted text-muted-foreground",
						)}
					>
						{config.label}
					</span>
				</div>
				{description && (
					<CardDescription>{description}</CardDescription>
				)}
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<Progress
						value={config.progress}
						className={cn(
							"h-2",
							status === "PROCESSING" && "animate-pulse",
						)}
					/>

					{job?.attempts !== undefined && job.attempts > 1 && (
						<p className="text-muted-foreground text-xs">
							Attempt {job.attempts} of {job.maxAttempts}
						</p>
					)}

					{job?.error && (
						<div className="rounded-md bg-destructive/10 p-3">
							<p className="text-destructive text-sm">
								{job.error}
							</p>
						</div>
					)}

					{showCancel && status === "PENDING" && (
						<div className="flex justify-end">
							<Button
								variant="outline"
								size="sm"
								onClick={handleCancel}
								disabled={cancelMutation.isPending}
							>
								{cancelMutation.isPending ? (
									<>
										<Loader2Icon className="mr-2 size-4 animate-spin" />
										Cancelling...
									</>
								) : (
									"Cancel"
								)}
							</Button>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

interface JobProgressInlineProps {
	jobId: string;
	className?: string;
}

export function JobProgressInline({
	jobId,
	className,
}: JobProgressInlineProps) {
	const { job } = useJobUpdates(jobId);

	const status = (job?.status ?? "PENDING") as JobStatus;
	const config = STATUS_CONFIG[status];
	const Icon = config.icon;

	return (
		<div className={cn("flex items-center gap-2", className)}>
			<Icon
				className={cn(
					"size-4",
					config.color,
					status === "PROCESSING" && "animate-spin",
				)}
			/>
			<span className={cn("text-sm", config.color)}>{config.label}</span>
		</div>
	);
}
