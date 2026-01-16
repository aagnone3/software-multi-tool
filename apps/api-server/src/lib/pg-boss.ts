import {
	ARCHIVE_CONFIG,
	JOB_TIMEOUT_SECONDS,
	RETRY_CONFIG,
	WORKER_CONFIG,
} from "@repo/api/modules/jobs/lib/job-config";
import PgBoss from "pg-boss";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

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
 * - retryBackoff: true - Use exponential backoff (delay doubles per retry)
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
 * Note on job expiration handling:
 *
 * pg-boss v10.x removed the `onExpire` callback API. Expired jobs are now
 * handled through:
 *
 * 1. pg-boss maintenance cycle: Automatically marks jobs as "expired" when
 *    they stay in "active" state longer than `expireInSeconds`.
 *
 * 2. Cron reconciliation: The `/api/cron/job-maintenance` endpoint runs
 *    `reconcileJobStates()` which syncs pg-boss expired state to ToolJob
 *    records, marking them as FAILED with appropriate error messages.
 *
 * This approach is more reliable than callbacks because:
 * - It handles server restarts gracefully
 * - It works even if the worker that created the job crashes
 * - It provides a single source of truth (pg-boss state)
 */
