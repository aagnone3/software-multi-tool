"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { useMutation } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@ui/components/alert";
import { cn } from "@ui/lib";
import {
	AlertCircle,
	Brain,
	CheckCircle2,
	Download,
	FileSearch,
	Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NewsAnalyzerForm } from "./news-analyzer-form";
import type { NewsAnalysisOutput } from "./news-analyzer-results";

interface CreateJobResponse {
	job: {
		id: string;
		status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
		output: NewsAnalysisOutput | null;
		error: string | null;
	};
}

// Polling configuration
const POLL_INTERVAL_MS = 2000; // Poll every 2 seconds
const MAX_POLL_RETRIES = 3; // Number of consecutive failures before giving up
const MAX_POLL_DURATION_MS = 5 * 60 * 1000; // 5 minutes max polling duration

// Loading stages configuration
const LOADING_STAGES = [
	{
		icon: Download,
		label: "Fetching",
		description: "Retrieving article",
		durationMs: 2000,
	},
	{
		icon: FileSearch,
		label: "Extracting",
		description: "Parsing content",
		durationMs: 6000,
	},
	{
		icon: Brain,
		label: "Analyzing",
		description: "AI processing",
		durationMs: 7000,
	},
	{
		icon: Sparkles,
		label: "Complete",
		description: "Results ready",
		durationMs: 0,
	},
] as const;

function LoadingStages({ startTime }: { startTime: number }) {
	const [elapsedMs, setElapsedMs] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setElapsedMs(Date.now() - startTime);
		}, 100);
		return () => clearInterval(interval);
	}, [startTime]);

	// Calculate current stage based on elapsed time
	let cumulativeMs = 0;
	let currentStageIndex = 0;
	for (let i = 0; i < LOADING_STAGES.length - 1; i++) {
		cumulativeMs += LOADING_STAGES[i].durationMs;
		if (elapsedMs < cumulativeMs) {
			currentStageIndex = i;
			break;
		}
		currentStageIndex = i + 1;
	}
	// Cap at second-to-last stage (Analyzing) until completion
	currentStageIndex = Math.min(currentStageIndex, LOADING_STAGES.length - 2);

	return (
		<div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/50 p-8">
			{/* Horizontal stepper */}
			<div className="flex items-center justify-center gap-2 sm:gap-4">
				{LOADING_STAGES.map((stage, index) => {
					const isCompleted = index < currentStageIndex;
					const isActive = index === currentStageIndex;
					const isPending = index > currentStageIndex;
					const Icon = stage.icon;

					return (
						<div key={stage.label} className="flex items-center">
							{/* Stage indicator */}
							<div className="flex flex-col items-center">
								<div
									className={cn(
										"flex size-10 items-center justify-center rounded-full border-2 transition-all duration-300",
										isCompleted &&
											"border-green-500 bg-green-500/10",
										isActive &&
											"border-primary bg-primary/10 motion-safe:animate-pulse",
										isPending &&
											"border-muted-foreground/25 bg-muted",
									)}
								>
									{isCompleted ? (
										<CheckCircle2 className="size-5 text-green-500" />
									) : (
										<Icon
											className={cn(
												"size-5 transition-colors duration-300",
												isActive && "text-primary",
												isPending &&
													"text-muted-foreground/50",
											)}
										/>
									)}
								</div>
								<div className="mt-2 text-center">
									<p
										className={cn(
											"text-xs font-medium transition-colors duration-300",
											isCompleted && "text-green-500",
											isActive && "text-foreground",
											isPending &&
												"text-muted-foreground/50",
										)}
									>
										{stage.label}
									</p>
									<p
										className={cn(
											"text-xs transition-colors duration-300 hidden sm:block",
											isActive && "text-muted-foreground",
											(isCompleted || isPending) &&
												"text-muted-foreground/50",
										)}
									>
										{stage.description}
									</p>
								</div>
							</div>

							{/* Connector line */}
							{index < LOADING_STAGES.length - 1 && (
								<div
									className={cn(
										"mx-2 h-0.5 w-8 sm:w-12 transition-colors duration-300",
										isCompleted
											? "bg-green-500"
											: "bg-muted-foreground/25",
									)}
								/>
							)}
						</div>
					);
				})}
			</div>

			{/* Progress message */}
			<p className="mt-6 text-center text-sm text-muted-foreground">
				{LOADING_STAGES[currentStageIndex].description}...
			</p>
		</div>
	);
}

export function NewsAnalyzer() {
	const router = useRouter();
	const [jobId, setJobId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loadingStartTime, setLoadingStartTime] = useState<number | null>(
		null,
	);
	const [pollingIntervalId, setPollingIntervalId] =
		useState<NodeJS.Timeout | null>(null);
	const pollRetryCount = useRef(0);
	const pollStartTime = useRef<number | null>(null);
	const isMountedRef = useRef(true);
	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Cleanup on unmount
	useEffect(() => {
		isMountedRef.current = true;

		return () => {
			isMountedRef.current = false;
			// Stop any active polling on unmount
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
				pollingIntervalRef.current = null;
			}
		};
	}, []);

	// Create job mutation
	const createJobMutation = useMutation({
		mutationFn: async (input: {
			articleUrl?: string;
			articleText?: string;
		}) => {
			const sessionId = getOrCreateSessionId();

			const response = await orpcClient.jobs.create({
				toolSlug: "news-analyzer",
				input,
				sessionId,
			});

			return response as CreateJobResponse;
		},
		onSuccess: (data) => {
			const job = data.job;

			// If job is already completed (from cache), navigate to detail page
			if (job.status === "COMPLETED" && job.output) {
				// Navigate to detail page (only if still mounted)
				if (isMountedRef.current) {
					router.push(`/app/tools/news-analyzer/${job.id}`);
				}
			} else if (job.status === "FAILED") {
				setError(job.error ?? "Job failed");
			} else {
				// Start polling for job completion
				setJobId(job.id);
				startPolling(job.id);
			}
		},
		onError: (err) => {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Failed to create analysis job";
			setError(errorMessage);
		},
	});

	// Poll job status with retry logic for transient errors
	const pollJobStatus = async (id: string) => {
		// Check if we've exceeded the maximum polling duration
		if (
			pollStartTime.current &&
			Date.now() - pollStartTime.current > MAX_POLL_DURATION_MS
		) {
			setError(
				"Analysis is taking longer than expected. Please try again later.",
			);
			stopPolling();
			return;
		}

		try {
			const response = await orpcClient.jobs.get({ jobId: id });
			const job = response.job;

			// Reset retry count on successful poll
			pollRetryCount.current = 0;

			if (job.status === "COMPLETED" && job.output) {
				stopPolling();

				// Navigate to detail page (only if still mounted)
				if (isMountedRef.current) {
					router.push(`/app/tools/news-analyzer/${id}`);
				}
			} else if (job.status === "FAILED") {
				setError(job.error ?? "Analysis failed");
				stopPolling();
			} else if (job.status === "CANCELLED") {
				setError("Analysis was cancelled");
				stopPolling();
			}
			// Continue polling if PENDING or PROCESSING
		} catch (err) {
			// Increment retry count for transient errors
			pollRetryCount.current += 1;

			// Only give up after multiple consecutive failures
			if (pollRetryCount.current >= MAX_POLL_RETRIES) {
				setError(
					err instanceof Error
						? err.message
						: "Failed to check job status after multiple attempts",
				);
				stopPolling();
			}
			// Otherwise, silently continue polling - the error may be transient
		}
	};

	const startPolling = (id: string) => {
		// Reset retry count and start time
		pollRetryCount.current = 0;
		pollStartTime.current = Date.now();

		// Poll at configured interval
		const intervalId = setInterval(() => {
			// Don't poll if component is unmounted
			if (!isMountedRef.current) {
				clearInterval(intervalId);
				return;
			}
			pollJobStatus(id);
		}, POLL_INTERVAL_MS);
		setPollingIntervalId(intervalId);
		pollingIntervalRef.current = intervalId;

		// Also poll immediately
		pollJobStatus(id);
	};

	const stopPolling = () => {
		if (pollingIntervalId) {
			clearInterval(pollingIntervalId);
			setPollingIntervalId(null);
		}
		if (pollingIntervalRef.current) {
			clearInterval(pollingIntervalRef.current);
			pollingIntervalRef.current = null;
		}
		setLoadingStartTime(null);
	};

	const handleSubmit = (data: {
		articleUrl?: string;
		articleText?: string;
	}) => {
		setError(null);
		setJobId(null);
		setLoadingStartTime(Date.now());
		createJobMutation.mutate(data);
	};

	return (
		<div className="space-y-8">
			<NewsAnalyzerForm
				onSubmit={handleSubmit}
				isLoading={createJobMutation.isPending || jobId !== null}
			/>

			{error && (
				<Alert variant="error">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{jobId && loadingStartTime && (
				<LoadingStages startTime={loadingStartTime} />
			)}
		</div>
	);
}

// Helper function to get or create a session ID for anonymous users
function getOrCreateSessionId(): string {
	const key = "news-analyzer-session-id";
	let sessionId = localStorage.getItem(key);

	if (!sessionId) {
		// Generate a simple session ID
		sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
		localStorage.setItem(key, sessionId);
	}

	return sessionId;
}
