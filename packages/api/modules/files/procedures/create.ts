import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

const createFileInputSchema = z.object({
	filename: z.string().min(1).max(255),
	mimeType: z.string().min(1).max(100),
	size: z.number().int().min(0),
	storagePath: z.string().min(1).max(500),
	bucket: z.string().min(1).max(100),
});

export const createFile = protectedProcedure
	.route({
		method: "POST",
		path: "/files",
		tags: ["Files"],
		summary: "Create a file record",
		description:
			"Create a file record in the database after a successful upload to storage. This should be called after uploading a file using a signed upload URL.",
	})
	.input(createFileInputSchema)
	.handler(async ({ context: { user, session }, input }) => {
		const organizationId = session.activeOrganizationId;
		if (!organizationId) {
			throw new ORPCError("BAD_REQUEST", {
				message:
					"An active organization is required to create file records",
			});
		}

		const { filename, mimeType, size, storagePath, bucket } = input;

		// Check if a file with the same storage path already exists
		// If so, update it instead of creating a new one (supports avatar/logo overwrites)
		const existingFile = await db.file.findFirst({
			where: {
				organizationId,
				storagePath,
				bucket,
			},
		});

		if (existingFile) {
			// Update the existing record
			const updatedFile = await db.file.update({
				where: { id: existingFile.id },
				data: {
					filename,
					mimeType,
					size,
					userId: user.id,
				},
			});

			return {
				file: {
					id: updatedFile.id,
					filename: updatedFile.filename,
					mimeType: updatedFile.mimeType,
					size: updatedFile.size,
					storagePath: updatedFile.storagePath,
					bucket: updatedFile.bucket,
					createdAt: updatedFile.createdAt,
					updatedAt: updatedFile.updatedAt,
				},
			};
		}

		// Create a new file record
		const file = await db.file.create({
			data: {
				organizationId,
				userId: user.id,
				filename,
				mimeType,
				size,
				storagePath,
				bucket,
			},
		});

		return {
			file: {
				id: file.id,
				filename: file.filename,
				mimeType: file.mimeType,
				size: file.size,
				storagePath: file.storagePath,
				bucket: file.bucket,
				createdAt: file.createdAt,
				updatedAt: file.updatedAt,
			},
		};
	});
