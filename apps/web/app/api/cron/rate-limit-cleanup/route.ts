import { cleanupExpiredEntries } from "@repo/api/lib/rate-limit";
import { logger } from "@repo/logs";
import { NextResponse } from "next/server";

/**
 * Cron endpoint to clean up expired rate limit entries
 * This should be called periodically (e.g., daily) by a cron job
 *
 * Can be configured in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/rate-limit-cleanup",
 *     "schedule": "0 0 * * *"
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

		const count = await cleanupExpiredEntries();

		logger.info(
			`Rate limit cleanup completed: ${count} expired entries removed`,
		);

		return NextResponse.json({
			success: true,
			deletedCount: count,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		logger.error("Rate limit cleanup failed", error);

		return NextResponse.json(
			{
				error: "Rate limit cleanup failed",
				message:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
