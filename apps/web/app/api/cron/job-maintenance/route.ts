import {
	handleStuckJobs,
	reconcileJobStates,
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
 * 1. Reconcile job states - Sync pg-boss state with ToolJob records (first, before stuck check)
 * 2. Mark stuck jobs as failed - Processing jobs older than 30 minutes (fallback)
 * 3. Clean up expired jobs - Delete old completed/failed jobs
 *
 * The reconciliation step runs first because it can identify jobs that pg-boss has
 * already marked as complete/failed/expired, preventing the stuck job handler from
 * incorrectly marking them as failed.
 *
 * Timeout Architecture (see job-config.ts for details):
 * - pg-boss expiration: 10 minutes (triggers onExpire handler)
 * - Stuck job cleanup: 30 minutes (fallback for state divergence)
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

		// 1. Reconcile job states first
		// This syncs pg-boss state with ToolJob records for jobs that have
		// completed/failed/expired in pg-boss but still show PROCESSING in ToolJob
		const reconcileResult = await reconcileJobStates();
		if (!reconcileResult.success) {
			logger.error(
				`[Cron:Maintenance] Job reconciliation failed: ${reconcileResult.error}`,
			);
		} else if (reconcileResult.synced > 0) {
			logger.info(
				`[Cron:Maintenance] Reconciled ${reconcileResult.synced} jobs (completed: ${reconcileResult.completed}, failed: ${reconcileResult.failed}, expired: ${reconcileResult.expired})`,
			);
		}

		// 2. Mark stuck jobs as failed (stuck for > 30 minutes)
		// These are jobs that started processing but never completed
		// The 30-minute timeout is intentionally longer than the pg-boss
		// expiration (10 min) to allow normal expiration handling first
		const stuckResult = await handleStuckJobs();
		if (stuckResult.count > 0) {
			logger.warn(
				`[Cron:Maintenance] Marked ${stuckResult.count} stuck jobs as failed`,
			);
		}

		// 3. Cleanup expired jobs (completed/failed jobs older than retention period)
		// Default: 7 days for completed, 14 days for failed
		const cleanupResult = await runCleanup();
		if (cleanupResult.deleted > 0) {
			logger.info(
				`[Cron:Maintenance] Cleaned up ${cleanupResult.deleted} expired jobs`,
			);
		}

		return NextResponse.json({
			success: true,
			reconciled: reconcileResult.synced,
			reconciledDetails: {
				completed: reconcileResult.completed,
				failed: reconcileResult.failed,
				expired: reconcileResult.expired,
				success: reconcileResult.success,
				...(reconcileResult.error && { error: reconcileResult.error }),
			},
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
