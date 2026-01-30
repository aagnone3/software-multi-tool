import { cleanupExpiredJobs, markStuckJobsAsFailed } from "@repo/database";
import { logger } from "@repo/logs";
import { STUCK_JOB_TIMEOUT_MINUTES } from "./job-config";

/**
 * Job runner maintenance utilities
 *
 * This module contains maintenance functions for ToolJob records.
 *
 * Architecture (post-Inngest migration):
 * - Job creation: packages/api/modules/jobs/procedures/create-job.ts
 *   → Creates ToolJob record
 *   → Triggers Inngest function via apps/web/inngest/
 *
 * - Job processing: apps/web/inngest/functions/
 *   → Inngest functions process jobs asynchronously
 *   → Status updates are made directly to ToolJob records
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
 * The default timeout is configured in job-config.ts (STUCK_JOB_TIMEOUT_MINUTES).
 *
 * @param timeoutMinutes - How long a job can be processing before considered stuck
 *                         (default: STUCK_JOB_TIMEOUT_MINUTES from job-config.ts)
 * @returns The number of jobs marked as failed
 */
export async function handleStuckJobs(
	timeoutMinutes = STUCK_JOB_TIMEOUT_MINUTES,
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
// Job processing is now handled by Inngest functions.
// ============================================================================

/**
 * @deprecated Use Inngest functions instead. Jobs are processed by Inngest.
 * This function is kept only for backwards compatibility during migration.
 */
export async function processNextJob(
	_toolSlug?: string,
): Promise<{ processed: boolean; jobId?: string }> {
	logger.warn(
		"[DEPRECATED] processNextJob() called. Job processing is now handled by Inngest.",
	);
	return { processed: false };
}

/**
 * @deprecated Use Inngest functions instead. Jobs are processed by Inngest.
 * This function is kept only for backwards compatibility during migration.
 */
export async function processAllPendingJobs(
	_toolSlug?: string,
	_maxJobs = 10,
): Promise<{ processed: number; jobIds: string[] }> {
	logger.warn(
		"[DEPRECATED] processAllPendingJobs() called. Job processing is now handled by Inngest.",
	);
	return { processed: 0, jobIds: [] };
}

/**
 * @deprecated Retry logic is now handled by Inngest.
 * This function is kept only for backwards compatibility during migration.
 */
export async function retryFailedJobs(): Promise<{ retried: number }> {
	logger.warn(
		"[DEPRECATED] retryFailedJobs() called. Retry logic is now handled by Inngest.",
	);
	return { retried: 0 };
}

/**
 * @deprecated pg-boss reconciliation no longer needed. Jobs are processed by Inngest.
 * This function is kept only for backwards compatibility during migration.
 */
export async function reconcileJobStates(): Promise<{
	success: boolean;
	synced: number;
	completed: number;
	failed: number;
	expired: number;
	error?: string;
}> {
	logger.warn(
		"[DEPRECATED] reconcileJobStates() called. pg-boss has been removed, reconciliation is no longer needed.",
	);
	return {
		success: true,
		synced: 0,
		completed: 0,
		failed: 0,
		expired: 0,
	};
}
