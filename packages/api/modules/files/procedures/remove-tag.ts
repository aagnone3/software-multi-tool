import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

const removeTagInputSchema = z.object({
	fileId: z.string().min(1),
	tagId: z.string().min(1),
});

export const removeTag = protectedProcedure
	.route({
		method: "DELETE",
		path: "/files/{fileId}/tags/{tagId}",
		tags: ["Files"],
		summary: "Remove a tag from a file",
		description:
			"Remove a tag from a file. Does not delete the tag itself.",
	})
	.input(removeTagInputSchema)
	.handler(async ({ context: { session }, input }) => {
		const organizationId = session.activeOrganizationId;
		if (!organizationId) {
			throw new ORPCError("BAD_REQUEST", {
				message: "An active organization is required to untag files",
			});
		}

		const { fileId, tagId } = input;

		// Verify the file exists and belongs to the organization
		const file = await db.file.findUnique({
			where: { id: fileId },
		});

		if (!file) {
			throw new ORPCError("NOT_FOUND", {
				message: "File not found",
			});
		}

		if (file.organizationId !== organizationId) {
			throw new ORPCError("FORBIDDEN", {
				message: "You do not have permission to modify this file",
			});
		}

		// Verify the tag belongs to the organization
		const tag = await db.fileTag.findUnique({
			where: { id: tagId },
		});

		if (!tag || tag.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: "Tag not found",
			});
		}

		// Delete the file-tag association
		await db.fileToTag.deleteMany({
			where: {
				fileId,
				tagId,
			},
		});

		return { success: true };
	});
