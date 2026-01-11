import { deleteExpiredAuditLogs } from "@repo/database";
import { logger } from "@repo/logs";
import { NextResponse } from "next/server";

/**
 * Cron endpoint to clean up expired audit log entries
 * This should be called periodically (e.g., daily) by a cron job
 *
 * Default retention is 90 days, configurable per audit log entry.
 *
 * Can be configured in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/audit-log-cleanup",
 *     "schedule": "0 2 * * *"
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

		const count = await deleteExpiredAuditLogs();

		logger.info(
			`Audit log cleanup completed: ${count} expired entries removed`,
		);

		return NextResponse.json({
			success: true,
			deletedCount: count,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		logger.error("Audit log cleanup failed", error);

		return NextResponse.json(
			{
				error: "Audit log cleanup failed",
				message:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
