import type { AgentSession, Prisma } from "@prisma/client";
import { db } from "../client";

export interface AgentSessionCreateInput {
	id: string;
	sessionType: string;
	userId: string;
	organizationId?: string;
	toolSlug?: string;
	jobId?: string;
	messages?: Prisma.InputJsonValue;
	context?: Prisma.InputJsonValue;
}

export interface AgentSessionUpdateInput {
	messages?: Prisma.InputJsonValue;
	context?: Prisma.InputJsonValue;
	extractedData?: Prisma.InputJsonValue;
	isComplete?: boolean;
	totalInputTokens?: number;
	totalOutputTokens?: number;
}

/**
 * Create a new agent session
 */
export async function createAgentSession(
	input: AgentSessionCreateInput,
): Promise<AgentSession> {
	return await db.agentSession.create({
		data: {
			id: input.id,
			sessionType: input.sessionType,
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
 * Get an agent session by ID
 */
export async function getAgentSessionById(
	id: string,
): Promise<AgentSession | null> {
	return await db.agentSession.findUnique({
		where: { id },
	});
}

/**
 * Update an agent session
 */
export async function updateAgentSession(
	id: string,
	input: AgentSessionUpdateInput,
): Promise<AgentSession> {
	return await db.agentSession.update({
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
 * Delete an agent session
 */
export async function deleteAgentSession(id: string): Promise<void> {
	await db.agentSession.delete({
		where: { id },
	});
}

/**
 * List agent sessions by user ID
 */
export async function getAgentSessionsByUserId({
	userId,
	limit = 50,
	offset = 0,
	sessionType,
	isComplete,
}: {
	userId: string;
	limit?: number;
	offset?: number;
	sessionType?: string;
	isComplete?: boolean;
}): Promise<AgentSession[]> {
	return await db.agentSession.findMany({
		where: {
			userId,
			...(sessionType && { sessionType }),
			...(isComplete !== undefined && { isComplete }),
		},
		orderBy: { updatedAt: "desc" },
		take: limit,
		skip: offset,
	});
}

/**
 * List agent sessions by session type
 */
export async function getAgentSessionsBySessionType({
	sessionType,
	limit = 50,
	offset = 0,
	isComplete,
}: {
	sessionType: string;
	limit?: number;
	offset?: number;
	isComplete?: boolean;
}): Promise<AgentSession[]> {
	return await db.agentSession.findMany({
		where: {
			sessionType,
			...(isComplete !== undefined && { isComplete }),
		},
		orderBy: { updatedAt: "desc" },
		take: limit,
		skip: offset,
	});
}

/**
 * List agent sessions by tool slug
 */
export async function getAgentSessionsByToolSlug({
	toolSlug,
	limit = 50,
	offset = 0,
	isComplete,
}: {
	toolSlug: string;
	limit?: number;
	offset?: number;
	isComplete?: boolean;
}): Promise<AgentSession[]> {
	return await db.agentSession.findMany({
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
 * List agent sessions by job ID
 */
export async function getAgentSessionsByJobId(
	jobId: string,
): Promise<AgentSession[]> {
	return await db.agentSession.findMany({
		where: { jobId },
		orderBy: { updatedAt: "desc" },
	});
}

/**
 * Count agent sessions by user
 */
export async function countAgentSessionsByUser(
	userId: string,
	sessionType?: string,
): Promise<number> {
	return await db.agentSession.count({
		where: {
			userId,
			...(sessionType && { sessionType }),
		},
	});
}
