import { config } from "@repo/config";
import {
	getDefaultSupabaseProvider,
	getSignedUploadUrl,
	shouldUseSupabaseStorage,
} from "@repo/storage";
import { protectedProcedure } from "../../../orpc/procedures";

export const createAvatarUploadUrl = protectedProcedure
	.route({
		method: "POST",
		path: "/users/avatar-upload-url",
		tags: ["Users"],
		summary: "Create avatar upload URL",
		description:
			"Create a signed upload URL to upload an avatar image to the storage bucket",
	})
	.handler(async ({ context: { user } }) => {
		// Path structure: users/{userId}/avatar.png
		// This ensures no collisions between users and supports overwriting
		const path = `users/${user.id}/avatar.png`;
		const bucket = config.storage.bucketNames.avatars;

		// Delete existing file first to avoid "resource already exists" error
		// This is a fallback in case upsert isn't working as expected
		if (shouldUseSupabaseStorage()) {
			const provider = getDefaultSupabaseProvider();
			try {
				// Check if file exists and delete it
				const exists = await provider.exists(path, bucket);
				if (exists) {
					await provider.delete(path, bucket);
				}
			} catch {
				// Ignore delete errors - file might not exist or we don't have permissions
				// The upload will either succeed (with upsert) or fail with a clearer error
			}
		}

		// Uses auto-detection to choose Supabase or S3 based on environment
		const signedUploadUrl = await getSignedUploadUrl(path, {
			bucket,
		});

		// Return both the URL and the path so frontend knows what was stored
		return { signedUploadUrl, path };
	});
