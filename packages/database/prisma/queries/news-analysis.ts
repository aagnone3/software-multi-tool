import { db } from "../client";

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
