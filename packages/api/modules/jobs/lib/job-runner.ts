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
import {
	DEFAULT_JOB_TIMEOUT_MS,
	getProcessor,
	withTimeout,
} from "./processor-registry";

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
		} else {
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
