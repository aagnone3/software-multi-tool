import { ORPCError } from "@orpc/client";
import { getNewsAnalysisById } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";

const GetNewsAnalysisInputSchema = z.object({
	analysisId: z.string().min(1, "Analysis ID is required"),
});

export const getNewsAnalysis = publicProcedure
	.route({
		method: "GET",
		path: "/share/news-analyzer/{analysisId}",
		tags: ["Share"],
		summary: "Get shared news analysis",
		description:
			"Fetch a news analysis by ID for public sharing. No authentication required.",
	})
	.input(GetNewsAnalysisInputSchema)
	.handler(async ({ input }) => {
		const { analysisId } = input;

		const analysis = await getNewsAnalysisById(analysisId);

		if (!analysis) {
			throw new ORPCError("NOT_FOUND", {
				message: "Analysis not found",
			});
		}

		return {
			analysis: {
				id: analysis.id,
				title: analysis.title,
				sourceUrl: analysis.sourceUrl,
				sourceText: analysis.sourceText,
				analysis: analysis.analysis,
				createdAt: analysis.createdAt,
				createdBy: analysis.user?.name ?? "Anonymous",
			},
		};
	});
