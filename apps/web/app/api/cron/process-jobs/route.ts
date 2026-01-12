import {
	handleStuckJobs,
	processAllPendingJobs,
	retryFailedJobs,
	runCleanup,
} from "@repo/api/modules/jobs/lib/job-runner";
import { logger } from "@repo/logs";
import { NextResponse } from "next/server";

/**
 * Cron endpoint to process pending jobs
 * This acts as a safety net for jobs that failed immediate processing
 * and handles retry logic for failed jobs
 *
 * Can be configured in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/process-jobs",
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

		logger.info("[Cron] Starting job processing cycle");

		// 1. Mark stuck jobs as failed (stuck for > 30 minutes)
		const stuckResult = await handleStuckJobs(30);
		logger.info(`[Cron] Marked ${stuckResult.count} stuck jobs as failed`);

		// 2. Retry failed jobs that are ready for retry
		const retryResult = await retryFailedJobs();
		logger.info(`[Cron] Requeued ${retryResult.retried} jobs for retry`);

		// 3. Process pending jobs (limit to 10 per cron run to avoid timeout)
		const processResult = await processAllPendingJobs(undefined, 10);
		logger.info(
			`[Cron] Processed ${processResult.processed} jobs: ${processResult.jobIds.join(", ")}`,
		);

		// 4. Cleanup expired jobs (older than 7 days)
		const cleanupResult = await runCleanup();
		logger.info(`[Cron] Cleaned up ${cleanupResult.deleted} expired jobs`);

		return NextResponse.json({
			success: true,
			stuckJobsMarkedFailed: stuckResult.count,
			jobsRequeued: retryResult.retried,
			jobsProcessed: processResult.processed,
			jobIds: processResult.jobIds,
			expiredJobsDeleted: cleanupResult.deleted,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		logger.error("[Cron] Job processing failed", error);

		return NextResponse.json(
			{
				error: "Job processing failed",
				message:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
