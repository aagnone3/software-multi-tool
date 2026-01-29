import { processInvoiceJob } from "@repo/api/modules/invoice-processor";
import type { Prisma } from "@repo/database";
import {
	getToolJobById,
	markJobCompleted,
	markJobFailed,
} from "@repo/database";
import { logger } from "@repo/logs";
import { inngest } from "../client";

/**
 * Invoice Processor Inngest function
 *
 * Extracts structured data from invoice documents using Claude AI.
 *
 * Processing steps:
 * 1. Validate the tool job exists
 * 2. Fetch file from storage, extract text (PDF/OCR), send to Claude
 * 3. Update job status with results
 *
 * Retry configuration:
 * - 3 attempts with exponential backoff
 * - Retries on transient failures (network, AI rate limits)
 */
export const invoiceProcessor = inngest.createFunction(
	{
		id: "invoice-processor",
		name: "Invoice Processor",
		retries: 3,
	},
	{ event: "jobs/invoice-processor.requested" },
	async ({ event, step }) => {
		const { toolJobId } = event.data;

		logger.info("[Inngest:InvoiceProcessor] Starting job", { toolJobId });

		// Step 1: Validate job exists and is in expected state
		await step.run("validate-job", async () => {
			const job = await getToolJobById(toolJobId);
			if (!job) {
				throw new Error(`Tool job not found: ${toolJobId}`);
			}
			return { exists: true };
		});

		// Step 2: Process the invoice
		// Fetches fresh job data to avoid Inngest JSON serialization issues with dates
		const result = await step.run("process-invoice", async () => {
			const job = await getToolJobById(toolJobId);
			if (!job) {
				throw new Error(`Tool job not found: ${toolJobId}`);
			}
			return await processInvoiceJob(job);
		});

		// Step 3: Update job status based on result
		await step.run("update-job-status", async () => {
			if (result.success && result.output !== undefined) {
				await markJobCompleted(
					toolJobId,
					result.output as Prisma.InputJsonValue,
				);
				logger.info(
					"[Inngest:InvoiceProcessor] Job completed successfully",
					{
						toolJobId,
					},
				);
			} else {
				await markJobFailed(toolJobId, result.error ?? "Unknown error");
				logger.error("[Inngest:InvoiceProcessor] Job failed", {
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
