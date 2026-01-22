import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient } from "../../client";
import { DEFAULT_MODEL } from "../models";
import type {
	CreateSkillSessionOptions,
	SkillConfig,
	SkillContext,
	SkillMessage,
	SkillPersistenceAdapter,
	SkillSessionState,
	SkillTurnResult,
} from "./types";

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
	return `skill_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * SkillSession manages a multi-turn conversation with Claude for a specific skill.
 *
 * A SkillSession:
 * - Maintains conversation history
 * - Executes turns against the Claude API
 * - Optionally persists state via a SkillPersistenceAdapter
 * - Tracks completion and extracted data
 *
 * @example
 * ```typescript
 * const session = await SkillSession.create({
 *   config: feedbackCollectorConfig,
 *   context: { sessionId: "...", userId: "...", toolSlug: "news-analyzer" }
 * });
 *
 * // Execute turns
 * const result1 = await session.executeTurn("The analysis was helpful!");
 * const result2 = await session.executeTurn("It summarized the key points well");
 *
 * // Check if complete
 * if (session.isComplete()) {
 *   console.log(session.getExtractedData());
 * }
 * ```
 */
export class SkillSession {
	private readonly config: SkillConfig;
	private readonly context: SkillContext;
	private readonly persistence?: SkillPersistenceAdapter;
	private readonly client: Anthropic;

	private messages: SkillMessage[] = [];
	private complete = false;
	private extractedData?: Record<string, unknown>;
	private totalUsage = { inputTokens: 0, outputTokens: 0 };
	private createdAt: Date;
	private updatedAt: Date;

	private constructor(
		config: SkillConfig,
		context: SkillContext,
		persistence?: SkillPersistenceAdapter,
		client?: Anthropic,
	) {
		this.config = config;
		this.context = context;
		this.persistence = persistence;
		this.client = client ?? getAnthropicClient();
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}

	/**
	 * Create a new skill session
	 */
	static async create(
		options: CreateSkillSessionOptions,
		client?: Anthropic,
	): Promise<SkillSession> {
		const { config, context, persistence } = options;

		// Generate session ID if not provided
		const sessionContext: SkillContext = {
			...context,
			sessionId: context.sessionId || generateSessionId(),
		};

		const session = new SkillSession(
			config,
			sessionContext,
			persistence,
			client,
		);

		// Add initial message if configured
		if (config.initialMessage) {
			session.messages.push({
				role: "assistant",
				content: config.initialMessage,
				timestamp: new Date(),
			});
		}

		// Persist initial state
		if (persistence) {
			await persistence.save(session.getState());
		}

		return session;
	}

	/**
	 * Restore a skill session from persisted state
	 */
	static async restore(
		state: SkillSessionState,
		config: SkillConfig,
		persistence?: SkillPersistenceAdapter,
		client?: Anthropic,
	): Promise<SkillSession> {
		const session = new SkillSession(
			config,
			state.context,
			persistence,
			client,
		);

		session.messages = state.messages;
		session.complete = state.isComplete;
		session.extractedData = state.extractedData;
		session.totalUsage = state.totalUsage;
		session.createdAt = state.createdAt;
		session.updatedAt = state.updatedAt;

		return session;
	}

	/**
	 * Execute a single turn in the conversation
	 *
	 * @param userMessage - The user's message
	 * @returns The result of the turn including the assistant's response
	 */
	async executeTurn(userMessage: string): Promise<SkillTurnResult> {
		if (this.complete) {
			throw new Error("Cannot execute turn on completed session");
		}

		const maxTurns = this.config.maxTurns ?? 20;
		const currentTurns = this.messages.filter(
			(m) => m.role === "user",
		).length;

		if (currentTurns >= maxTurns) {
			throw new Error(`Maximum turns (${maxTurns}) reached`);
		}

		// Add user message to history
		const userMsg: SkillMessage = {
			role: "user",
			content: userMessage,
			timestamp: new Date(),
		};
		this.messages.push(userMsg);

		// Build messages for Claude API
		const apiMessages = this.messages.map((m) => ({
			role: m.role as "user" | "assistant",
			content: m.content,
		}));

		// Execute the turn
		const response = await this.client.messages.create({
			model: this.config.model ?? DEFAULT_MODEL,
			max_tokens: this.config.maxTokens ?? 1024,
			temperature: this.config.temperature ?? 0.7,
			system: this.buildSystemPrompt(),
			messages: apiMessages,
		});

		// Extract text content
		const responseText = response.content
			.filter((block) => block.type === "text")
			.map((block) => block.text)
			.join("");

		// Add assistant message to history
		const assistantMsg: SkillMessage = {
			role: "assistant",
			content: responseText,
			timestamp: new Date(),
		};
		this.messages.push(assistantMsg);

		// Update usage
		this.totalUsage.inputTokens += response.usage.input_tokens;
		this.totalUsage.outputTokens += response.usage.output_tokens;
		this.updatedAt = new Date();

		// Check for completion signal and extract data
		const { isComplete, extractedData } =
			this.parseCompletion(responseText);

		if (isComplete) {
			this.complete = true;
			this.extractedData = extractedData;
		}

		// Persist state
		if (this.persistence) {
			await this.persistence.save(this.getState());
		}

		return {
			response: responseText,
			isComplete: this.complete,
			extractedData: this.extractedData,
			usage: {
				inputTokens: response.usage.input_tokens,
				outputTokens: response.usage.output_tokens,
			},
		};
	}

	/**
	 * Build the system prompt with context
	 */
	private buildSystemPrompt(): string {
		const contextInfo: string[] = [];

		if (this.context.toolSlug) {
			contextInfo.push(`Tool: ${this.context.toolSlug}`);
		}

		if (this.context.jobId) {
			contextInfo.push(`Job ID: ${this.context.jobId}`);
		}

		if (this.context.metadata) {
			for (const [key, value] of Object.entries(this.context.metadata)) {
				contextInfo.push(`${key}: ${String(value)}`);
			}
		}

		let systemPrompt = this.config.systemPrompt;

		if (contextInfo.length > 0) {
			systemPrompt += `\n\nContext:\n${contextInfo.join("\n")}`;
		}

		// Add completion instruction
		systemPrompt += `

IMPORTANT: When you determine the conversation is complete (user has provided enough feedback or explicitly indicates they're done), include the following marker in your response:

[SKILL_COMPLETE]
{
  "summary": "brief summary of the conversation",
  "insights": ["key insight 1", "key insight 2"],
  ... any other relevant extracted data ...
}
[/SKILL_COMPLETE]

Continue the conversation naturally until you have gathered sufficient information or the user indicates they are finished.`;

		return systemPrompt;
	}

	/**
	 * Parse completion signal and extract data from response
	 */
	private parseCompletion(response: string): {
		isComplete: boolean;
		extractedData?: Record<string, unknown>;
	} {
		const completeMatch = response.match(
			/\[SKILL_COMPLETE\]\s*([\s\S]*?)\s*\[\/SKILL_COMPLETE\]/,
		);

		if (!completeMatch) {
			return { isComplete: false };
		}

		try {
			const extractedData = JSON.parse(completeMatch[1].trim());
			return { isComplete: true, extractedData };
		} catch {
			// If JSON parsing fails, just mark as complete without extracted data
			return {
				isComplete: true,
				extractedData: { rawExtraction: completeMatch[1].trim() },
			};
		}
	}

	/**
	 * Mark the session as complete with optional extracted data
	 */
	async markComplete(extractedData?: Record<string, unknown>): Promise<void> {
		this.complete = true;
		this.extractedData = extractedData;
		this.updatedAt = new Date();

		if (this.persistence) {
			await this.persistence.save(this.getState());
		}
	}

	/**
	 * Get the current session state for persistence
	 */
	getState(): SkillSessionState {
		return {
			id: this.context.sessionId,
			skillId: this.config.skillId,
			context: this.context,
			messages: this.messages,
			isComplete: this.complete,
			extractedData: this.extractedData,
			totalUsage: this.totalUsage,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}

	/**
	 * Get session ID
	 */
	getSessionId(): string {
		return this.context.sessionId;
	}

	/**
	 * Get skill ID
	 */
	getSkillId(): string {
		return this.config.skillId;
	}

	/**
	 * Check if the session is complete
	 */
	isComplete(): boolean {
		return this.complete;
	}

	/**
	 * Get extracted data (available when complete)
	 */
	getExtractedData(): Record<string, unknown> | undefined {
		return this.extractedData;
	}

	/**
	 * Get conversation history
	 */
	getMessages(): SkillMessage[] {
		return [...this.messages];
	}

	/**
	 * Get the full conversation as a formatted transcript
	 */
	getTranscript(): string {
		return this.messages
			.map((m) => `[${m.role.toUpperCase()}]: ${m.content}`)
			.join("\n\n");
	}

	/**
	 * Get total token usage
	 */
	getTotalUsage(): { inputTokens: number; outputTokens: number } {
		return { ...this.totalUsage };
	}

	/**
	 * Get the session context
	 */
	getContext(): SkillContext {
		return { ...this.context };
	}
}
