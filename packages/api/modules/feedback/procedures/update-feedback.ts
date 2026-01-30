import { ORPCError } from "@orpc/client";
import { getToolFeedbackById, updateToolFeedback } from "@repo/database";
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

const updateFeedbackInputSchema = z.object({
	feedbackId: z.string(),
	chatTranscript: z.string().optional(),
	extractedData: z.record(z.string(), JsonValueSchema).optional(),
});

export const updateFeedbackProcedure = protectedProcedure
	.route({
		method: "PATCH",
		path: "/feedback/{feedbackId}",
		tags: ["Feedback"],
		summary: "Update tool feedback",
		description:
			"Updates feedback with additional chat transcript or extracted data (for AI chat follow-up)",
	})
	.input(updateFeedbackInputSchema)
	.handler(
		async ({
			input: { feedbackId, chatTranscript, extractedData },
			context: { user },
		}) => {
			// Verify feedback exists and belongs to the user
			const existingFeedback = await getToolFeedbackById(feedbackId);
			if (!existingFeedback) {
				throw new ORPCError("NOT_FOUND", {
					message: "Feedback not found",
				});
			}

			if (existingFeedback.userId !== user.id) {
				throw new ORPCError("FORBIDDEN", {
					message: "You don't have access to this feedback",
				});
			}

			try {
				await updateToolFeedback(feedbackId, user.id, {
					chatTranscript,
					extractedData,
				});

				// Fetch and return the updated feedback
				const updatedFeedback = await getToolFeedbackById(feedbackId);
				return { feedback: updatedFeedback };
			} catch (error) {
				logger.error("Failed to update tool feedback", { error });
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to update feedback",
				});
			}
		},
	);
