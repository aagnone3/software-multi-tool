import { processMeetingJob } from "@repo/api/modules/meeting-summarizer";
import type { Prisma } from "@repo/database";
import {
	getToolJobById,
	markJobCompleted,
	markJobFailed,
} from "@repo/database";
import { logger } from "@repo/logs";
import { inngest } from "../client";

/**
 * Meeting Summarizer Inngest function
 *
 * Summarizes meeting transcripts and extracts action items using Claude AI.
 *
 * Processing steps:
 * 1. Validate the tool job exists
 * 2. Parse transcript file or text, send to Claude for summarization
 * 3. Update job status with results
 *
 * Retry configuration:
 * - 3 attempts with exponential backoff
 * - Retries on transient failures (network, AI rate limits)
 */
export const meetingSummarizer = inngest.createFunction(
	{
		id: "meeting-summarizer",
		name: "Meeting Summarizer",
		retries: 3,
	},
	{ event: "jobs/meeting-summarizer.requested" },
	async ({ event, step }) => {
		const { toolJobId } = event.data;

		logger.info("[Inngest:MeetingSummarizer] Starting job", { toolJobId });

		// Step 1: Validate job exists and is in expected state
		await step.run("validate-job", async () => {
			const job = await getToolJobById(toolJobId);
			if (!job) {
				throw new Error(`Tool job not found: ${toolJobId}`);
			}
			return { exists: true };
		});

		// Step 2: Process the meeting summarization
		// Fetches fresh job data to avoid Inngest JSON serialization issues with dates
		const result = await step.run("process-meeting", async () => {
			const job = await getToolJobById(toolJobId);
			if (!job) {
				throw new Error(`Tool job not found: ${toolJobId}`);
			}
			return await processMeetingJob(job);
		});

		// Step 3: Update job status based on result
		await step.run("update-job-status", async () => {
			if (result.success && result.output !== undefined) {
				await markJobCompleted(
					toolJobId,
					result.output as Prisma.InputJsonValue,
				);
				logger.info(
					"[Inngest:MeetingSummarizer] Job completed successfully",
					{
						toolJobId,
					},
				);
			} else {
				await markJobFailed(toolJobId, result.error ?? "Unknown error");
				logger.error("[Inngest:MeetingSummarizer] Job failed", {
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
