import {
	handleStuckJobs,
	runCleanup,
} from "@repo/api/modules/jobs/lib/job-runner";
import { logger } from "@repo/logs";
import { NextResponse } from "next/server";

/**
 * Cron endpoint for job maintenance tasks
 *
 * This endpoint handles maintenance only - Inngest functions handle actual job processing.
 *
 * Responsibilities:
 * 1. Mark stuck jobs as failed - Processing jobs older than 30 minutes (fallback)
 * 2. Clean up expired jobs - Delete old completed/failed jobs
 *
 * Timeout Architecture (see job-config.ts for details):
 * - Inngest step timeout: up to 2 hours per step
 * - Stuck job cleanup: 30 minutes (fallback for edge cases)
 *
 * Can be configured in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/job-maintenance",
 *     "schedule": "* * * * *"
 *   }]
 * }
 */
export async function GET(request: Request) {
	try {
		// Verify the request is from a cron job (optional, but recommended for production)
		const authHeader = request.headers.get("authorization");
		const cronSecret = process.env.CRON_SECRET;

		if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		logger.info("[Cron:Maintenance] Starting job maintenance cycle");

		// 1. Mark stuck jobs as failed (stuck for > 30 minutes)
		// These are jobs that started processing but never completed
		// The 30-minute timeout allows Inngest retries to complete first
		const stuckResult = await handleStuckJobs();
		if (stuckResult.count > 0) {
			logger.warn(
				`[Cron:Maintenance] Marked ${stuckResult.count} stuck jobs as failed`,
			);
		}

		// 2. Cleanup expired jobs (completed/failed jobs older than retention period)
		// Default: 7 days for completed, 14 days for failed
		const cleanupResult = await runCleanup();
		if (cleanupResult.deleted > 0) {
			logger.info(
				`[Cron:Maintenance] Cleaned up ${cleanupResult.deleted} expired jobs`,
			);
		}

		return NextResponse.json({
			success: true,
			stuckJobsMarkedFailed: stuckResult.count,
			expiredJobsDeleted: cleanupResult.deleted,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		logger.error("[Cron:Maintenance] Job maintenance failed", error);

		return NextResponse.json(
			{
				error: "Job maintenance failed",
				message:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
