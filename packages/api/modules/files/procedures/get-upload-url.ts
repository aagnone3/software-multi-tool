import { ORPCError } from "@orpc/server";
import { config } from "@repo/config";
import {
	getDefaultSupabaseProvider,
	getSignedUploadUrl,
	shouldUseSupabaseStorage,
} from "@repo/storage";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

const getUploadUrlInputSchema = z.object({
	filename: z.string().min(1),
	contentType: z.string().min(1),
});

export const getUploadUrl = protectedProcedure
	.route({
		method: "POST",
		path: "/files/upload-url",
		tags: ["Files"],
		summary: "Get a signed upload URL",
		description:
			"Get a signed URL to upload a file directly to storage. After upload, call files.create to register the file.",
	})
	.input(getUploadUrlInputSchema)
	.handler(async ({ context: { session }, input }) => {
		const organizationId = session.activeOrganizationId;
		if (!organizationId) {
			throw new ORPCError("BAD_REQUEST", {
				message: "An active organization is required to upload files",
			});
		}

		const { filename, contentType } = input;

		// Generate a unique path: organizations/{orgId}/files/{timestamp}-{filename}
		const timestamp = Date.now();
		const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
		const path = `organizations/${organizationId}/files/${timestamp}-${sanitizedFilename}`;
		const bucket = config.storage.bucketNames.files;

		// Get signed upload URL
		let signedUploadUrl: string;

		if (shouldUseSupabaseStorage()) {
			const provider = getDefaultSupabaseProvider();
			signedUploadUrl = await provider.getSignedUploadUrl(path, {
				bucket,
				contentType,
				expiresIn: 300, // 5 minutes
			});
		} else {
			signedUploadUrl = await getSignedUploadUrl(path, { bucket });
		}

		return {
			signedUploadUrl,
			path,
			bucket,
		};
	});
