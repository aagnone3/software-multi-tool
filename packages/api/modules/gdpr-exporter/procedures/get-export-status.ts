import { ORPCError } from "@orpc/client";
import { getToolJobById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { GDPR_EXPORTER_TOOL_SLUG, type GdprExporterOutput } from "../types";

const GetExportStatusInputSchema = z.object({
	jobId: z.string().min(1),
});

export const getExportStatus = protectedProcedure
	.route({
		method: "GET",
		path: "/gdpr/export/{jobId}",
		tags: ["GDPR"],
		summary: "Get GDPR export status",
		description:
			"Check the status of a GDPR data export request. Returns the download URL when the export is complete.",
	})
	.input(GetExportStatusInputSchema)
	.handler(async ({ input, context }) => {
		const { jobId } = input;
		const userId = context.user.id;

		const job = await getToolJobById(jobId);

		if (!job) {
			throw new ORPCError("NOT_FOUND", {
				message: "Export job not found",
			});
		}

		// Verify ownership
		if (job.userId !== userId) {
			throw new ORPCError("FORBIDDEN", {
				message: "You don't have permission to view this export",
			});
		}

		// Verify this is a GDPR export job
		if (job.toolSlug !== GDPR_EXPORTER_TOOL_SLUG) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Invalid export job",
			});
		}

		// Build response based on status
		const response: {
			jobId: string;
			status: string;
			createdAt: string;
			completedAt: string | null;
			downloadUrl?: string;
			expiresAt?: string;
			error?: string;
		} = {
			jobId: job.id,
			status: job.status,
			createdAt: job.createdAt.toISOString(),
			completedAt: job.completedAt?.toISOString() ?? null,
		};

		if (job.status === "COMPLETED" && job.output) {
			const output = job.output as unknown as GdprExporterOutput;
			response.downloadUrl = output.downloadUrl;
			response.expiresAt = output.expiresAt;
		}

		if (job.status === "FAILED" && job.error) {
			response.error = job.error;
		}

		return response;
	});
