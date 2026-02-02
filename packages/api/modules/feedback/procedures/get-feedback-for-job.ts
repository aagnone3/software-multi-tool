import { getUserFeedbackForJob } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

const getFeedbackForJobInputSchema = z.object({
	jobId: z.string().min(1),
});

export const getFeedbackForJobProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/feedback/job/{jobId}",
		tags: ["Feedback"],
		summary: "Get user's feedback for a job",
		description:
			"Returns the authenticated user's feedback for a specific job, if any",
	})
	.input(getFeedbackForJobInputSchema)
	.handler(async ({ input: { jobId }, context: { user } }) => {
		const feedback = await getUserFeedbackForJob(user.id, jobId);
		return { feedback };
	});
