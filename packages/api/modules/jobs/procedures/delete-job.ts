import { ORPCError } from "@orpc/client";
import { deleteToolJob, getToolJobById } from "@repo/database";
import { logger } from "@repo/logs";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { deleteAudioFromStorage } from "../../speaker-separation/lib/audio-storage";

const DeleteJobInputSchema = z.object({
	jobId: z.string().min(1),
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

		// Delete audio file from storage if present
		if (job.audioFileUrl) {
			logger.info(
				`[DeleteJob] Cleaning up audio storage: ${job.audioFileUrl}`,
			);
			try {
				await deleteAudioFromStorage(job.audioFileUrl);
			} catch (error) {
				// Log but don't fail - the job should still be deleted
				logger.warn(
					`[DeleteJob] Failed to delete audio from storage: ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		}

		// Delete the job
		await deleteToolJob(jobId);

		return { success: true };
	});
