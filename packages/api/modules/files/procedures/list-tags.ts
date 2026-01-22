import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";

export const listTags = protectedProcedure
	.route({
		method: "GET",
		path: "/files/tags",
		tags: ["Files"],
		summary: "List all tags for the organization",
		description:
			"List all file tags for the current organization with file count for each tag.",
	})
	.handler(async ({ context: { session } }) => {
		const organizationId = session.activeOrganizationId;
		if (!organizationId) {
			throw new ORPCError("BAD_REQUEST", {
				message: "An active organization is required to list tags",
			});
		}

		// Get all tags with file counts
		const tags = await db.fileTag.findMany({
			where: { organizationId },
			include: {
				_count: {
					select: { files: true },
				},
			},
			orderBy: { name: "asc" },
		});

		return {
			tags: tags.map((tag) => ({
				id: tag.id,
				name: tag.name,
				fileCount: tag._count.files,
				createdAt: tag.createdAt,
			})),
		};
	});
