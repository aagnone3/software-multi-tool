import { countToolFeedback, getToolFeedback, zodSchemas } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

const listFeedbackInputSchema = z.object({
	limit: z.number().min(1).max(100).default(25),
	offset: z.number().min(0).default(0),
	toolSlug: z.string().optional(),
	rating: zodSchemas.FeedbackRatingSchema.optional(),
	myFeedbackOnly: z.boolean().optional(),
});

export const listFeedbackProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/feedback",
		tags: ["Feedback"],
		summary: "List tool feedback",
		description:
			"Lists feedback with optional filters for tool, rating, and user",
	})
	.input(listFeedbackInputSchema)
	.handler(async ({ input, context }) => {
		const { limit, offset, toolSlug, rating, myFeedbackOnly } = input;
		const userId = myFeedbackOnly ? context.user.id : undefined;

		const [feedbackItems, total] = await Promise.all([
			getToolFeedback({
				limit,
				offset,
				toolSlug,
				userId,
				rating,
			}),
			countToolFeedback({
				toolSlug,
				userId,
				rating,
			}),
		]);

		return { feedback: feedbackItems, total };
	});
