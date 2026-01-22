import type { AgentSessionState, SessionPersistenceAdapter } from "../types";

/**
 * In-memory persistence adapter for agent sessions.
 *
 * Useful for:
 * - Unit testing
 * - Development/prototyping
 * - Short-lived sessions that don't need durability
 *
 * @example
 * ```typescript
 * const persistence = new InMemorySessionPersistence();
 * const session = await AgentSession.create({
 *   config: mySessionConfig,
 *   context: { sessionId: "test-1", userId: "user123" },
 *   persistence,
 * });
 * ```
 */
export class InMemorySessionPersistence implements SessionPersistenceAdapter {
	private sessions: Map<string, AgentSessionState> = new Map();

	async save(state: AgentSessionState): Promise<void> {
		// Deep clone to avoid mutations affecting stored state
		this.sessions.set(state.id, JSON.parse(JSON.stringify(state)));
	}

	async load(sessionId: string): Promise<AgentSessionState | null> {
		const state = this.sessions.get(sessionId);
		if (!state) return null;

		// Deep clone and restore Date objects
		const cloned = JSON.parse(JSON.stringify(state));
		cloned.createdAt = new Date(cloned.createdAt);
		cloned.updatedAt = new Date(cloned.updatedAt);
		cloned.messages = cloned.messages.map(
			(m: AgentSessionState["messages"][number]) => ({
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
	): Promise<AgentSessionState[]> {
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
				(m: AgentSessionState["messages"][number]) => ({
					...m,
					timestamp: new Date(m.timestamp),
				}),
			);
			return cloned;
		});
	}

	async listBySessionType(
		sessionType: string,
		options?: { limit?: number; offset?: number },
	): Promise<AgentSessionState[]> {
		const { limit = 50, offset = 0 } = options ?? {};

		const typeSessions = Array.from(this.sessions.values())
			.filter((s) => s.sessionType === sessionType)
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
		return typeSessions.map((state) => {
			const cloned = JSON.parse(JSON.stringify(state));
			cloned.createdAt = new Date(cloned.createdAt);
			cloned.updatedAt = new Date(cloned.updatedAt);
			cloned.messages = cloned.messages.map(
				(m: AgentSessionState["messages"][number]) => ({
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
