/**
 * @repo/agent-sdk
 *
 * Shared Claude Agent SDK integration for the application.
 * Provides prompt execution, client configuration, and skill documentation management.
 */

export { createAnthropicClient, getAnthropicClient } from "./client";
export type { PromptOptions, PromptResult } from "./prompt";
export { executePrompt } from "./prompt";
export type { SkillDocumentation } from "./skill-docs";
export { listSkills, readSkillDocs, upsertSkillDocs } from "./skill-docs";
