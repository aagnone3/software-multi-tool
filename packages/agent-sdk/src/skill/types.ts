import type { ClaudeModel } from "../models";

/**
 * A single message in a skill conversation
 */
export interface SkillMessage {
	/**
	 * Role of the message sender
	 */
	role: "user" | "assistant";

	/**
	 * Text content of the message
	 */
	content: string;

	/**
	 * Timestamp when the message was created
	 */
	timestamp: Date;
}

/**
 * Context provided to a skill for execution
 */
export interface SkillContext {
	/**
	 * Unique identifier for this skill session
	 */
	sessionId: string;

	/**
	 * The user ID who initiated the skill
	 */
	userId: string;

	/**
	 * Optional organization ID context
	 */
	organizationId?: string;

	/**
	 * Tool slug if invoked from a tool context (e.g., "news-analyzer")
	 */
	toolSlug?: string;

	/**
	 * Job ID if invoked from a specific tool job
	 */
	jobId?: string;

	/**
	 * Arbitrary metadata to pass to the skill
	 */
	metadata?: Record<string, unknown>;
}

/**
 * Configuration options for a skill
 */
export interface SkillConfig {
	/**
	 * Unique identifier for this skill type
	 */
	skillId: string;

	/**
	 * Human-readable name for the skill
	 */
	name: string;

	/**
	 * Description of what the skill does
	 */
	description: string;

	/**
	 * System prompt for the AI to follow
	 */
	systemPrompt: string;

	/**
	 * Optional initial message from the assistant to start the conversation
	 */
	initialMessage?: string;

	/**
	 * Model to use for this skill
	 * @default "claude-3-5-haiku-20241022"
	 */
	model?: ClaudeModel;

	/**
	 * Maximum tokens for responses
	 * @default 1024
	 */
	maxTokens?: number;

	/**
	 * Temperature for response generation (0-1)
	 * @default 0.7
	 */
	temperature?: number;

	/**
	 * Maximum number of conversation turns allowed
	 * @default 20
	 */
	maxTurns?: number;
}

/**
 * Result of a skill turn (single exchange)
 */
export interface SkillTurnResult {
	/**
	 * The assistant's response message
	 */
	response: string;

	/**
	 * Whether the skill has completed its task
	 */
	isComplete: boolean;

	/**
	 * Extracted data from the conversation (if complete)
	 */
	extractedData?: Record<string, unknown>;

	/**
	 * Token usage for this turn
	 */
	usage: {
		inputTokens: number;
		outputTokens: number;
	};
}

/**
 * State of a skill session for persistence
 */
export interface SkillSessionState {
	/**
	 * Unique session identifier
	 */
	id: string;

	/**
	 * Skill identifier
	 */
	skillId: string;

	/**
	 * Session context
	 */
	context: SkillContext;

	/**
	 * Conversation history
	 */
	messages: SkillMessage[];

	/**
	 * Whether the skill session is complete
	 */
	isComplete: boolean;

	/**
	 * Extracted data (populated when complete)
	 */
	extractedData?: Record<string, unknown>;

	/**
	 * Cumulative token usage
	 */
	totalUsage: {
		inputTokens: number;
		outputTokens: number;
	};

	/**
	 * Session creation time
	 */
	createdAt: Date;

	/**
	 * Last update time
	 */
	updatedAt: Date;
}

/**
 * Options for creating a new skill session
 */
export interface CreateSkillSessionOptions {
	/**
	 * Skill configuration
	 */
	config: SkillConfig;

	/**
	 * Skill context
	 */
	context: SkillContext;

	/**
	 * Optional persistence adapter for saving session state
	 */
	persistence?: SkillPersistenceAdapter;
}

/**
 * Adapter interface for persisting skill sessions
 *
 * Implement this interface to store skill sessions in different backends
 * (e.g., database, Redis, in-memory for testing)
 */
export interface SkillPersistenceAdapter {
	/**
	 * Save a skill session state
	 */
	save(state: SkillSessionState): Promise<void>;

	/**
	 * Load a skill session state by ID
	 */
	load(sessionId: string): Promise<SkillSessionState | null>;

	/**
	 * Delete a skill session
	 */
	delete(sessionId: string): Promise<void>;

	/**
	 * List sessions by user ID
	 */
	listByUser(
		userId: string,
		options?: { limit?: number; offset?: number },
	): Promise<SkillSessionState[]>;

	/**
	 * List sessions by skill ID
	 */
	listBySkill(
		skillId: string,
		options?: { limit?: number; offset?: number },
	): Promise<SkillSessionState[]>;
}
