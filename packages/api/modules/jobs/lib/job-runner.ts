import {
	claimNextPendingJob,
	cleanupExpiredJobs,
	getJobsToRetry,
	markJobCompleted,
	markJobFailed,
	markStuckJobsAsFailed,
	requeueJob,
} from "@repo/database";
import { logger } from "@repo/logs";
import { trackToolServerEvent } from "../../../lib/analytics";
import {
	DEFAULT_JOB_TIMEOUT_MS,
	getProcessor,
	withTimeout,
} from "./processor-registry";
import { registerAllProcessors } from "./register-all-processors";

// Ensure all processors are registered on module load
registerAllProcessors();

// Exponential backoff calculation: 1min, 4min, 16min
function calculateBackoffMs(attempts: number): number {
	return 4 ** attempts * 60 * 1000;
}

export async function processNextJob(
	toolSlug?: string,
): Promise<{ processed: boolean; jobId?: string }> {
	// 1. Claim next pending job (atomic)
	const job = await claimNextPendingJob(toolSlug);

	if (!job) {
		return { processed: false };
	}

	logger.info(`Processing job ${job.id} for tool ${job.toolSlug}`);
	const startTime = Date.now();

	// Track processing started (non-blocking)
	trackToolServerEvent("tool_processing_started", {
		tool_name: job.toolSlug,
		job_id: job.id,
		is_authenticated: !!job.userId,
		session_id: job.sessionId ?? undefined,
		user_id: job.userId ?? undefined,
	}).catch(() => {
		// Ignore analytics errors
	});

	// 2. Get processor for tool
	const processor = getProcessor(job.toolSlug);

	if (!processor) {
		logger.error(`No processor registered for tool: ${job.toolSlug}`);
		await markJobFailed(
			job.id,
			`No processor registered for tool: ${job.toolSlug}`,
		);
		return { processed: true, jobId: job.id };
	}

	// 3. Execute with timeout
	try {
		const result = await withTimeout(
			processor(job),
			DEFAULT_JOB_TIMEOUT_MS,
		);

		if (result.success) {
			await markJobCompleted(job.id, result.output ?? {});
			logger.info(`Job ${job.id} completed successfully`);

			// Track processing completed (non-blocking)
			const processingDurationMs = Date.now() - startTime;
			trackToolServerEvent("tool_processing_completed", {
				tool_name: job.toolSlug,
				job_id: job.id,
				is_authenticated: !!job.userId,
				session_id: job.sessionId ?? undefined,
				user_id: job.userId ?? undefined,
				processing_duration_ms: processingDurationMs,
			}).catch(() => {
				// Ignore analytics errors
			});
		} else {
			// Track processing failed (non-blocking)
			const processingDurationMs = Date.now() - startTime;
			trackToolServerEvent("tool_processing_failed", {
				tool_name: job.toolSlug,
				job_id: job.id,
				is_authenticated: !!job.userId,
				session_id: job.sessionId ?? undefined,
				user_id: job.userId ?? undefined,
				processing_duration_ms: processingDurationMs,
				error_type: categorizeError(result.error ?? "Unknown error"),
			}).catch(() => {
				// Ignore analytics errors
			});

			await handleJobFailure(
				job.id,
				job.attempts,
				job.maxAttempts,
				result.error ?? "Unknown error",
			);
		}
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);

		// Track processing failed (non-blocking)
		const processingDurationMs = Date.now() - startTime;
		trackToolServerEvent("tool_processing_failed", {
			tool_name: job.toolSlug,
			job_id: job.id,
			is_authenticated: !!job.userId,
			session_id: job.sessionId ?? undefined,
			user_id: job.userId ?? undefined,
			processing_duration_ms: processingDurationMs,
			error_type: categorizeError(errorMessage),
		}).catch(() => {
			// Ignore analytics errors
		});

		await handleJobFailure(
			job.id,
			job.attempts,
			job.maxAttempts,
			errorMessage,
		);
	}

	return { processed: true, jobId: job.id };
}

async function handleJobFailure(
	jobId: string,
	attempts: number,
	maxAttempts: number,
	error: string,
) {
	logger.error(`Job ${jobId} failed: ${error}`);

	if (attempts < maxAttempts) {
		// Exponential backoff: 1min, 4min, 16min
		const backoffMs = calculateBackoffMs(attempts);
		const processAfter = new Date(Date.now() + backoffMs);
		await requeueJob(jobId, processAfter);
		logger.info(
			`Job ${jobId} requeued for retry at ${processAfter.toISOString()}`,
		);
	} else {
		await markJobFailed(jobId, error);
		logger.info(
			`Job ${jobId} permanently failed after ${attempts} attempts`,
		);
	}
}

export async function processAllPendingJobs(
	toolSlug?: string,
	maxJobs = 10,
): Promise<{ processed: number; jobIds: string[] }> {
	const jobIds: string[] = [];
	let processed = 0;

	while (processed < maxJobs) {
		const result = await processNextJob(toolSlug);
		if (!result.processed) {
			break;
		}
		processed++;
		if (result.jobId) {
			jobIds.push(result.jobId);
		}
	}

	return { processed, jobIds };
}

export async function retryFailedJobs(): Promise<{ retried: number }> {
	const jobsToRetry = await getJobsToRetry();
	let retried = 0;

	for (const job of jobsToRetry) {
		const backoffMs = calculateBackoffMs(job.attempts);
		const processAfter = new Date(Date.now() + backoffMs);
		await requeueJob(job.id, processAfter);
		retried++;
		logger.info(
			`Job ${job.id} scheduled for retry at ${processAfter.toISOString()}`,
		);
	}

	return { retried };
}

export async function handleStuckJobs(
	timeoutMinutes = 30,
): Promise<{ count: number }> {
	const result = await markStuckJobsAsFailed(timeoutMinutes);
	if (result.count > 0) {
		logger.warn(`Marked ${result.count} stuck jobs as failed`);
	}
	return { count: result.count };
}

export async function runCleanup(): Promise<{ deleted: number }> {
	const result = await cleanupExpiredJobs();
	if (result.count > 0) {
		logger.info(`Cleaned up ${result.count} expired jobs`);
	}
	return { deleted: result.count };
}

/**
 * Categorize error messages into types for analytics (avoiding PII)
 */
function categorizeError(errorMessage: string): string {
	const lowerMessage = errorMessage.toLowerCase();

	if (lowerMessage.includes("timeout")) {
		return "timeout";
	}
	if (
		lowerMessage.includes("rate limit") ||
		lowerMessage.includes("too many requests")
	) {
		return "rate_limit";
	}
	if (
		lowerMessage.includes("network") ||
		lowerMessage.includes("fetch") ||
		lowerMessage.includes("connection")
	) {
		return "network_error";
	}
	if (
		lowerMessage.includes("invalid") ||
		lowerMessage.includes("validation")
	) {
		return "validation_error";
	}
	if (lowerMessage.includes("not found") || lowerMessage.includes("404")) {
		return "not_found";
	}
	if (lowerMessage.includes("paywall") || lowerMessage.includes("blocked")) {
		return "content_blocked";
	}
	if (
		lowerMessage.includes("auth") ||
		lowerMessage.includes("permission") ||
		lowerMessage.includes("unauthorized")
	) {
		return "auth_error";
	}

	return "unknown";
}
