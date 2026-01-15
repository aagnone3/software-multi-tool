// Import processors from @repo/api
// Each processor knows how to handle a specific job type
import {
	JOB_TIMEOUT_MS,
	WORKER_CONFIG,
} from "@repo/api/modules/jobs/lib/job-config";
import {
	getProcessor,
	type JobResult,
	withTimeout,
} from "@repo/api/modules/jobs/lib/processor-registry";
import { registerAllProcessors } from "@repo/api/modules/jobs/lib/register-all-processors";
// Also register the news-analyzer processor which is not in register-all-processors
import { registerNewsAnalyzerProcessor } from "@repo/api/modules/news-analyzer/lib/register";
import { db } from "@repo/database";
import { logger } from "../lib/logger.js";
import { getPgBoss, registerExpireHandler } from "../lib/pg-boss.js";
import type { JobPayload, WorkerConfig } from "./types.js";

/**
 * Worker configuration imported from centralized job-config.
 * See job-config.ts for details on batch size and polling intervals.
 */
const DEFAULT_WORKER_CONFIG: WorkerConfig = {
	batchSize: WORKER_CONFIG.batchSize,
	pollingIntervalSeconds: WORKER_CONFIG.pollingIntervalSeconds,
};

/**
 * Tool slugs that have registered processors
 */
const TOOL_SLUGS = [
	"invoice-processor",
	"contract-analyzer",
	"feedback-analyzer",
	"expense-categorizer",
	"meeting-summarizer",
	"news-analyzer",
] as const;

type ToolSlug = (typeof TOOL_SLUGS)[number];

/**
 * Initialize all processors before registering workers
 */
function initializeProcessors(): void {
	logger.info("Initializing job processors...");
	registerAllProcessors();
	registerNewsAnalyzerProcessor();
	logger.info(`Registered ${TOOL_SLUGS.length} job processors`);
}

/**
 * Process a single job from pg-boss queue
 *
 * This function:
 * 1. Atomically claims the ToolJob (update status from PENDING to PROCESSING)
 * 2. Gets the appropriate processor
 * 3. Executes the processor
 * 4. Updates the ToolJob with the result
 */
async function processSingleJob(
	toolSlug: ToolSlug,
	payload: JobPayload,
	pgBossJobId: string,
): Promise<JobResult> {
	const { toolJobId } = payload;

	logger.info(`[Worker:${toolSlug}] Claiming job ${toolJobId}`);

	// Atomically claim the job by updating status from PENDING to PROCESSING
	// This prevents race conditions if the same job is somehow claimed twice
	const claimResult = await db.$queryRaw<
		Array<{
			id: string;
			attempts: number;
			maxAttempts: number;
		}>
	>`
		UPDATE "tool_job"
		SET status = 'PROCESSING',
			"startedAt" = NOW(),
			attempts = attempts + 1,
			"pgBossJobId" = ${pgBossJobId},
			"updatedAt" = NOW()
		WHERE id = ${toolJobId}
		AND status = 'PENDING'
		RETURNING id, attempts, "maxAttempts"
	`;

	if (claimResult.length === 0) {
		// Job wasn't in PENDING status - could be already processed or cancelled
		const toolJob = await db.toolJob.findUnique({
			where: { id: toolJobId },
			select: { id: true, status: true },
		});

		if (!toolJob) {
			logger.error(
				`[Worker:${toolSlug}] ToolJob not found: ${toolJobId}`,
			);
			return {
				success: false,
				error: `ToolJob not found: ${toolJobId}`,
			};
		}

		logger.warn(
			`[Worker:${toolSlug}] Job ${toolJobId} not in PENDING status (current: ${toolJob.status}), skipping`,
		);
		return {
			success: true, // Not an error, just already processed
			output: {
				skipped: true,
				reason: `Job status was ${toolJob.status}`,
			},
		};
	}

	// Job was successfully claimed - get the updated values
	const { attempts: newAttemptCount, maxAttempts } = claimResult[0];

	// Now fetch the full job data for processing
	const toolJob = await db.toolJob.findUnique({
		where: { id: toolJobId },
	});

	if (!toolJob) {
		logger.error(
			`[Worker:${toolSlug}] ToolJob not found after claim: ${toolJobId}`,
		);
		return {
			success: false,
			error: `ToolJob not found after claim: ${toolJobId}`,
		};
	}

	logger.info(
		`[Worker:${toolSlug}] Processing job ${toolJobId} (attempt ${newAttemptCount}/${maxAttempts})`,
	);

	// Get the processor for this tool
	const processor = getProcessor(toolSlug);

	if (!processor) {
		const error = `No processor registered for tool: ${toolSlug}`;
		logger.error(`[Worker:${toolSlug}] ${error}`);

		await db.toolJob.update({
			where: { id: toolJobId },
			data: {
				status: "FAILED",
				error,
				completedAt: new Date(),
			},
		});

		return { success: false, error };
	}

	try {
		// Execute the processor with timeout to prevent indefinite hangs
		// Timeout is configured in job-config.ts (JOB_TIMEOUT_MS)
		logger.debug(
			`[Worker:${toolSlug}] Executing processor with ${JOB_TIMEOUT_MS}ms timeout`,
		);
		const result = await withTimeout(processor(toolJob), JOB_TIMEOUT_MS);

		if (result.success) {
			// Mark job as completed
			await db.toolJob.update({
				where: { id: toolJobId },
				data: {
					status: "COMPLETED",
					output: result.output ?? {},
					completedAt: new Date(),
				},
			});

			logger.info(
				`[Worker:${toolSlug}] Job ${toolJobId} completed successfully`,
			);
		} else {
			// Mark job as failed
			await db.toolJob.update({
				where: { id: toolJobId },
				data: {
					status: "FAILED",
					error: result.error ?? "Unknown error",
					completedAt: new Date(),
				},
			});

			logger.error(
				`[Worker:${toolSlug}] Job ${toolJobId} failed: ${result.error}`,
			);
		}

		return result;
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);

		// Check if this job should be retried (using values captured before processing)
		if (newAttemptCount < maxAttempts) {
			// Job will be retried by pg-boss, keep it in PENDING status
			await db.toolJob.update({
				where: { id: toolJobId },
				data: {
					status: "PENDING",
					error: errorMessage,
				},
			});

			logger.warn(
				`[Worker:${toolSlug}] Job ${toolJobId} failed, will retry (attempt ${newAttemptCount}/${maxAttempts}): ${errorMessage}`,
			);

			// Rethrow to let pg-boss handle the retry
			throw error;
		}

		// Max attempts reached, mark as permanently failed
		await db.toolJob.update({
			where: { id: toolJobId },
			data: {
				status: "FAILED",
				error: errorMessage,
				completedAt: new Date(),
			},
		});

		logger.error(
			`[Worker:${toolSlug}] Job ${toolJobId} permanently failed: ${errorMessage}`,
		);

		return {
			success: false,
			error: errorMessage,
		};
	}
}

/**
 * Register workers for all job types with pg-boss
 */
export async function registerWorkers(): Promise<void> {
	// Initialize processors first
	initializeProcessors();

	const boss = getPgBoss();

	logger.info("Registering pg-boss workers...");

	// Register a worker for each tool slug
	for (const toolSlug of TOOL_SLUGS) {
		// pg-boss work() receives an array of jobs (batch)
		// We process them sequentially since our processors are designed for single jobs
		await boss.work<JobPayload>(
			toolSlug,
			{
				batchSize: DEFAULT_WORKER_CONFIG.batchSize,
				pollingIntervalSeconds:
					DEFAULT_WORKER_CONFIG.pollingIntervalSeconds,
			},
			async (jobs) => {
				// Process each job in the batch
				for (const job of jobs) {
					logger.debug(
						`[Worker:${toolSlug}] Received pg-boss job ${job.id}`,
						{
							pgBossJobId: job.id,
							toolJobId: job.data.toolJobId,
						},
					);

					try {
						const result = await processSingleJob(
							toolSlug,
							job.data,
							job.id,
						);

						if (!result.success) {
							// Mark as failed in pg-boss
							await boss.fail(toolSlug, job.id, {
								error: result.error,
							});
						} else {
							// Mark as completed in pg-boss
							await boss.complete(toolSlug, job.id, {
								output: result.output,
							});
						}
					} catch (error) {
						// Job threw an error - pg-boss will handle retry
						const errorMessage =
							error instanceof Error
								? error.message
								: String(error);
						await boss.fail(toolSlug, job.id, {
							error: errorMessage,
						});
						// Don't re-throw - we've already handled the error
					}
				}
			},
		);

		logger.info(
			`[Worker:${toolSlug}] Worker registered with batchSize=${DEFAULT_WORKER_CONFIG.batchSize}`,
		);
	}

	logger.info(`Registered ${TOOL_SLUGS.length} pg-boss workers`);

	// Register expire handlers for each queue
	// When pg-boss marks a job as expired, this updates the ToolJob status
	logger.info("Registering expire handlers...");
	for (const toolSlug of TOOL_SLUGS) {
		await registerExpireHandler(toolSlug);
	}
	logger.info(`Registered ${TOOL_SLUGS.length} expire handlers`);
}

/**
 * Submit a job to pg-boss queue
 *
 * @param toolSlug - The tool/queue name
 * @param toolJobId - The ID of the ToolJob in the database
 * @returns The pg-boss job ID
 */
export async function submitJob(
	toolSlug: string,
	toolJobId: string,
): Promise<string | null> {
	const boss = getPgBoss();

	const payload: JobPayload = { toolJobId };

	const pgBossJobId = await boss.send(toolSlug, payload, {
		// Priority: higher number = higher priority
		// Map ToolJob priority (0-10) to pg-boss
		priority: 0,
	});

	if (pgBossJobId) {
		logger.info(
			`[Queue] Job submitted: toolSlug=${toolSlug}, toolJobId=${toolJobId}, pgBossJobId=${pgBossJobId}`,
		);
	} else {
		logger.warn(
			`[Queue] Failed to submit job: toolSlug=${toolSlug}, toolJobId=${toolJobId}`,
		);
	}

	return pgBossJobId;
}

/**
 * Submit a job with specific options
 */
export async function submitJobWithOptions(
	toolSlug: string,
	toolJobId: string,
	options: {
		priority?: number;
		startAfter?: Date;
		expireInSeconds?: number;
	},
): Promise<string | null> {
	const boss = getPgBoss();

	const payload: JobPayload = { toolJobId };

	const pgBossJobId = await boss.send(toolSlug, payload, {
		priority: options.priority ?? 0,
		startAfter: options.startAfter,
		expireInSeconds: options.expireInSeconds,
	});

	if (pgBossJobId) {
		logger.info(
			`[Queue] Job submitted with options: toolSlug=${toolSlug}, toolJobId=${toolJobId}, pgBossJobId=${pgBossJobId}`,
			{
				options,
			},
		);
	}

	return pgBossJobId;
}
