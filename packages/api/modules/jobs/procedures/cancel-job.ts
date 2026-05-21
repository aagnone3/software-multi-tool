import { ORPCError } from "@orpc/client";
import { cancelToolJob, getToolJobById } from "@repo/database";
import { logger } from "@repo/logs";
import { refundCreditsForJob } from "../../../lib/credits";
import { publicProcedure } from "../../../orpc/procedures";
import { CancelJobInputSchema } from "../types";

export const cancelJob = publicProcedure
	.route({
		method: "POST",
		path: "/jobs/{jobId}/cancel",
		tags: ["Jobs"],
		summary: "Cancel job",
		description: "Cancel a pending job",
	})
	.input(CancelJobInputSchema)
	.handler(async ({ input, context }) => {
		const { jobId } = input;

		const job = await getToolJobById(jobId);

		if (!job) {
			throw new ORPCError("NOT_FOUND", {
				message: "Job not found",
			});
		}

		// Check ownership
		let userId: string | undefined;
		try {
			const { auth } = await import("@repo/auth");
			const session = await auth.api.getSession({
				headers: context.headers,
			});
			userId = session?.user?.id;
		} catch {
			// Not authenticated
		}

		const requestSessionId = context.headers.get("x-session-id");

		const isOwner =
			(userId && job.userId === userId) ||
			(requestSessionId && job.sessionId === requestSessionId);

		if (!isOwner) {
			throw new ORPCError("FORBIDDEN", {
				message: "You do not have access to this job",
			});
		}

		// Can only cancel pending jobs
		if (job.status !== "PENDING") {
			throw new ORPCError("BAD_REQUEST", {
				message: `Cannot cancel job with status: ${job.status}`,
			});
		}

		const cancelledJob = await cancelToolJob(jobId);

		// Refund the up-front credit deduction so the user isn't charged
		// for work that was cancelled before it started. Safe to call for
		// anonymous jobs (no deduction → no-op).
		await refundCreditsForJob(jobId, "Refund for cancelled job").catch(
			(error) => {
				logger.error(
					`[CancelJob] Failed to refund credits for job ${jobId}`,
					{
						error:
							error instanceof Error
								? error.message
								: String(error),
					},
				);
			},
		);

		return { job: cancelledJob };
	});
