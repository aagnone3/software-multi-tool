import { db } from "@repo/database";
import { logger } from "@repo/logs";
import { JOB_EXPIRE_IN_INTERVAL, RETRY_CONFIG } from "./job-config";

/**
 * Job queue abstraction for submitting jobs to pg-boss
 *
 * This module provides a thin layer over pg-boss for submitting jobs
 * directly via SQL. The actual job processing is handled by the
 * api-server workers.
 *
 * Architecture:
 * - create-job.ts calls submitJobToQueue() after creating ToolJob
 * - Job is inserted into pgboss.job table
 * - api-server workers poll pgboss.job and process jobs
 * - Vercel Cron handles maintenance (stuck jobs, cleanup)
 *
 * Timeout Configuration:
 * - All timeout values are centralized in job-config.ts
 * - Job expiration defaults to JOB_EXPIRE_IN_INTERVAL (10 minutes)
 * - Retry configuration uses RETRY_CONFIG for consistency
 */

interface SubmitJobOptions {
	/**
	 * Job priority (higher = processed first)
	 * @default 0
	 */
	priority?: number;

	/**
	 * When to start processing the job
	 * @default now
	 */
	startAfter?: Date;

	/**
	 * Job expiration interval (PostgreSQL interval format).
	 * Jobs are marked "expired" if active longer than this.
	 * @default JOB_EXPIRE_IN_INTERVAL from job-config.ts (10 minutes)
	 */
	expireIn?: string;

	/**
	 * Singleton key for deduplication
	 */
	singletonKey?: string;
}

/**
 * Submit a job to the pg-boss queue
 *
 * @param queueName - The queue/tool name (e.g., "news-analyzer")
 * @param toolJobId - The ID of the ToolJob in the database
 * @param options - Optional job configuration
 * @returns The pg-boss job ID (UUID), or null if submission failed
 */
export async function submitJobToQueue(
	queueName: string,
	toolJobId: string,
	options: SubmitJobOptions = {},
): Promise<string | null> {
	const {
		priority = 0,
		startAfter,
		expireIn = JOB_EXPIRE_IN_INTERVAL,
		singletonKey,
	} = options;

	const payload = { toolJobId };

	try {
		// Ensure the queue exists (pg-boss auto-creates partitions)
		// This is idempotent - create_queue does nothing if queue already exists
		await ensureQueueExists(queueName);

		// Insert job directly into pgboss.job table
		// pg-boss workers will pick it up via the `work()` function
		const result = await db.$queryRaw<Array<{ id: string }>>`
			INSERT INTO pgboss.job (
				name,
				data,
				priority,
				start_after,
				expire_in,
				singleton_key,
				retry_limit,
				retry_delay,
				retry_backoff
			) VALUES (
				${queueName},
				${JSON.stringify(payload)}::jsonb,
				${priority},
				${startAfter ?? new Date()},
				${expireIn}::interval,
				${singletonKey ?? null},
				${RETRY_CONFIG.limit},
				${RETRY_CONFIG.delay},
				${RETRY_CONFIG.backoff}
			)
			RETURNING id::text
		`;

		const pgBossJobId = result[0]?.id;

		if (pgBossJobId) {
			logger.info(
				`[Queue] Job submitted: queue=${queueName}, toolJobId=${toolJobId}, pgBossJobId=${pgBossJobId}`,
			);

			// Update ToolJob with the pg-boss job ID
			await db.toolJob.update({
				where: { id: toolJobId },
				data: { pgBossJobId },
			});
		} else {
			logger.warn(
				`[Queue] Failed to submit job: queue=${queueName}, toolJobId=${toolJobId}`,
			);
		}

		return pgBossJobId ?? null;
	} catch (error) {
		logger.error(
			`[Queue] Error submitting job: queue=${queueName}, toolJobId=${toolJobId}`,
			{ error: error instanceof Error ? error.message : String(error) },
		);
		return null;
	}
}

/**
 * Ensure a queue exists in pg-boss
 *
 * This is called before submitting jobs to ensure the queue partition exists.
 * The create_queue function is idempotent - it does nothing if queue already exists.
 */
async function ensureQueueExists(queueName: string): Promise<void> {
	try {
		await db.$executeRaw`
			SELECT pgboss.create_queue(${queueName}, '{}'::json)
		`;
	} catch (error) {
		// Queue might already exist, which is fine
		logger.debug(`[Queue] Queue creation result for ${queueName}`, {
			error: error instanceof Error ? error.message : String(error),
		});
	}
}

/**
 * Check if pg-boss workers are active
 *
 * This can be used to determine if jobs should be submitted to pg-boss
 * or fall back to immediate processing.
 *
 * @returns true if workers appear to be active (have processed jobs recently)
 */
export async function arePgBossWorkersActive(): Promise<boolean> {
	try {
		// Check if there are any recently completed jobs in pg-boss
		// This indicates workers are running
		const result = await db.$queryRaw<Array<{ count: bigint }>>`
			SELECT COUNT(*) as count
			FROM pgboss.job
			WHERE state IN ('active', 'completed')
			AND created_on > NOW() - INTERVAL '5 minutes'
		`;

		return (result[0]?.count ?? BigInt(0)) > BigInt(0);
	} catch {
		// If query fails, assume workers are not active
		return false;
	}
}
