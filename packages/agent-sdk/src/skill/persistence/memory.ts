import type { SkillPersistenceAdapter, SkillSessionState } from "../types";

/**
 * In-memory persistence adapter for skill sessions.
 *
 * Useful for:
 * - Unit testing
 * - Development/prototyping
 * - Short-lived sessions that don't need durability
 *
 * @example
 * ```typescript
 * const persistence = new InMemorySkillPersistence();
 * const session = await SkillSession.create({
 *   config: mySkillConfig,
 *   context: { sessionId: "test-1", userId: "user123" },
 *   persistence,
 * });
 * ```
 */
export class InMemorySkillPersistence implements SkillPersistenceAdapter {
	private sessions: Map<string, SkillSessionState> = new Map();

	async save(state: SkillSessionState): Promise<void> {
		// Deep clone to avoid mutations affecting stored state
		this.sessions.set(state.id, JSON.parse(JSON.stringify(state)));
	}

	async load(sessionId: string): Promise<SkillSessionState | null> {
		const state = this.sessions.get(sessionId);
		if (!state) return null;

		// Deep clone and restore Date objects
		const cloned = JSON.parse(JSON.stringify(state));
		cloned.createdAt = new Date(cloned.createdAt);
		cloned.updatedAt = new Date(cloned.updatedAt);
		cloned.messages = cloned.messages.map(
			(m: SkillSessionState["messages"][number]) => ({
				...m,
				timestamp: new Date(m.timestamp),
			}),
		);

		return cloned;
	}

	async delete(sessionId: string): Promise<void> {
		this.sessions.delete(sessionId);
	}

	async listByUser(
		userId: string,
		options?: { limit?: number; offset?: number },
	): Promise<SkillSessionState[]> {
		const { limit = 50, offset = 0 } = options ?? {};

		const userSessions = Array.from(this.sessions.values())
			.filter((s) => s.context.userId === userId)
			.sort((a, b) => {
				const aTime =
					a.updatedAt instanceof Date
						? a.updatedAt.getTime()
						: new Date(a.updatedAt).getTime();
				const bTime =
					b.updatedAt instanceof Date
						? b.updatedAt.getTime()
						: new Date(b.updatedAt).getTime();
				return bTime - aTime;
			})
			.slice(offset, offset + limit);

		// Deep clone and restore Date objects
		return userSessions.map((state) => {
			const cloned = JSON.parse(JSON.stringify(state));
			cloned.createdAt = new Date(cloned.createdAt);
			cloned.updatedAt = new Date(cloned.updatedAt);
			cloned.messages = cloned.messages.map(
				(m: SkillSessionState["messages"][number]) => ({
					...m,
					timestamp: new Date(m.timestamp),
				}),
			);
			return cloned;
		});
	}

	async listBySkill(
		skillId: string,
		options?: { limit?: number; offset?: number },
	): Promise<SkillSessionState[]> {
		const { limit = 50, offset = 0 } = options ?? {};

		const skillSessions = Array.from(this.sessions.values())
			.filter((s) => s.skillId === skillId)
			.sort((a, b) => {
				const aTime =
					a.updatedAt instanceof Date
						? a.updatedAt.getTime()
						: new Date(a.updatedAt).getTime();
				const bTime =
					b.updatedAt instanceof Date
						? b.updatedAt.getTime()
						: new Date(b.updatedAt).getTime();
				return bTime - aTime;
			})
			.slice(offset, offset + limit);

		// Deep clone and restore Date objects
		return skillSessions.map((state) => {
			const cloned = JSON.parse(JSON.stringify(state));
			cloned.createdAt = new Date(cloned.createdAt);
			cloned.updatedAt = new Date(cloned.updatedAt);
			cloned.messages = cloned.messages.map(
				(m: SkillSessionState["messages"][number]) => ({
					...m,
					timestamp: new Date(m.timestamp),
				}),
			);
			return cloned;
		});
	}

	/**
	 * Clear all sessions (useful for testing)
	 */
	clear(): void {
		this.sessions.clear();
	}

	/**
	 * Get count of sessions (useful for testing)
	 */
	count(): number {
		return this.sessions.size;
	}
}
