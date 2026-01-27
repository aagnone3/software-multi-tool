import {
	createAgentSession,
	deleteAgentSession,
	getAgentSessionById,
	getAgentSessionsBySessionType,
	getAgentSessionsByUserId,
	type Prisma,
	type AgentSession as PrismaAgentSession,
	updateAgentSession,
} from "@repo/database";
import type {
	AgentSessionState,
	SessionMessage,
	SessionPersistenceAdapter,
} from "../types";

/**
 * Convert a value to Prisma InputJsonValue
 */
function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
	// JSON.parse(JSON.stringify()) ensures the value is serializable JSON
	return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/**
 * Convert Prisma AgentSession to AgentSessionState
 */
function toAgentSessionState(
	prismaSession: PrismaAgentSession,
): AgentSessionState {
	const messages = prismaSession.messages as unknown as SessionMessage[];
	const context = prismaSession.context as unknown as Record<string, unknown>;

	return {
		id: prismaSession.id,
		sessionType: prismaSession.sessionType,
		context: {
			sessionId: prismaSession.id,
			userId: prismaSession.userId,
			organizationId: prismaSession.organizationId ?? undefined,
			toolSlug: prismaSession.toolSlug ?? undefined,
			jobId: prismaSession.jobId ?? undefined,
			metadata: context.metadata as Record<string, unknown> | undefined,
		},
		messages: messages.map((m) => ({
			...m,
			timestamp: new Date(m.timestamp),
		})),
		isComplete: prismaSession.isComplete,
		extractedData:
			(prismaSession.extractedData as Record<string, unknown>) ??
			undefined,
		totalUsage: {
			inputTokens: prismaSession.totalInputTokens,
			outputTokens: prismaSession.totalOutputTokens,
		},
		createdAt: prismaSession.createdAt,
		updatedAt: prismaSession.updatedAt,
	};
}

/**
 * Prisma-based persistence adapter for agent sessions.
 *
 * Uses the database to persist agent sessions for long-term storage.
 *
 * @example
 * ```typescript
 * const persistence = new PrismaSessionPersistence();
 * const session = await AgentSession.create({
 *   config: feedbackConfig,
 *   context: { sessionId: "...", userId: "user123" },
 *   persistence,
 * });
 * ```
 */
export class PrismaSessionPersistence implements SessionPersistenceAdapter {
	async save(state: AgentSessionState): Promise<void> {
		const existingSession = await getAgentSessionById(state.id);

		if (existingSession) {
			// Update existing session
			await updateAgentSession(state.id, {
				messages: toInputJsonValue(state.messages),
				context: toInputJsonValue(state.context),
				extractedData: state.extractedData
					? toInputJsonValue(state.extractedData)
					: undefined,
				isComplete: state.isComplete,
				totalInputTokens: state.totalUsage.inputTokens,
				totalOutputTokens: state.totalUsage.outputTokens,
			});
		} else {
			// Create new session
			await createAgentSession({
				id: state.id,
				sessionType: state.sessionType,
				userId: state.context.userId,
				organizationId: state.context.organizationId,
				toolSlug: state.context.toolSlug,
				jobId: state.context.jobId,
				messages: toInputJsonValue(state.messages),
				context: toInputJsonValue(state.context),
			});
		}
	}

	async load(sessionId: string): Promise<AgentSessionState | null> {
		const session = await getAgentSessionById(sessionId);

		if (!session) {
			return null;
		}

		return toAgentSessionState(session);
	}

	async delete(sessionId: string): Promise<void> {
		try {
			await deleteAgentSession(sessionId);
		} catch {
			// Ignore if session doesn't exist
		}
	}

	async listByUser(
		userId: string,
		options?: { limit?: number; offset?: number },
	): Promise<AgentSessionState[]> {
		const { limit = 50, offset = 0 } = options ?? {};

		const sessions = await getAgentSessionsByUserId({
			userId,
			limit,
			offset,
		});

		return sessions.map(toAgentSessionState);
	}

	async listBySessionType(
		sessionType: string,
		options?: { limit?: number; offset?: number },
	): Promise<AgentSessionState[]> {
		const { limit = 50, offset = 0 } = options ?? {};

		const sessions = await getAgentSessionsBySessionType({
			sessionType,
			limit,
			offset,
		});

		return sessions.map(toAgentSessionState);
	}
}
