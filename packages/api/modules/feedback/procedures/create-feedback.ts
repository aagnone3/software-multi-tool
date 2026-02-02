import { ORPCError } from "@orpc/client";
import { createToolFeedback, getToolJobById, zodSchemas } from "@repo/database";
import { logger } from "@repo/logs";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

// JSON value schema compatible with Prisma.InputJsonValue
const JsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
	z.union([
		z.string(),
		z.number(),
		z.boolean(),
		z.null(),
		z.array(JsonValueSchema),
		z.record(z.string(), JsonValueSchema),
	]),
);

const createFeedbackInputSchema = z.object({
	toolSlug: z.string().min(1),
	rating: zodSchemas.FeedbackRatingSchema,
	jobId: z.string().optional(),
	chatTranscript: z.string().optional(),
	extractedData: z.record(z.string(), JsonValueSchema).optional(),
});

export const createFeedbackProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/feedback",
		tags: ["Feedback"],
		summary: "Create tool feedback",
		description:
			"Creates feedback for a tool, with optional job reference and chat transcript",
	})
	.input(createFeedbackInputSchema)
	.handler(
		async ({
			input: { toolSlug, rating, jobId, chatTranscript, extractedData },
			context: { user },
		}) => {
			// If jobId is provided, verify it exists and belongs to the user
			if (jobId) {
				const job = await getToolJobById(jobId);
				if (!job) {
					throw new ORPCError("NOT_FOUND", {
						message: "Tool job not found",
					});
				}
				// Verify the job belongs to this user
				if (job.userId !== user.id) {
					throw new ORPCError("FORBIDDEN", {
						message: "You don't have access to this job",
					});
				}
				// Verify the toolSlug matches the job
				if (job.toolSlug !== toolSlug) {
					throw new ORPCError("BAD_REQUEST", {
						message: "Tool slug does not match the job",
					});
				}
			}

			try {
				const feedback = await createToolFeedback({
					toolSlug,
					userId: user.id,
					rating,
					jobId,
					chatTranscript,
					extractedData,
				});

				return { feedback };
			} catch (error) {
				logger.error("Failed to create tool feedback", { error });
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to create feedback",
				});
			}
		},
	);
