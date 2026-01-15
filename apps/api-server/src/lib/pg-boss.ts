import {
	ARCHIVE_CONFIG,
	JOB_TIMEOUT_SECONDS,
	RETRY_CONFIG,
	WORKER_CONFIG,
} from "@repo/api/modules/jobs/lib/job-config";
import { db } from "@repo/database";
import PgBoss from "pg-boss";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

/**
 * Job payload structure for pg-boss jobs.
 * Contains the reference to the ToolJob record in our database.
 */
interface JobPayload {
	toolJobId: string;
}

let boss: PgBoss | null = null;

/**
 * pg-boss configuration for job queue processing
 *
 * All timeout and retry values are imported from @repo/api/modules/jobs/lib/job-config
 * to ensure consistency across the job processing system.
 *
 * Key settings:
 * - migrate: false - Schema already created by Prisma migration (PRA-91)
 * - schema: "pgboss" - Use the schema created by Prisma
 * - retryLimit: 3 - Default retry attempts for jobs
 * - retryDelay: 60 - Initial delay (1 minute) before retrying
 * - retryBackoff: true - Use exponential backoff (delay² per retry)
 * - expireInSeconds: 600 - Job timeout (10 minutes)
 *
 * See job-config.ts for detailed documentation on the timeout architecture
 * and retry strategy.
 */
export function createPgBoss(): PgBoss {
	if (boss) {
		return boss;
	}

	boss = new PgBoss({
		connectionString: env.DATABASE_URL,
		schema: "pgboss",

		// Prisma owns the schema - don't let pg-boss modify it
		migrate: false,

		// Default job configuration (from centralized config)
		retryLimit: RETRY_CONFIG.limit,
		retryDelay: RETRY_CONFIG.delay,
		retryBackoff: RETRY_CONFIG.backoff,
		expireInSeconds: JOB_TIMEOUT_SECONDS,

		// Archive configuration (from centralized config)
		archiveCompletedAfterSeconds: ARCHIVE_CONFIG.completedAfterSeconds,
		archiveFailedAfterSeconds: ARCHIVE_CONFIG.failedAfterSeconds,

		// Monitoring (from centralized config)
		monitorStateIntervalSeconds: WORKER_CONFIG.monitorStateIntervalSeconds,

		// Application name for Postgres connections
		application_name: "api-server-pgboss",
	});

	// Log events
	boss.on("error", (error) => {
		logger.error("pg-boss error", { error });
	});

	boss.on("monitor-states", (states) => {
		logger.debug("pg-boss monitor states", { states });
	});

	return boss;
}

/**
 * Get the pg-boss instance (throws if not initialized)
 */
export function getPgBoss(): PgBoss {
	if (!boss) {
		throw new Error(
			"pg-boss not initialized. Call createPgBoss() and start() first.",
		);
	}
	return boss;
}

/**
 * Start pg-boss worker processing
 */
export async function startPgBoss(): Promise<void> {
	const instance = createPgBoss();

	logger.info("Starting pg-boss...");
	await instance.start();
	logger.info("pg-boss started successfully");
}

/**
 * Stop pg-boss gracefully
 */
export async function stopPgBoss(): Promise<void> {
	if (boss) {
		logger.info("Stopping pg-boss...");
		await boss.stop({ graceful: true, timeout: 30000 });
		logger.info("pg-boss stopped successfully");
		boss = null;
	}
}

/**
 * Handle expired jobs for a specific queue.
 *
 * When pg-boss marks a job as "expired" (job stayed in active state longer
 * than expireInSeconds), this handler updates the corresponding ToolJob
 * record to reflect the expiration.
 *
 * This ensures ToolJob status stays in sync with pg-boss state even when
 * workers crash or become unresponsive.
 *
 * @param queueName - The name of the queue to handle expirations for
 */
export async function registerExpireHandler(queueName: string): Promise<void> {
	const instance = getPgBoss();

	await instance.onExpire<JobPayload>(queueName, async (job) => {
		const { toolJobId } = job.data;

		logger.warn(
			`[onExpire:${queueName}] Job expired: pgBossJobId=${job.id}, toolJobId=${toolJobId}`,
		);

		try {
			// Update ToolJob status to FAILED with expiration reason
			// Only update if the job is still in PROCESSING state to avoid
			// overwriting other terminal states (COMPLETED, CANCELLED)
			const result = await db.toolJob.updateMany({
				where: {
					id: toolJobId,
					status: "PROCESSING",
				},
				data: {
					status: "FAILED",
					error: `Job expired after ${JOB_TIMEOUT_SECONDS} seconds (pg-boss expiration)`,
					completedAt: new Date(),
				},
			});

			if (result.count > 0) {
				logger.info(
					`[onExpire:${queueName}] Marked ToolJob ${toolJobId} as FAILED (expired)`,
				);
			} else {
				// Job was not in PROCESSING state - check current state for logging
				const toolJob = await db.toolJob.findUnique({
					where: { id: toolJobId },
					select: { status: true },
				});

				if (toolJob) {
					logger.debug(
						`[onExpire:${queueName}] ToolJob ${toolJobId} not updated (current status: ${toolJob.status})`,
					);
				} else {
					logger.warn(
						`[onExpire:${queueName}] ToolJob ${toolJobId} not found`,
					);
				}
			}
		} catch (error) {
			logger.error(
				`[onExpire:${queueName}] Failed to update ToolJob ${toolJobId}`,
				{
					error:
						error instanceof Error ? error.message : String(error),
				},
			);
		}
	});

	logger.info(`[onExpire:${queueName}] Expire handler registered`);
}
