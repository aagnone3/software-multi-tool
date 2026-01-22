import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { getSignedUrl } from "@repo/storage";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

const getDownloadUrlInputSchema = z.object({
	fileId: z.string().min(1),
});

export const getDownloadUrl = protectedProcedure
	.route({
		method: "GET",
		path: "/files/{fileId}/download-url",
		tags: ["Files"],
		summary: "Get a download URL for a file",
		description:
			"Generate a signed download URL for a file. URL is valid for 1 hour.",
	})
	.input(getDownloadUrlInputSchema)
	.handler(async ({ context: { session }, input }) => {
		const organizationId = session.activeOrganizationId;
		if (!organizationId) {
			throw new ORPCError("BAD_REQUEST", {
				message: "An active organization is required to download files",
			});
		}

		const { fileId } = input;

		// Get the file record
		const file = await db.file.findUnique({
			where: { id: fileId },
		});

		if (!file) {
			throw new ORPCError("NOT_FOUND", {
				message: "File not found",
			});
		}

		// Verify the file belongs to the organization
		if (file.organizationId !== organizationId) {
			throw new ORPCError("FORBIDDEN", {
				message: "You do not have permission to access this file",
			});
		}

		// Generate signed download URL (valid for 1 hour)
		const downloadUrl = await getSignedUrl(file.storagePath, {
			bucket: file.bucket,
			expiresIn: 3600,
		});

		return {
			downloadUrl,
			filename: file.filename,
			mimeType: file.mimeType,
		};
	});
