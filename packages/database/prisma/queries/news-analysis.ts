import type { Prisma } from "@prisma/client";
import { db } from "../client";

export interface CreateNewsAnalysisInput {
	sourceUrl?: string;
	sourceText?: string;
	title?: string;
	analysis: Prisma.InputJsonValue;
	userId?: string;
	organizationId?: string;
}

/**
 * Create a NewsAnalysis record and optionally link it to a ToolJob
 */
export async function createNewsAnalysis(
	input: CreateNewsAnalysisInput,
	toolJobId?: string,
) {
	// Use a transaction to create the NewsAnalysis and link to ToolJob atomically
	return await db.$transaction(async (tx) => {
		const newsAnalysis = await tx.newsAnalysis.create({
			data: {
				sourceUrl: input.sourceUrl,
				sourceText: input.sourceText,
				title: input.title,
				analysis: input.analysis,
				userId: input.userId,
				organizationId: input.organizationId,
			},
		});

		// If a toolJobId is provided, link the NewsAnalysis to the ToolJob
		if (toolJobId) {
			await tx.toolJob.update({
				where: { id: toolJobId },
				data: { newsAnalysisId: newsAnalysis.id },
			});
		}

		return newsAnalysis;
	});
}

/**
 * Get a NewsAnalysis by its ID
 * Used for public sharing - no ownership checks at this layer
 */
export async function getNewsAnalysisById(id: string) {
	return await db.newsAnalysis.findUnique({
		where: { id },
		include: {
			user: {
				select: {
					name: true,
				},
			},
		},
	});
}

/**
 * Get a NewsAnalysis by ID with organization details
 */
export async function getNewsAnalysisByIdWithOrg(id: string) {
	return await db.newsAnalysis.findUnique({
		where: { id },
		include: {
			organization: {
				select: {
					name: true,
					slug: true,
				},
			},
			user: {
				select: {
					name: true,
				},
			},
		},
	});
}

/**
 * Check if a NewsAnalysis exists
 */
export async function newsAnalysisExists(id: string): Promise<boolean> {
	const count = await db.newsAnalysis.count({
		where: { id },
	});
	return count > 0;
}
