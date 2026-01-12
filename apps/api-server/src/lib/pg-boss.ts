import PgBoss from "pg-boss";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

let boss: PgBoss | null = null;

/**
 * pg-boss configuration for job queue processing
 *
 * Key settings:
 * - migrate: false - Schema already created by Prisma migration (PRA-91)
 * - schema: "pgboss" - Use the schema created by Prisma
 * - retryLimit: 3 - Default retry attempts for jobs
 * - retryDelay: 60 - Initial delay (1 minute) before retrying
 * - retryBackoff: true - Use exponential backoff (1m, 4m, 16m)
 * - expireInSeconds: 600 - Job timeout (10 minutes)
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

		// Default job configuration
		retryLimit: 3,
		retryDelay: 60, // 1 minute
		retryBackoff: true, // Exponential: 1m, 4m, 16m
		expireInSeconds: 600, // 10 minute timeout

		// Archive configuration
		archiveCompletedAfterSeconds: 60 * 60 * 24 * 7, // 7 days
		archiveFailedAfterSeconds: 60 * 60 * 24 * 14, // 14 days

		// Monitoring
		monitorStateIntervalSeconds: 30,

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
