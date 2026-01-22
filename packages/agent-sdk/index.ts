/**
 * @repo/agent-sdk
 *
 * Shared Claude Agent SDK integration for the application.
 * Provides prompt execution, client configuration, skill documentation management,
 * and multi-turn conversational skill infrastructure.
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
// Example skills
export {
	createFeedbackCollectorConfig,
	type ExtractedFeedback,
	FEEDBACK_COLLECTOR_CONFIG,
	type FeedbackCollectorOptions,
	isExtractedFeedback,
} from "./src/skill/examples";
// Persistence adapters
export {
	InMemorySkillPersistence,
	PrismaSkillPersistence,
} from "./src/skill/persistence";
// Multi-turn conversational skills
export { SkillSession } from "./src/skill/session";
export type {
	CreateSkillSessionOptions,
	SkillConfig,
	SkillContext,
	SkillMessage,
	SkillPersistenceAdapter,
	SkillSessionState,
	SkillTurnResult,
} from "./src/skill/types";
