import type { ClaudeModel } from "../models";

/**
 * A single message in an agent session conversation
 */
export interface SessionMessage {
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
 * Context provided to an agent session for execution
 */
export interface SessionContext {
	/**
	 * Unique identifier for this session
	 */
	sessionId: string;

	/**
	 * The user ID who initiated the session
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
	 * Arbitrary metadata to pass to the session
	 */
	metadata?: Record<string, unknown>;
}

/**
 * Configuration options for an agent session
 */
export interface AgentSessionConfig {
	/**
	 * Unique identifier for this session type (e.g., "feedback-collector")
	 */
	sessionType: string;

	/**
	 * Human-readable name for the session type
	 */
	name: string;

	/**
	 * Description of what this session type does
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
	 * Model to use for this session
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
 * Result of a session turn (single exchange)
 */
export interface TurnResult {
	/**
	 * The assistant's response message
	 */
	response: string;

	/**
	 * Whether the session has completed its task
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
 * State of an agent session for persistence
 */
export interface AgentSessionState {
	/**
	 * Unique session identifier
	 */
	id: string;

	/**
	 * Session type identifier (e.g., "feedback-collector")
	 */
	sessionType: string;

	/**
	 * Session context
	 */
	context: SessionContext;

	/**
	 * Conversation history
	 */
	messages: SessionMessage[];

	/**
	 * Whether the session is complete
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
 * Options for creating a new agent session
 */
export interface CreateAgentSessionOptions {
	/**
	 * Session configuration
	 */
	config: AgentSessionConfig;

	/**
	 * Session context
	 */
	context: SessionContext;

	/**
	 * Optional persistence adapter for saving session state
	 */
	persistence?: SessionPersistenceAdapter;
}

/**
 * Adapter interface for persisting agent sessions
 *
 * Implement this interface to store sessions in different backends
 * (e.g., database, Redis, in-memory for testing)
 */
export interface SessionPersistenceAdapter {
	/**
	 * Save a session state
	 */
	save(state: AgentSessionState): Promise<void>;

	/**
	 * Load a session state by ID
	 */
	load(sessionId: string): Promise<AgentSessionState | null>;

	/**
	 * Delete a session
	 */
	delete(sessionId: string): Promise<void>;

	/**
	 * List sessions by user ID
	 */
	listByUser(
		userId: string,
		options?: { limit?: number; offset?: number },
	): Promise<AgentSessionState[]>;

	/**
	 * List sessions by session type
	 */
	listBySessionType(
		sessionType: string,
		options?: { limit?: number; offset?: number },
	): Promise<AgentSessionState[]>;
}
