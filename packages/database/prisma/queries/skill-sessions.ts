import type { Prisma, SkillSession } from "@prisma/client";
import { db } from "../client";

export interface SkillSessionCreateInput {
	id: string;
	skillId: string;
	userId: string;
	organizationId?: string;
	toolSlug?: string;
	jobId?: string;
	messages?: Prisma.InputJsonValue;
	context?: Prisma.InputJsonValue;
}

export interface SkillSessionUpdateInput {
	messages?: Prisma.InputJsonValue;
	context?: Prisma.InputJsonValue;
	extractedData?: Prisma.InputJsonValue;
	isComplete?: boolean;
	totalInputTokens?: number;
	totalOutputTokens?: number;
}

/**
 * Create a new skill session
 */
export async function createSkillSession(
	input: SkillSessionCreateInput,
): Promise<SkillSession> {
	return await db.skillSession.create({
		data: {
			id: input.id,
			skillId: input.skillId,
			userId: input.userId,
			organizationId: input.organizationId,
			toolSlug: input.toolSlug,
			jobId: input.jobId,
			messages: input.messages ?? [],
			context: input.context ?? {},
		},
	});
}

/**
 * Get a skill session by ID
 */
export async function getSkillSessionById(
	id: string,
): Promise<SkillSession | null> {
	return await db.skillSession.findUnique({
		where: { id },
	});
}

/**
 * Update a skill session
 */
export async function updateSkillSession(
	id: string,
	input: SkillSessionUpdateInput,
): Promise<SkillSession> {
	return await db.skillSession.update({
		where: { id },
		data: {
			messages: input.messages,
			context: input.context,
			extractedData: input.extractedData,
			isComplete: input.isComplete,
			totalInputTokens: input.totalInputTokens,
			totalOutputTokens: input.totalOutputTokens,
		},
	});
}

/**
 * Delete a skill session
 */
export async function deleteSkillSession(id: string): Promise<void> {
	await db.skillSession.delete({
		where: { id },
	});
}

/**
 * List skill sessions by user ID
 */
export async function getSkillSessionsByUserId({
	userId,
	limit = 50,
	offset = 0,
	skillId,
	isComplete,
}: {
	userId: string;
	limit?: number;
	offset?: number;
	skillId?: string;
	isComplete?: boolean;
}): Promise<SkillSession[]> {
	return await db.skillSession.findMany({
		where: {
			userId,
			...(skillId && { skillId }),
			...(isComplete !== undefined && { isComplete }),
		},
		orderBy: { updatedAt: "desc" },
		take: limit,
		skip: offset,
	});
}

/**
 * List skill sessions by skill ID
 */
export async function getSkillSessionsBySkillId({
	skillId,
	limit = 50,
	offset = 0,
	isComplete,
}: {
	skillId: string;
	limit?: number;
	offset?: number;
	isComplete?: boolean;
}): Promise<SkillSession[]> {
	return await db.skillSession.findMany({
		where: {
			skillId,
			...(isComplete !== undefined && { isComplete }),
		},
		orderBy: { updatedAt: "desc" },
		take: limit,
		skip: offset,
	});
}

/**
 * List skill sessions by tool slug
 */
export async function getSkillSessionsByToolSlug({
	toolSlug,
	limit = 50,
	offset = 0,
	isComplete,
}: {
	toolSlug: string;
	limit?: number;
	offset?: number;
	isComplete?: boolean;
}): Promise<SkillSession[]> {
	return await db.skillSession.findMany({
		where: {
			toolSlug,
			...(isComplete !== undefined && { isComplete }),
		},
		orderBy: { updatedAt: "desc" },
		take: limit,
		skip: offset,
	});
}

/**
 * List skill sessions by job ID
 */
export async function getSkillSessionsByJobId(
	jobId: string,
): Promise<SkillSession[]> {
	return await db.skillSession.findMany({
		where: { jobId },
		orderBy: { updatedAt: "desc" },
	});
}

/**
 * Count skill sessions by user
 */
export async function countSkillSessionsByUser(
	userId: string,
	skillId?: string,
): Promise<number> {
	return await db.skillSession.count({
		where: {
			userId,
			...(skillId && { skillId }),
		},
	});
}
