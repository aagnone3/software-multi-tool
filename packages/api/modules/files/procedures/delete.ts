import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import {
	getDefaultSupabaseProvider,
	shouldUseSupabaseStorage,
} from "@repo/storage";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

const deleteFileInputSchema = z.object({
	fileId: z.string().min(1),
});

export const deleteFile = protectedProcedure
	.route({
		method: "DELETE",
		path: "/files/{fileId}",
		tags: ["Files"],
		summary: "Delete a file",
		description:
			"Delete a file from storage and remove its database record. This is a hard delete.",
	})
	.input(deleteFileInputSchema)
	.handler(async ({ context: { session }, input }) => {
		const organizationId = session.activeOrganizationId;
		if (!organizationId) {
			throw new ORPCError("BAD_REQUEST", {
				message: "An active organization is required to delete files",
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
				message: "You do not have permission to delete this file",
			});
		}

		// Delete from storage
		if (shouldUseSupabaseStorage()) {
			const provider = getDefaultSupabaseProvider();
			try {
				await provider.delete(file.storagePath, file.bucket);
			} catch (error) {
				// Log but don't fail if storage delete fails
				// The file record will still be deleted to allow cleanup
				console.error("Failed to delete file from storage:", error);
			}
		}

		// Delete the database record (cascades to file_to_tag)
		await db.file.delete({
			where: { id: fileId },
		});

		return { success: true };
	});
