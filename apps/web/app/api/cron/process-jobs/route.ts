import {
	handleStuckJobs,
	runCleanup,
} from "@repo/api/modules/jobs/lib/job-runner";
import { logger } from "@repo/logs";
import { NextResponse } from "next/server";

/**
 * @deprecated Use /api/cron/job-maintenance instead
 *
 * This endpoint is kept for backwards compatibility during migration.
 * It now only performs maintenance tasks - Inngest functions handle actual job processing.
 *
 * Migration: Update vercel.json to use /api/cron/job-maintenance
 */
export async function GET(request: Request) {
	try {
		// Verify the request is from a cron job
		const authHeader = request.headers.get("authorization");
		const cronSecret = process.env.CRON_SECRET;

		if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		logger.info(
			"[Cron] DEPRECATED: /api/cron/process-jobs called. Use /api/cron/job-maintenance instead.",
		);

		// Only perform maintenance - Inngest handles job processing now
		const stuckResult = await handleStuckJobs(30);
		const cleanupResult = await runCleanup();

		return NextResponse.json({
			success: true,
			deprecated: true,
			message:
				"This endpoint is deprecated. Please migrate to /api/cron/job-maintenance",
			stuckJobsMarkedFailed: stuckResult.count,
			expiredJobsDeleted: cleanupResult.deleted,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		logger.error("[Cron] Job maintenance failed", error);

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
