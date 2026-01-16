import { cleanupExpiredJobs, db, markStuckJobsAsFailed } from "@repo/database";
import { logger } from "@repo/logs";
import { STUCK_JOB_TIMEOUT_MINUTES } from "./job-config";

/**
 * Job runner maintenance utilities
 *
 * This module contains maintenance functions used by the cron job to ensure
 * ToolJob records stay in sync with pg-boss state.
 *
 * Actual job processing is handled by pg-boss workers in api-server.
 *
 * Architecture:
 * - Job creation: packages/api/modules/jobs/procedures/create-job.ts
 *   → Creates ToolJob record
 *   → Submits to pg-boss queue via packages/api/modules/jobs/lib/queue.ts
 *
 * - Job processing: apps/api-server/src/workers/index.ts
 *   → pg-boss workers poll for jobs and execute processors
 *   → onExpire handler updates ToolJob when pg-boss expires jobs
 *
 * - Maintenance: This file
 *   → handleStuckJobs: Mark long-running jobs as failed
 *   → reconcileJobStates: Sync pg-boss state with ToolJob records
 *   → runCleanup: Delete expired jobs
 *
 * ## Reconciliation Strategy
 *
 * The reconciliation function handles state divergence between pg-boss and
 * ToolJob. This can happen due to:
 * - Worker crash during status update
 * - Network issues between worker and database
 * - Race conditions during job transitions
 *
 * The function:
 * 1. Finds ToolJobs in PROCESSING state with pgBossJobId
 * 2. Checks the corresponding pg-boss job state
 * 3. Updates ToolJob to match pg-boss state if diverged
 */

/**
 * Mark stuck jobs as failed
 *
 * Jobs that have been in PROCESSING status for longer than the timeout
 * are considered stuck (worker crash, network issue, etc.) and marked as failed.
 *
 * The default timeout is configured in job-config.ts (STUCK_JOB_TIMEOUT_MINUTES).
 * This is intentionally longer than the pg-boss expiration timeout to allow
 * the onExpire handler to trigger first.
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

/**
 * pg-boss job states (from pgboss.job.state column)
 */
type PgBossState =
	| "created"
	| "retry"
	| "active"
	| "completed"
	| "expired"
	| "cancelled"
	| "failed";

/**
 * Reconcile ToolJob states with pg-boss job states
 *
 * This function handles state divergence between pg-boss and ToolJob records.
 * It queries pg-boss for jobs that have completed/failed/expired but whose
 * ToolJob records still show PROCESSING.
 *
 * This is a fallback mechanism for cases where:
 * - The onExpire handler failed to update ToolJob
 * - A worker crashed after pg-boss marked the job complete/failed
 * - Network issues prevented the status update
 *
 * The function only syncs jobs that have a pgBossJobId (jobs submitted to pg-boss).
 * Jobs without pgBossJobId are handled by handleStuckJobs().
 *
 * @returns Object containing success status, counts, and optional error message
 */
export async function reconcileJobStates(): Promise<{
	success: boolean;
	synced: number;
	completed: number;
	failed: number;
	expired: number;
	error?: string;
}> {
	const result = {
		success: true,
		synced: 0,
		completed: 0,
		failed: 0,
		expired: 0,
	};

	try {
		// Find ToolJobs in PROCESSING state that have a pgBossJobId
		// These are candidates for reconciliation
		const processingJobs = await db.toolJob.findMany({
			where: {
				status: "PROCESSING",
				pgBossJobId: { not: null },
			},
			select: {
				id: true,
				pgBossJobId: true,
				toolSlug: true,
			},
		});

		if (processingJobs.length === 0) {
			logger.debug(
				"[Reconcile] No PROCESSING jobs with pgBossJobId found",
			);
			return result;
		}

		logger.info(
			`[Reconcile] Checking ${processingJobs.length} PROCESSING jobs against pg-boss state`,
		);

		// Query pg-boss for the state of these jobs
		// We use a raw query because we need to access pgboss.job table directly
		const pgBossJobIds = processingJobs
			.map(
				(j: {
					id: string;
					pgBossJobId: string | null;
					toolSlug: string;
				}) => j.pgBossJobId,
			)
			.filter((id: string | null): id is string => id !== null);

		if (pgBossJobIds.length === 0) {
			return result;
		}

		// Get pg-boss job states
		const pgBossJobs = await db.$queryRaw<
			Array<{ id: string; state: PgBossState; output: unknown }>
		>`
			SELECT id::text, state, output
			FROM pgboss.job
			WHERE id = ANY(${pgBossJobIds}::uuid[])
		`;

		// Create a map of pgBossJobId -> state for quick lookup
		const pgBossStateMap = new Map<
			string,
			{ state: PgBossState; output: unknown }
		>();
		for (const job of pgBossJobs) {
			pgBossStateMap.set(job.id, {
				state: job.state,
				output: job.output,
			});
		}

		// Also check archive for completed/failed jobs that have been archived
		const archivedJobs = await db.$queryRaw<
			Array<{ id: string; state: PgBossState; output: unknown }>
		>`
			SELECT id::text, state, output
			FROM pgboss.archive
			WHERE id = ANY(${pgBossJobIds}::uuid[])
		`;

		for (const job of archivedJobs) {
			if (!pgBossStateMap.has(job.id)) {
				pgBossStateMap.set(job.id, {
					state: job.state,
					output: job.output,
				});
			}
		}

		// Reconcile each job
		for (const toolJob of processingJobs) {
			const pgBossJobId = toolJob.pgBossJobId;
			if (!pgBossJobId) {
				continue;
			}

			const pgBossInfo = pgBossStateMap.get(pgBossJobId);

			if (!pgBossInfo) {
				// Job not found in pg-boss - this shouldn't happen normally
				// Log it but don't mark as failed yet (could be timing issue)
				logger.warn(
					`[Reconcile] pgBossJobId ${pgBossJobId} not found for ToolJob ${toolJob.id}`,
				);
				continue;
			}

			const { state: pgBossState } = pgBossInfo;

			// Only reconcile terminal states
			if (pgBossState === "completed") {
				await db.toolJob.update({
					where: { id: toolJob.id },
					data: {
						status: "COMPLETED",
						output: {},
						completedAt: new Date(),
						error: null,
					},
				});
				result.completed++;
				result.synced++;
				logger.info(
					`[Reconcile] Synced ToolJob ${toolJob.id}: PROCESSING → COMPLETED (pg-boss was completed)`,
				);
			} else if (pgBossState === "failed") {
				await db.toolJob.update({
					where: { id: toolJob.id },
					data: {
						status: "FAILED",
						error: "Job failed (synced from pg-boss)",
						completedAt: new Date(),
					},
				});
				result.failed++;
				result.synced++;
				logger.info(
					`[Reconcile] Synced ToolJob ${toolJob.id}: PROCESSING → FAILED (pg-boss was failed)`,
				);
			} else if (pgBossState === "expired") {
				await db.toolJob.update({
					where: { id: toolJob.id },
					data: {
						status: "FAILED",
						error: "Job expired (synced from pg-boss)",
						completedAt: new Date(),
					},
				});
				result.expired++;
				result.synced++;
				logger.info(
					`[Reconcile] Synced ToolJob ${toolJob.id}: PROCESSING → FAILED (pg-boss was expired)`,
				);
			} else if (pgBossState === "cancelled") {
				await db.toolJob.update({
					where: { id: toolJob.id },
					data: {
						status: "CANCELLED",
						completedAt: new Date(),
					},
				});
				result.synced++;
				logger.info(
					`[Reconcile] Synced ToolJob ${toolJob.id}: PROCESSING → CANCELLED (pg-boss was cancelled)`,
				);
			}
			// For 'created', 'retry', or 'active' states, the job is still in progress
			// so we don't need to reconcile
		}

		if (result.synced > 0) {
			logger.info(
				`[Reconcile] Synced ${result.synced} jobs (completed: ${result.completed}, failed: ${result.failed}, expired: ${result.expired})`,
			);
		}

		return result;
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		logger.error("[Reconcile] Failed to reconcile job states", {
			error: errorMessage,
		});
		return {
			success: false,
			synced: 0,
			completed: 0,
			failed: 0,
			expired: 0,
			error: errorMessage,
		};
	}
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
