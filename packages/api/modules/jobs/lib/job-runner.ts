import { cleanupExpiredJobs, markStuckJobsAsFailed } from "@repo/database";
import { logger } from "@repo/logs";

/**
 * Job runner maintenance utilities
 *
 * This module now only contains maintenance functions used by the cron job.
 * Actual job processing is handled by pg-boss workers in api-server.
 *
 * Architecture:
 * - Job creation: packages/api/modules/jobs/procedures/create-job.ts
 *   → Creates ToolJob record
 *   → Submits to pg-boss queue via packages/api/modules/jobs/lib/queue.ts
 *
 * - Job processing: apps/api-server/src/workers/index.ts
 *   → pg-boss workers poll for jobs and execute processors
 *
 * - Maintenance: This file
 *   → handleStuckJobs: Mark long-running jobs as failed
 *   → runCleanup: Delete expired jobs
 */

/**
 * Mark stuck jobs as failed
 *
 * Jobs that have been in PROCESSING status for longer than the timeout
 * are considered stuck (worker crash, network issue, etc.) and marked as failed.
 *
 * @param timeoutMinutes - How long a job can be processing before considered stuck (default: 30)
 * @returns The number of jobs marked as failed
 */
export async function handleStuckJobs(
	timeoutMinutes = 30,
): Promise<{ count: number }> {
	const result = await markStuckJobsAsFailed(timeoutMinutes);
	if (result.count > 0) {
		logger.warn(`Marked ${result.count} stuck jobs as failed`);
	}
	return { count: result.count };
}

/**
 * Clean up expired jobs
 *
 * Deletes completed, failed, and cancelled jobs that have passed their
 * expiration date. Default expiration is 7 days after job creation.
 *
 * @returns The number of jobs deleted
 */
export async function runCleanup(): Promise<{ deleted: number }> {
	const result = await cleanupExpiredJobs();
	if (result.count > 0) {
		logger.info(`Cleaned up ${result.count} expired jobs`);
	}
	return { deleted: result.count };
}

// ============================================================================
// DEPRECATED FUNCTIONS
// These are kept for backwards compatibility but should not be used.
// Job processing is now handled by pg-boss workers in api-server.
// ============================================================================

/**
 * @deprecated Use pg-boss workers instead. Jobs are automatically processed by workers.
 * This function is kept only for backwards compatibility during migration.
 */
export async function processNextJob(
	_toolSlug?: string,
): Promise<{ processed: boolean; jobId?: string }> {
	logger.warn(
		"[DEPRECATED] processNextJob() called. Job processing is now handled by pg-boss workers.",
	);
	return { processed: false };
}

/**
 * @deprecated Use pg-boss workers instead. Jobs are automatically processed by workers.
 * This function is kept only for backwards compatibility during migration.
 */
export async function processAllPendingJobs(
	_toolSlug?: string,
	_maxJobs = 10,
): Promise<{ processed: number; jobIds: string[] }> {
	logger.warn(
		"[DEPRECATED] processAllPendingJobs() called. Job processing is now handled by pg-boss workers.",
	);
	return { processed: 0, jobIds: [] };
}

/**
 * @deprecated Retry logic is now handled by pg-boss.
 * This function is kept only for backwards compatibility during migration.
 */
export async function retryFailedJobs(): Promise<{ retried: number }> {
	logger.warn(
		"[DEPRECATED] retryFailedJobs() called. Retry logic is now handled by pg-boss.",
	);
	return { retried: 0 };
}
