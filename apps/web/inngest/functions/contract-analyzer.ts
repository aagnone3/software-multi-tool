import { processContractJob } from "@repo/api/modules/contract-analyzer";
import type { Prisma } from "@repo/database";
import {
	getToolJobById,
	markJobCompleted,
	markJobFailed,
} from "@repo/database";
import { logger } from "@repo/logs";
import { inngest } from "../client";

/**
 * Contract Analyzer Inngest function
 *
 * Analyzes legal contracts for risks, terms, and obligations using Claude AI.
 *
 * Processing steps:
 * 1. Validate the tool job exists
 * 2. Extract text from file or use pasted text, send to Claude
 * 3. Update job status with results
 *
 * Retry configuration:
 * - 3 attempts with exponential backoff
 * - Retries on transient failures (network, AI rate limits)
 */
export const contractAnalyzer = inngest.createFunction(
	{
		id: "contract-analyzer",
		name: "Contract Analyzer",
		retries: 3,
	},
	{ event: "jobs/contract-analyzer.requested" },
	async ({ event, step }) => {
		const { toolJobId } = event.data;

		logger.info("[Inngest:ContractAnalyzer] Starting job", { toolJobId });

		// Step 1: Validate job exists and is in expected state
		await step.run("validate-job", async () => {
			const job = await getToolJobById(toolJobId);
			if (!job) {
				throw new Error(`Tool job not found: ${toolJobId}`);
			}
			return { exists: true };
		});

		// Step 2: Process the contract analysis
		// Fetches fresh job data to avoid Inngest JSON serialization issues with dates
		const result = await step.run("process-contract", async () => {
			const job = await getToolJobById(toolJobId);
			if (!job) {
				throw new Error(`Tool job not found: ${toolJobId}`);
			}
			return await processContractJob(job);
		});

		// Step 3: Update job status based on result
		await step.run("update-job-status", async () => {
			if (result.success && result.output !== undefined) {
				await markJobCompleted(
					toolJobId,
					result.output as Prisma.InputJsonValue,
				);
				logger.info(
					"[Inngest:ContractAnalyzer] Job completed successfully",
					{
						toolJobId,
					},
				);
			} else {
				await markJobFailed(toolJobId, result.error ?? "Unknown error");
				logger.error("[Inngest:ContractAnalyzer] Job failed", {
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
