/**
 * Skill infrastructure for multi-turn AI conversations
 *
 * This module provides the foundation for building conversational AI skills
 * that can be invoked from various tool contexts.
 *
 * @example
 * ```typescript
 * import { SkillSession, type SkillConfig } from "@repo/agent-sdk/skill";
 *
 * // Define a skill configuration
 * const feedbackConfig: SkillConfig = {
 *   skillId: "feedback-collector",
 *   name: "Feedback Collector",
 *   description: "Collects user feedback through conversation",
 *   systemPrompt: "You are a friendly assistant collecting user feedback...",
 *   initialMessage: "Hi! I'd love to hear about your experience.",
 * };
 *
 * // Create and use a session
 * const session = await SkillSession.create({
 *   config: feedbackConfig,
 *   context: { sessionId: "...", userId: "user123", toolSlug: "news-analyzer" }
 * });
 *
 * const result = await session.executeTurn("The analysis was great!");
 * ```
 */

// Example skill configurations
export {
	createFeedbackCollectorConfig,
	type ExtractedFeedback,
	FEEDBACK_COLLECTOR_CONFIG,
	type FeedbackCollectorOptions,
	isExtractedFeedback,
} from "./examples";
// Persistence adapters
export {
	InMemorySkillPersistence,
	PrismaSkillPersistence,
} from "./persistence";
// Core session management
export { SkillSession } from "./session";
// Types
export type {
	CreateSkillSessionOptions,
	SkillConfig,
	SkillContext,
	SkillMessage,
	SkillPersistenceAdapter,
	SkillSessionState,
	SkillTurnResult,
} from "./types";
