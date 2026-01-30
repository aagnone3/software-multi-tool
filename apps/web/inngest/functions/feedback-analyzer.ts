import { processFeedbackJob } from "@repo/api/modules/feedback-analyzer";
import type { Prisma } from "@repo/database";
import {
	getToolJobById,
	markJobCompleted,
	markJobFailed,
} from "@repo/database";
import { logger } from "@repo/logs";
import { inngest } from "../client";

/**
 * Feedback Analyzer Inngest function
 *
 * Analyzes customer feedback for sentiment, themes, and actionable insights using Claude AI.
 *
 * Processing steps:
 * 1. Validate the tool job exists
 * 2. Parse feedback text, send to Claude for analysis
 * 3. Update job status with results
 *
 * Retry configuration:
 * - 3 attempts with exponential backoff
 * - Retries on transient failures (network, AI rate limits)
 */
export const feedbackAnalyzer = inngest.createFunction(
	{
		id: "feedback-analyzer",
		name: "Feedback Analyzer",
		retries: 3,
	},
	{ event: "jobs/feedback-analyzer.requested" },
	async ({ event, step }) => {
		const { toolJobId } = event.data;

		logger.info("[Inngest:FeedbackAnalyzer] Starting job", { toolJobId });

		// Step 1: Validate job exists and is in expected state
		await step.run("validate-job", async () => {
			const job = await getToolJobById(toolJobId);
			if (!job) {
				throw new Error(`Tool job not found: ${toolJobId}`);
			}
			return { exists: true };
		});

		// Step 2: Process the feedback analysis
		// Fetches fresh job data to avoid Inngest JSON serialization issues with dates
		const result = await step.run("process-feedback", async () => {
			const job = await getToolJobById(toolJobId);
			if (!job) {
				throw new Error(`Tool job not found: ${toolJobId}`);
			}
			return await processFeedbackJob(job);
		});

		// Step 3: Update job status based on result
		await step.run("update-job-status", async () => {
			if (result.success && result.output !== undefined) {
				await markJobCompleted(
					toolJobId,
					result.output as Prisma.InputJsonValue,
				);
				logger.info(
					"[Inngest:FeedbackAnalyzer] Job completed successfully",
					{
						toolJobId,
					},
				);
			} else {
				await markJobFailed(toolJobId, result.error ?? "Unknown error");
				logger.error("[Inngest:FeedbackAnalyzer] Job failed", {
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
