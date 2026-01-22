/**
 * @repo/agent-sdk
 *
 * Shared Claude Agent SDK integration for the application.
 * Provides prompt execution, client configuration, skill documentation management,
 * and multi-turn conversational session infrastructure.
 */

// Client and prompt execution
export { createAnthropicClient, getAnthropicClient } from "./client";
export type { PromptOptions, PromptResult } from "./prompt";
export { executePrompt } from "./prompt";

// Skill documentation management (file-based)
export type { SkillDocumentation } from "./skill-docs";
export { listSkills, readSkillDocs, upsertSkillDocs } from "./skill-docs";

// Model configuration
export type { ClaudeModel } from "./src/models";
export {
	CLAUDE_MODELS,
	DEFAULT_MODEL,
	MODEL_RECOMMENDATIONS,
} from "./src/models";
// Example session configurations
export {
	createFeedbackCollectorConfig,
	type ExtractedFeedback,
	FEEDBACK_COLLECTOR_CONFIG,
	type FeedbackCollectorOptions,
	isExtractedFeedback,
} from "./src/session/examples";
// Persistence adapters
export {
	InMemorySessionPersistence,
	PrismaSessionPersistence,
} from "./src/session/persistence";
// Multi-turn conversational sessions
export { AgentSession } from "./src/session/session";
export type {
	AgentSessionConfig,
	AgentSessionState,
	CreateAgentSessionOptions,
	SessionContext,
	SessionMessage,
	SessionPersistenceAdapter,
	TurnResult,
} from "./src/session/types";
