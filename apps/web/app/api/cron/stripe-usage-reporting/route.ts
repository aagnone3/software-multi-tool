import {
	findBalancesNeedingUsageReport,
	markUsageReported,
} from "@repo/api/lib/credits";
import { logger } from "@repo/logs";
import { reportOverageToStripe } from "@repo/payments/provider/stripe/usage";
import { NextResponse } from "next/server";

/**
 * Cron endpoint for reporting credit overage to Stripe
 *
 * This endpoint runs daily (or more frequently) to report overage usage
 * to Stripe for metered billing.
 *
 * Responsibilities:
 * - Find credit balances with overage that haven't been reported
 * - Report usage to Stripe for each subscription
 * - Mark balances as reported to prevent duplicate billing
 *
 * Can be configured in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/stripe-usage-reporting",
 *     "schedule": "0 2 * * *"  // Run at 2 AM daily
 *   }]
 * }
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

		logger.info("[Cron:StripeUsage] Starting Stripe usage reporting cycle");

		// Find all balances that need reporting
		const balancesToReport = await findBalancesNeedingUsageReport();

		logger.info(
			`[Cron:StripeUsage] Found ${balancesToReport.length} balances needing usage report`,
		);

		if (balancesToReport.length === 0) {
			return NextResponse.json({
				success: true,
				message: "No balances needing usage report",
				reported: 0,
				skipped: 0,
				failed: 0,
				timestamp: new Date().toISOString(),
			});
		}

		let reported = 0;
		let skipped = 0;
		let failed = 0;
		const errors: Array<{ organizationId: string; error: string }> = [];

		for (const balance of balancesToReport) {
			const { organization, overage, periodEnd, id: balanceId } = balance;
			const subscriptionId = organization.purchases[0]?.subscriptionId;

			// Skip if no active subscription
			if (!subscriptionId) {
				logger.warn(
					`[Cron:StripeUsage] No subscription found for organization ${organization.id}, skipping`,
				);
				skipped++;

				// Mark as reported to avoid re-processing
				// (organization has no subscription to bill)
				await markUsageReported(balanceId);
				continue;
			}

			logger.info(
				`[Cron:StripeUsage] Reporting ${overage} overage credits for org ${organization.id}`,
				{
					subscriptionId,
					overage,
					periodEnd: periodEnd.toISOString(),
				},
			);

			// Report to Stripe
			const result = await reportOverageToStripe({
				subscriptionId,
				overageCredits: overage,
				periodEnd,
			});

			if (result.success) {
				// Mark as reported
				await markUsageReported(balanceId);
				reported++;

				logger.info(
					`[Cron:StripeUsage] Successfully reported usage for org ${organization.id}`,
					{
						usageRecordId: result.usageRecord?.id,
					},
				);
			} else if (result.skipped) {
				// Skipped (e.g., no overage item on subscription)
				// Mark as reported to avoid re-processing
				await markUsageReported(balanceId);
				skipped++;

				logger.warn(
					`[Cron:StripeUsage] Skipped reporting for org ${organization.id}: ${result.error}`,
				);
			} else {
				// Actual failure - don't mark as reported so we retry next time
				failed++;
				errors.push({
					organizationId: organization.id,
					error: result.error ?? "Unknown error",
				});

				logger.error(
					`[Cron:StripeUsage] Failed to report usage for org ${organization.id}: ${result.error}`,
				);
			}
		}

		const summary = {
			success: true,
			reported,
			skipped,
			failed,
			total: balancesToReport.length,
			errors: errors.length > 0 ? errors : undefined,
			timestamp: new Date().toISOString(),
		};

		logger.info(
			"[Cron:StripeUsage] Stripe usage reporting completed",
			summary,
		);

		return NextResponse.json(summary);
	} catch (error) {
		logger.error("[Cron:StripeUsage] Stripe usage reporting failed", error);

		return NextResponse.json(
			{
				error: "Stripe usage reporting failed",
				message:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
