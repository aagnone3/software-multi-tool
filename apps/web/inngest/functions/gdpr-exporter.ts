import { processGdprExportJob } from "@repo/api/modules/gdpr-exporter";
import type { Prisma } from "@repo/database";
import {
	getToolJobById,
	markJobCompleted,
	markJobFailed,
} from "@repo/database";
import { logger } from "@repo/logs";
import { inngest } from "../client";

/**
 * GDPR Exporter Inngest function
 *
 * Exports all user data for GDPR compliance (data portability).
 *
 * Processing steps:
 * 1. Validate the tool job exists
 * 2. Collect user data, upload to storage, send email notification
 * 3. Update job status with results
 *
 * Retry configuration:
 * - 3 attempts with exponential backoff
 * - Retries on transient failures (network, storage, email)
 */
export const gdprExporter = inngest.createFunction(
	{
		id: "gdpr-exporter",
		name: "GDPR Exporter",
		retries: 3,
	},
	{ event: "jobs/gdpr-exporter.requested" },
	async ({ event, step }) => {
		const { toolJobId } = event.data;

		logger.info("[Inngest:GdprExporter] Starting job", { toolJobId });

		// Step 1: Validate job exists and is in expected state
		await step.run("validate-job", async () => {
			const job = await getToolJobById(toolJobId);
			if (!job) {
				throw new Error(`Tool job not found: ${toolJobId}`);
			}
			return { exists: true };
		});

		// Step 2: Process the GDPR data export
		// Fetches fresh job data to avoid Inngest JSON serialization issues with dates
		const result = await step.run("process-export", async () => {
			const job = await getToolJobById(toolJobId);
			if (!job) {
				throw new Error(`Tool job not found: ${toolJobId}`);
			}
			return await processGdprExportJob(job);
		});

		// Step 3: Update job status based on result
		await step.run("update-job-status", async () => {
			if (result.success && result.output !== undefined) {
				await markJobCompleted(
					toolJobId,
					result.output as Prisma.InputJsonValue,
				);
				logger.info(
					"[Inngest:GdprExporter] Job completed successfully",
					{
						toolJobId,
					},
				);
			} else {
				await markJobFailed(toolJobId, result.error ?? "Unknown error");
				logger.error("[Inngest:GdprExporter] Job failed", {
					toolJobId,
					error: result.error,
				});
			}
		});

		return {
			success: result.success,
			toolJobId,
			error: result.error,
		};
	},
);
