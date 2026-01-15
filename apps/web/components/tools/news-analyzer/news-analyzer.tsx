"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { useMutation } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@ui/components/alert";
import { AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToolAnalytics } from "../../../modules/tools/analytics";
import { NewsAnalyzerForm } from "./news-analyzer-form";
import {
	type NewsAnalysisOutput,
	NewsAnalyzerResults,
} from "./news-analyzer-results";

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

export function NewsAnalyzer() {
	const [jobId, setJobId] = useState<string | null>(null);
	const [result, setResult] = useState<NewsAnalysisOutput | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pollingIntervalId, setPollingIntervalId] =
		useState<NodeJS.Timeout | null>(null);
	const pollRetryCount = useRef(0);
	const pollStartTime = useRef<number | null>(null);

	// Analytics tracking
	const {
		trackToolViewed,
		trackProcessingStarted,
		trackProcessingCompleted,
		trackProcessingFailed,
	} = useToolAnalytics({ toolName: "news-analyzer" });
	const processingStartTime = useRef<number | null>(null);

	// Track page view on mount
	useEffect(() => {
		trackToolViewed();
	}, [trackToolViewed]);

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

			// If job is already completed (from cache), show results immediately
			if (job.status === "COMPLETED" && job.output) {
				setResult(job.output as unknown as NewsAnalysisOutput);
				setError(null);

				// Track completion from cache
				const duration = processingStartTime.current
					? Date.now() - processingStartTime.current
					: 0;
				trackProcessingCompleted({
					jobId: job.id,
					processingDurationMs: duration,
					fromCache: true,
				});
				processingStartTime.current = null;
			} else if (job.status === "FAILED") {
				setError(job.error ?? "Job failed");

				// Track failure
				const duration = processingStartTime.current
					? Date.now() - processingStartTime.current
					: 0;
				trackProcessingFailed({
					jobId: job.id,
					errorType: "job_failed",
					processingDurationMs: duration,
				});
				processingStartTime.current = null;
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

			// Track failure on job creation
			const duration = processingStartTime.current
				? Date.now() - processingStartTime.current
				: 0;
			trackProcessingFailed({
				jobId: "creation_failed",
				errorType: "job_creation_failed",
				processingDurationMs: duration,
			});
			processingStartTime.current = null;
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

			// Track timeout
			const duration = processingStartTime.current
				? Date.now() - processingStartTime.current
				: 0;
			trackProcessingFailed({
				jobId: id,
				errorType: "polling_timeout",
				processingDurationMs: duration,
			});
			processingStartTime.current = null;
			return;
		}

		try {
			const response = await orpcClient.jobs.get({ jobId: id });
			const job = response.job;

			// Reset retry count on successful poll
			pollRetryCount.current = 0;

			if (job.status === "COMPLETED" && job.output) {
				setResult(job.output as unknown as NewsAnalysisOutput);
				setError(null);
				stopPolling();

				// Track completion
				const duration = processingStartTime.current
					? Date.now() - processingStartTime.current
					: 0;
				trackProcessingCompleted({
					jobId: id,
					processingDurationMs: duration,
					fromCache: false,
				});
				processingStartTime.current = null;
			} else if (job.status === "FAILED") {
				setError(job.error ?? "Analysis failed");
				stopPolling();

				// Track failure
				const duration = processingStartTime.current
					? Date.now() - processingStartTime.current
					: 0;
				trackProcessingFailed({
					jobId: id,
					errorType: "job_failed",
					processingDurationMs: duration,
				});
				processingStartTime.current = null;
			} else if (job.status === "CANCELLED") {
				setError("Analysis was cancelled");
				stopPolling();

				// Track cancellation
				const duration = processingStartTime.current
					? Date.now() - processingStartTime.current
					: 0;
				trackProcessingFailed({
					jobId: id,
					errorType: "job_cancelled",
					processingDurationMs: duration,
				});
				processingStartTime.current = null;
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

				// Track polling error
				const duration = processingStartTime.current
					? Date.now() - processingStartTime.current
					: 0;
				trackProcessingFailed({
					jobId: id,
					errorType: "polling_error",
					processingDurationMs: duration,
				});
				processingStartTime.current = null;
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
			pollJobStatus(id);
		}, POLL_INTERVAL_MS);
		setPollingIntervalId(intervalId);

		// Also poll immediately
		pollJobStatus(id);
	};

	const stopPolling = () => {
		if (pollingIntervalId) {
			clearInterval(pollingIntervalId);
			setPollingIntervalId(null);
		}
	};

	const handleSubmit = (data: {
		articleUrl?: string;
		articleText?: string;
	}) => {
		setResult(null);
		setError(null);
		setJobId(null);

		// Track processing started (client-side timer)
		processingStartTime.current = Date.now();
		trackProcessingStarted({ jobId: "pending", fromCache: false });

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

			{jobId && !result && (
				<div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/50 p-8 text-center">
					<p className="text-muted-foreground">
						Analyzing article...
					</p>
					<p className="mt-2 text-sm text-muted-foreground">
						This may take 10-30 seconds
					</p>
				</div>
			)}

			{result && <NewsAnalyzerResults output={result} />}
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
