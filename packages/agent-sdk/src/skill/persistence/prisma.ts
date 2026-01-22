import type {
	Prisma,
	SkillSession as PrismaSkillSession,
} from "@prisma/client";
import {
	createSkillSession,
	deleteSkillSession,
	getSkillSessionById,
	getSkillSessionsBySkillId,
	getSkillSessionsByUserId,
	updateSkillSession,
} from "@repo/database";
import type {
	SkillMessage,
	SkillPersistenceAdapter,
	SkillSessionState,
} from "../types";

/**
 * Convert a value to Prisma InputJsonValue
 */
function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
	// JSON.parse(JSON.stringify()) ensures the value is serializable JSON
	return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/**
 * Convert Prisma SkillSession to SkillSessionState
 */
function toSkillSessionState(
	prismaSession: PrismaSkillSession,
): SkillSessionState {
	const messages = prismaSession.messages as unknown as SkillMessage[];
	const context = prismaSession.context as unknown as Record<string, unknown>;

	return {
		id: prismaSession.id,
		skillId: prismaSession.skillId,
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
 * Prisma-based persistence adapter for skill sessions.
 *
 * Uses the database to persist skill sessions for long-term storage.
 *
 * @example
 * ```typescript
 * const persistence = new PrismaSkillPersistence();
 * const session = await SkillSession.create({
 *   config: feedbackConfig,
 *   context: { sessionId: "...", userId: "user123" },
 *   persistence,
 * });
 * ```
 */
export class PrismaSkillPersistence implements SkillPersistenceAdapter {
	async save(state: SkillSessionState): Promise<void> {
		const existingSession = await getSkillSessionById(state.id);

		if (existingSession) {
			// Update existing session
			await updateSkillSession(state.id, {
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
			await createSkillSession({
				id: state.id,
				skillId: state.skillId,
				userId: state.context.userId,
				organizationId: state.context.organizationId,
				toolSlug: state.context.toolSlug,
				jobId: state.context.jobId,
				messages: toInputJsonValue(state.messages),
				context: toInputJsonValue(state.context),
			});
		}
	}

	async load(sessionId: string): Promise<SkillSessionState | null> {
		const session = await getSkillSessionById(sessionId);

		if (!session) {
			return null;
		}

		return toSkillSessionState(session);
	}

	async delete(sessionId: string): Promise<void> {
		try {
			await deleteSkillSession(sessionId);
		} catch {
			// Ignore if session doesn't exist
		}
	}

	async listByUser(
		userId: string,
		options?: { limit?: number; offset?: number },
	): Promise<SkillSessionState[]> {
		const { limit = 50, offset = 0 } = options ?? {};

		const sessions = await getSkillSessionsByUserId({
			userId,
			limit,
			offset,
		});

		return sessions.map(toSkillSessionState);
	}

	async listBySkill(
		skillId: string,
		options?: { limit?: number; offset?: number },
	): Promise<SkillSessionState[]> {
		const { limit = 50, offset = 0 } = options ?? {};

		const sessions = await getSkillSessionsBySkillId({
			skillId,
			limit,
			offset,
		});

		return sessions.map(toSkillSessionState);
	}
}
