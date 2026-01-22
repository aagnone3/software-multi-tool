import { ORPCError } from "@orpc/server";
import { db, type Prisma } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

/**
 * MIME type category mapping for filtering
 */
const MIME_CATEGORIES: Record<string, string[]> = {
	audio: ["audio/"],
	image: ["image/"],
	video: ["video/"],
	document: [
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument",
		"application/vnd.ms-excel",
		"application/vnd.ms-powerpoint",
		"text/plain",
		"text/markdown",
		"text/csv",
	],
	other: [], // Matches anything not in other categories
};

type MimeCategory = "audio" | "image" | "video" | "document" | "other";

function getMimeCategoryFilter(category: MimeCategory): string[] {
	return MIME_CATEGORIES[category];
}

const listFilesInputSchema = z.object({
	mimeCategory: z
		.enum(["audio", "image", "video", "document", "other"])
		.optional(),
	tagIds: z.array(z.string()).optional(),
	search: z.string().optional(),
	page: z.number().min(1).default(1),
	pageSize: z.number().min(1).max(100).default(20),
});

export const listFiles = protectedProcedure
	.route({
		method: "GET",
		path: "/files",
		tags: ["Files"],
		summary: "List files",
		description:
			"List files for the current organization with optional filtering by MIME type category, tags, and search",
	})
	.input(listFilesInputSchema)
	.handler(async ({ context: { session }, input }) => {
		const organizationId = session.activeOrganizationId;
		if (!organizationId) {
			throw new ORPCError("BAD_REQUEST", {
				message: "An active organization is required to list files",
			});
		}

		const { mimeCategory, tagIds, search, page, pageSize } = input;
		const skip = (page - 1) * pageSize;

		// Build where clause
		const where: Prisma.FileWhereInput = {
			organizationId,
		};

		// Filter by MIME type category
		if (mimeCategory) {
			if (mimeCategory === "other") {
				// Match files that don't start with any known category prefix
				const knownPrefixes = [
					...MIME_CATEGORIES.audio,
					...MIME_CATEGORIES.image,
					...MIME_CATEGORIES.video,
					...MIME_CATEGORIES.document,
				];
				where.NOT = {
					OR: knownPrefixes.map((prefix) => ({
						mimeType: { startsWith: prefix },
					})),
				};
			} else {
				const prefixes = getMimeCategoryFilter(mimeCategory);
				where.OR = prefixes.map((prefix) => ({
					mimeType: { startsWith: prefix },
				}));
			}
		}

		// Filter by tags (files must have ALL specified tags)
		if (tagIds && tagIds.length > 0) {
			where.tags = {
				some: {
					tagId: { in: tagIds },
				},
			};
		}

		// Search by filename
		if (search) {
			where.filename = {
				contains: search,
				mode: "insensitive",
			};
		}

		// Execute queries in parallel
		const [files, totalCount] = await Promise.all([
			db.file.findMany({
				where,
				include: {
					tags: {
						include: {
							tag: true,
						},
					},
					user: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
				orderBy: { createdAt: "desc" },
				skip,
				take: pageSize,
			}),
			db.file.count({ where }),
		]);

		// Transform the response
		const transformedFiles = files.map((file) => ({
			id: file.id,
			filename: file.filename,
			mimeType: file.mimeType,
			size: file.size,
			storagePath: file.storagePath,
			bucket: file.bucket,
			createdAt: file.createdAt,
			updatedAt: file.updatedAt,
			uploadedBy: file.user,
			tags: file.tags.map((ft) => ({
				id: ft.tag.id,
				name: ft.tag.name,
			})),
		}));

		return {
			files: transformedFiles,
			pagination: {
				page,
				pageSize,
				totalCount,
				totalPages: Math.ceil(totalCount / pageSize),
			},
		};
	});
