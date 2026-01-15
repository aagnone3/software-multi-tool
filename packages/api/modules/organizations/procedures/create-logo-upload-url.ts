import { config } from "@repo/config";
import { getDefaultSupabaseProvider } from "@repo/storage";
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
	.handler(async ({ context: { user } }) => {
		const provider = getDefaultSupabaseProvider();
		const signedUploadUrl = await provider.getSignedUploadUrl(
			`${user.id}.png`,
			{
				bucket: config.storage.bucketNames.avatars,
				contentType: "image/png",
				expiresIn: 60,
			},
		);

		return { signedUploadUrl };
	});
