import { ORPCError } from "@orpc/client";
import {
	createToolJob,
	getActiveGdprExportJob,
	getRecentGdprExportJobs,
	type Prisma,
} from "@repo/database";
import { logger } from "@repo/logs";
import { protectedProcedure } from "../../../orpc/procedures";
import {
	GDPR_EXPORTER_TOOL_SLUG,
	type GdprExporterInput,
	GdprExportRequestSchema,
} from "../types";

// Rate limit: 1 export request per 24 hours
const RATE_LIMIT_HOURS = 24;

// Export job expiration: 30 days (for cleanup)
const JOB_EXPIRATION_DAYS = 30;

export const requestExport = protectedProcedure
	.route({
		method: "POST",
		path: "/gdpr/export",
		tags: ["GDPR"],
		summary: "Request GDPR data export",
		description:
			"Request a GDPR-compliant export of all your personal data. Rate limited to 1 request per 24 hours. The export will be generated asynchronously and you will receive an email notification when it's ready.",
	})
	.input(GdprExportRequestSchema)
	.handler(async ({ input, context }) => {
		const { format } = input;
		const userId = context.user.id;
		const userEmail = context.user.email;

		logger.info(`[GdprExporter] Export requested by user: ${userId}`, {
			format,
		});

		// Check for rate limiting - 1 request per 24 hours
		const recentJobs = await getRecentGdprExportJobs(
			userId,
			RATE_LIMIT_HOURS,
		);

		if (recentJobs.length > 0) {
			const mostRecentJob = recentJobs[0];
			const cooldownEnd = new Date(
				mostRecentJob.createdAt.getTime() +
					RATE_LIMIT_HOURS * 60 * 60 * 1000,
			);
			const hoursRemaining = Math.ceil(
				(cooldownEnd.getTime() - Date.now()) / (60 * 60 * 1000),
			);

			logger.info(`[GdprExporter] Rate limit hit for user: ${userId}`, {
				lastExport: mostRecentJob.createdAt.toISOString(),
				cooldownEnd: cooldownEnd.toISOString(),
			});

			throw new ORPCError("TOO_MANY_REQUESTS", {
				message: `You can only request one data export per 24 hours. Please try again in ${hoursRemaining} hour${hoursRemaining === 1 ? "" : "s"}.`,
				data: {
					lastExportAt: mostRecentJob.createdAt.toISOString(),
					nextAvailableAt: cooldownEnd.toISOString(),
				},
			});
		}

		// Check for existing pending/processing job
		const activeJob = await getActiveGdprExportJob(userId);

		if (activeJob) {
			logger.info(
				`[GdprExporter] Active job already exists for user: ${userId}`,
				{
					jobId: activeJob.id,
					status: activeJob.status,
				},
			);

			// Return the existing job instead of creating a new one
			return {
				job: activeJob,
				message:
					"You already have a data export in progress. Please wait for it to complete.",
			};
		}

		// Create the job input
		const jobInput: GdprExporterInput = {
			userId,
			userEmail,
			format,
			requestedAt: new Date().toISOString(),
		};

		// Create the export job
		const job = await createToolJob({
			toolSlug: GDPR_EXPORTER_TOOL_SLUG,
			input: jobInput as unknown as Prisma.InputJsonValue,
			userId,
			priority: 0, // Normal priority
			maxAttempts: 3,
			expiresAt: new Date(
				Date.now() + JOB_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
			),
		});

		if (!job) {
			logger.error(
				`[GdprExporter] Failed to create export job for user: ${userId}`,
			);
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Failed to create export request. Please try again.",
			});
		}

		logger.info(`[GdprExporter] Export job created: ${job.id}`, {
			userId,
			format,
		});

		// Job will be processed by the background worker/cron
		// We don't trigger immediate processing to avoid circular dependency
		// between request-export.ts and job-runner.ts

		return {
			job,
			message:
				"Your data export has been requested. You will receive an email when it's ready to download.",
		};
	});
