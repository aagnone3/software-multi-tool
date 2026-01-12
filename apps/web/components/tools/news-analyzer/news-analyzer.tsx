"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { useMutation } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@ui/components/alert";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
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

export function NewsAnalyzer() {
	const [jobId, setJobId] = useState<string | null>(null);
	const [result, setResult] = useState<NewsAnalysisOutput | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pollingIntervalId, setPollingIntervalId] =
		useState<NodeJS.Timeout | null>(null);

	// Create job mutation
	const createJobMutation = useMutation({
		mutationFn: async (input: {
			articleUrl?: string;
			articleText?: string;
		}) => {
			const sessionId = getOrCreateSessionId();

			console.log("[NewsAnalyzer] Creating job", {
				sessionId,
				hasUrl: !!input.articleUrl,
				hasText: !!input.articleText,
				urlLength: input.articleUrl?.length,
				textLength: input.articleText?.length,
			});

			const response = await orpcClient.jobs.create({
				toolSlug: "news-analyzer",
				input,
				sessionId,
			});

			console.log("[NewsAnalyzer] Job created", {
				jobId: response.job.id,
				status: response.job.status,
				hasOutput: !!response.job.output,
				hasError: !!response.job.error,
			});

			return response as CreateJobResponse;
		},
		onSuccess: (data) => {
			const job = data.job;

			console.log("[NewsAnalyzer] Job creation successful", {
				jobId: job.id,
				status: job.status,
				hasOutput: !!job.output,
				error: job.error,
			});

			// If job is already completed (from cache), show results immediately
			if (job.status === "COMPLETED" && job.output) {
				console.log(
					"[NewsAnalyzer] Showing cached results immediately",
				);
				setResult(job.output as unknown as NewsAnalysisOutput);
				setError(null);
			} else if (job.status === "FAILED") {
				console.error(
					"[NewsAnalyzer] Job failed immediately",
					job.error,
				);
				setError(job.error ?? "Job failed");
			} else {
				console.log("[NewsAnalyzer] Starting polling for job", job.id);
				// Start polling for job completion
				setJobId(job.id);
				startPolling(job.id);
			}
		},
		onError: (err) => {
			console.error("[NewsAnalyzer] Job creation failed", err);
			setError(
				err instanceof Error
					? err.message
					: "Failed to create analysis job",
			);
		},
	});

	// Poll job status
	const pollJobStatus = async (id: string) => {
		try {
			console.log("[NewsAnalyzer] Polling job status", { jobId: id });
			const response = await orpcClient.jobs.get({ jobId: id });
			const job = response.job;

			console.log("[NewsAnalyzer] Job status received", {
				jobId: id,
				status: job.status,
				hasOutput: !!job.output,
				hasError: !!job.error,
			});

			if (job.status === "COMPLETED" && job.output) {
				console.log("[NewsAnalyzer] Job completed, showing results");
				setResult(job.output as unknown as NewsAnalysisOutput);
				setError(null);
				stopPolling();
			} else if (job.status === "FAILED") {
				console.error(
					"[NewsAnalyzer] Job failed during polling",
					job.error,
				);
				setError(job.error ?? "Analysis failed");
				stopPolling();
			}
			// Continue polling if PENDING or PROCESSING
		} catch (err) {
			console.error("[NewsAnalyzer] Polling error", err);
			setError(
				err instanceof Error
					? err.message
					: "Failed to check job status",
			);
			stopPolling();
		}
	};

	const startPolling = (id: string) => {
		// Poll every 2 seconds
		const intervalId = setInterval(() => {
			pollJobStatus(id);
		}, 2000);
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
