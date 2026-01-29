import { processExpenseJob } from "@repo/api/modules/expense-categorizer";
import type { Prisma } from "@repo/database";
import {
	getToolJobById,
	markJobCompleted,
	markJobFailed,
} from "@repo/database";
import { logger } from "@repo/logs";
import { inngest } from "../client";

/**
 * Expense Categorizer Inngest function
 *
 * Categorizes business expenses for tax purposes using Claude AI.
 *
 * Processing steps:
 * 1. Validate the tool job exists
 * 2. Format expense list, send to Claude for categorization
 * 3. Update job status with results
 *
 * Retry configuration:
 * - 3 attempts with exponential backoff
 * - Retries on transient failures (network, AI rate limits)
 */
export const expenseCategorizer = inngest.createFunction(
	{
		id: "expense-categorizer",
		name: "Expense Categorizer",
		retries: 3,
	},
	{ event: "jobs/expense-categorizer.requested" },
	async ({ event, step }) => {
		const { toolJobId } = event.data;

		logger.info("[Inngest:ExpenseCategorizer] Starting job", { toolJobId });

		// Step 1: Validate job exists and is in expected state
		await step.run("validate-job", async () => {
			const job = await getToolJobById(toolJobId);
			if (!job) {
				throw new Error(`Tool job not found: ${toolJobId}`);
			}
			return { exists: true };
		});

		// Step 2: Process the expense categorization
		// Fetches fresh job data to avoid Inngest JSON serialization issues with dates
		const result = await step.run("process-expenses", async () => {
			const job = await getToolJobById(toolJobId);
			if (!job) {
				throw new Error(`Tool job not found: ${toolJobId}`);
			}
			return await processExpenseJob(job);
		});

		// Step 3: Update job status based on result
		await step.run("update-job-status", async () => {
			if (result.success && result.output !== undefined) {
				await markJobCompleted(
					toolJobId,
					result.output as Prisma.InputJsonValue,
				);
				logger.info(
					"[Inngest:ExpenseCategorizer] Job completed successfully",
					{
						toolJobId,
					},
				);
			} else {
				await markJobFailed(toolJobId, result.error ?? "Unknown error");
				logger.error("[Inngest:ExpenseCategorizer] Job failed", {
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
