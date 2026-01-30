import { processNewsAnalyzerJob } from "@repo/api/modules/news-analyzer";
import type { Prisma } from "@repo/database";
import {
	getToolJobById,
	markJobCompleted,
	markJobFailed,
} from "@repo/database";
import { logger } from "@repo/logs";
import { inngest } from "../client";

/**
 * News Analyzer Inngest function
 *
 * Processes news analysis jobs by:
 * 1. Validating the tool job exists
 * 2. Running the existing processor logic (fetches fresh job data)
 * 3. Updating the job status with results
 *
 * Retry configuration:
 * - 3 attempts with exponential backoff
 * - Retries on transient failures (network, AI rate limits)
 */
export const newsAnalyzer = inngest.createFunction(
	{
		id: "news-analyzer",
		name: "News Analyzer",
		retries: 3,
	},
	{ event: "jobs/news-analyzer.requested" },
	async ({ event, step }) => {
		const { toolJobId } = event.data;

		logger.info("[Inngest:NewsAnalyzer] Starting job", { toolJobId });

		// Step 1: Validate job exists and is in expected state
		await step.run("validate-job", async () => {
			const job = await getToolJobById(toolJobId);
			if (!job) {
				throw new Error(`Tool job not found: ${toolJobId}`);
			}
			return { exists: true };
		});

		// Step 2: Process the news analysis
		// Fetches fresh job data to avoid Inngest JSON serialization issues with dates
		const result = await step.run("process-analysis", async () => {
			const job = await getToolJobById(toolJobId);
			if (!job) {
				throw new Error(`Tool job not found: ${toolJobId}`);
			}
			return await processNewsAnalyzerJob(job);
		});

		// Step 3: Update job status based on result
		await step.run("update-job-status", async () => {
			if (result.success && result.output !== undefined) {
				// Cast output to Prisma.InputJsonValue since Inngest step serialization
				// converts the type to a generic JSON object
				await markJobCompleted(
					toolJobId,
					result.output as Prisma.InputJsonValue,
				);
				logger.info(
					"[Inngest:NewsAnalyzer] Job completed successfully",
					{
						toolJobId,
					},
				);
			} else {
				await markJobFailed(toolJobId, result.error ?? "Unknown error");
				logger.error("[Inngest:NewsAnalyzer] Job failed", {
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
