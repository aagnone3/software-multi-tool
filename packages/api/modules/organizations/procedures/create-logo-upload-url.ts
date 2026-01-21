import { config } from "@repo/config";
import {
	buildOrgPath,
	getDefaultSupabaseProvider,
	getSignedUploadUrl,
	shouldUseSupabaseStorage,
} from "@repo/storage";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const createLogoUploadUrl = protectedProcedure
	.route({
		method: "POST",
		path: "/organizations/logo-upload-url",
		tags: ["Organizations"],
		summary: "Create logo upload URL",
		description:
			"Create a signed upload URL to upload a logo image to the storage bucket",
	})
	.input(
		z.object({
			organizationId: z.string().describe("The organization ID"),
		}),
	)
	.handler(async ({ input }) => {
		const { organizationId } = input;

		// Path structure: organizations/{orgId}/logo.png
		// This ensures no collisions between organizations and supports overwriting
		const path = buildOrgPath({
			organizationId,
			fileType: "logo.png",
		});
		const bucket = config.storage.bucketNames.avatars;

		// Delete existing file first to avoid "resource already exists" error
		// This is a fallback in case upsert isn't working as expected
		if (shouldUseSupabaseStorage()) {
			const provider = getDefaultSupabaseProvider();
			try {
				const exists = await provider.exists(path, bucket);
				if (exists) {
					await provider.delete(path, bucket);
				}
			} catch {
				// Ignore delete errors - file might not exist or we don't have permissions
			}
		}

		// Uses auto-detection to choose Supabase or S3 based on environment
		const signedUploadUrl = await getSignedUploadUrl(path, {
			bucket,
		});

		// Return both the URL and the path so frontend knows what was stored
		return { signedUploadUrl, path };
	});
