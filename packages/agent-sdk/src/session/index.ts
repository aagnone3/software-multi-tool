/**
 * Session infrastructure for multi-turn AI conversations
 *
 * This module provides the foundation for building conversational AI sessions
 * that can be invoked from various tool contexts.
 *
 * @example
 * ```typescript
 * import { AgentSession, type AgentSessionConfig } from "@repo/agent-sdk/session";
 *
 * // Define a session configuration
 * const feedbackConfig: AgentSessionConfig = {
 *   sessionType: "feedback-collector",
 *   name: "Feedback Collector",
 *   description: "Collects user feedback through conversation",
 *   systemPrompt: "You are a friendly assistant collecting user feedback...",
 *   initialMessage: "Hi! I'd love to hear about your experience.",
 * };
 *
 * // Create and use a session
 * const session = await AgentSession.create({
 *   config: feedbackConfig,
 *   context: { sessionId: "...", userId: "user123", toolSlug: "news-analyzer" }
 * });
 *
 * const result = await session.executeTurn("The analysis was great!");
 * ```
 */

// Example session configurations
export {
	createFeedbackCollectorConfig,
	type ExtractedFeedback,
	FEEDBACK_COLLECTOR_CONFIG,
	type FeedbackCollectorOptions,
	isExtractedFeedback,
} from "./examples";
// Persistence adapters
export {
	InMemorySessionPersistence,
	PrismaSessionPersistence,
} from "./persistence";
// Core session management
export { AgentSession } from "./session";
// Types
export type {
	AgentSessionConfig,
	AgentSessionState,
	CreateAgentSessionOptions,
	SessionContext,
	SessionMessage,
	SessionPersistenceAdapter,
	TurnResult,
} from "./types";
