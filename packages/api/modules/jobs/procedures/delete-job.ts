import { ORPCError } from "@orpc/client";
import { deleteToolJob, getToolJobById } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";

const DeleteJobInputSchema = z.object({
	jobId: z.string().cuid(),
});

export const deleteJob = publicProcedure
	.route({
		method: "DELETE",
		path: "/jobs/{jobId}",
		tags: ["Jobs"],
		summary: "Delete job",
		description: "Permanently delete a job and its results",
	})
	.input(DeleteJobInputSchema)
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

		// Delete the job
		await deleteToolJob(jobId);

		return { success: true };
	});
