import { config } from "@repo/config";
import { getSignedUploadUrl } from "@repo/storage";
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

		// Uses auto-detection to choose Supabase or S3 based on environment
		const signedUploadUrl = await getSignedUploadUrl(path, {
			bucket: config.storage.bucketNames.avatars,
		});

		// Return both the URL and the path so frontend knows what was stored
		return { signedUploadUrl, path };
	});
