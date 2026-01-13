import {
	handleStuckJobs,
	runCleanup,
} from "@repo/api/modules/jobs/lib/job-runner";
import { logger } from "@repo/logs";
import { NextResponse } from "next/server";

/**
 * Cron endpoint for job maintenance tasks
 *
 * This endpoint handles maintenance only - pg-boss workers handle actual job processing.
 *
 * Responsibilities:
 * - Mark stuck jobs as failed (processing for > 30 minutes)
 * - Clean up expired jobs (completed/failed jobs older than 7 days)
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
		// Usually indicates worker crash or timeout
		const stuckResult = await handleStuckJobs(30);
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
