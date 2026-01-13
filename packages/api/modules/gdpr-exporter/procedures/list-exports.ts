import { getToolJobsByUserId } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { GDPR_EXPORTER_TOOL_SLUG, type GdprExporterOutput } from "../types";

const ListExportsInputSchema = z.object({
	limit: z.number().min(1).max(50).default(10),
	offset: z.number().min(0).default(0),
});

export const listExports = protectedProcedure
	.route({
		method: "GET",
		path: "/gdpr/exports",
		tags: ["GDPR"],
		summary: "List GDPR export history",
		description:
			"Get a list of your previous GDPR data export requests and their status.",
	})
	.input(ListExportsInputSchema)
	.handler(async ({ input, context }) => {
		const { limit, offset } = input;
		const userId = context.user.id;

		const jobs = await getToolJobsByUserId({
			userId,
			toolSlug: GDPR_EXPORTER_TOOL_SLUG,
			limit,
			offset,
		});

		// Transform jobs into export records
		const exports = jobs.map((job) => {
			const output = job.output as unknown as GdprExporterOutput | null;

			return {
				jobId: job.id,
				status: job.status,
				createdAt: job.createdAt.toISOString(),
				completedAt: job.completedAt?.toISOString() ?? null,
				downloadUrl:
					job.status === "COMPLETED" ? output?.downloadUrl : undefined,
				expiresAt:
					job.status === "COMPLETED" ? output?.expiresAt : undefined,
				totalRecords:
					job.status === "COMPLETED" ? output?.totalRecords : undefined,
				error: job.status === "FAILED" ? job.error : undefined,
			};
		});

		return {
			exports,
			pagination: {
				limit,
				offset,
				hasMore: exports.length === limit,
			},
		};
	});
