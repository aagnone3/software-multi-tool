import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

const addTagInputSchema = z.object({
	fileId: z.string().min(1),
	tagName: z.string().min(1).max(50).trim(),
});

export const addTag = protectedProcedure
	.route({
		method: "POST",
		path: "/files/{fileId}/tags",
		tags: ["Files"],
		summary: "Add a tag to a file",
		description:
			"Add a tag to a file. Creates the tag if it doesn't exist for the organization.",
	})
	.input(addTagInputSchema)
	.handler(async ({ context: { session }, input }) => {
		const organizationId = session.activeOrganizationId;
		if (!organizationId) {
			throw new ORPCError("BAD_REQUEST", {
				message: "An active organization is required to tag files",
			});
		}

		const { fileId, tagName } = input;

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
				message: "You do not have permission to tag this file",
			});
		}

		// Normalize tag name (lowercase for consistency)
		const normalizedTagName = tagName.toLowerCase();

		// Find or create the tag
		const tag = await db.fileTag.upsert({
			where: {
				organizationId_name: {
					organizationId,
					name: normalizedTagName,
				},
			},
			create: {
				organizationId,
				name: normalizedTagName,
			},
			update: {},
		});

		// Create the file-tag association if it doesn't exist
		await db.fileToTag.upsert({
			where: {
				fileId_tagId: {
					fileId,
					tagId: tag.id,
				},
			},
			create: {
				fileId,
				tagId: tag.id,
			},
			update: {},
		});

		return {
			tag: {
				id: tag.id,
				name: tag.name,
			},
		};
	});
