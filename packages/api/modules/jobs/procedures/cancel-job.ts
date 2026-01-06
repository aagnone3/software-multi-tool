import { ORPCError } from "@orpc/client";
import { cancelToolJob, getToolJobById } from "@repo/database";
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

		return { job: cancelledJob };
	});
