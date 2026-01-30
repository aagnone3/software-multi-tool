import { cleanupExpiredJobs, markStuckJobsAsFailed } from "@repo/database";
import { logger } from "@repo/logs";
import { STUCK_JOB_TIMEOUT_MINUTES } from "./job-config";

/**
 * Job runner maintenance utilities
 *
 * This module contains maintenance functions for ToolJob records.
 *
 * Architecture (Inngest-based):
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
