import { ORPCError } from "@orpc/client";
import { getToolJobById } from "@repo/database";
import { publicProcedure } from "../../../orpc/procedures";
import { GetJobInputSchema } from "../types";

export const getJob = publicProcedure
	.route({
		method: "GET",
		path: "/jobs/{jobId}",
		tags: ["Jobs"],
		summary: "Get job",
		description: "Get the status and result of a job by ID",
	})
	.input(GetJobInputSchema)
	.handler(async ({ input, context }) => {
		const { jobId } = input;

		const job = await getToolJobById(jobId);

		if (!job) {
			throw new ORPCError("NOT_FOUND", {
				message: "Job not found",
			});
		}

		// Check ownership - job should be accessible if:
		// 1. User is authenticated and owns the job
		// 2. Request has matching sessionId (checked via header)
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

		return { job };
	});
