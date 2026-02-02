import { getToolFeedbackStats } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

const getFeedbackStatsInputSchema = z.object({
	toolSlug: z.string().optional(),
});

export const getFeedbackStatsProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/feedback/stats",
		tags: ["Feedback"],
		summary: "Get feedback statistics",
		description:
			"Returns aggregated feedback statistics, optionally filtered by tool",
	})
	.input(getFeedbackStatsInputSchema)
	.handler(async ({ input }) => {
		const stats = await getToolFeedbackStats(input.toolSlug);
		return { stats };
	});
